import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from '../store/toastStore'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Copy, Upload, CheckCircle2, ArrowLeft, Calendar, Phone, DollarSign, Check, ArrowRight } from 'lucide-react'
import { useLanguageStore } from '../store/languageStore'
import { translations } from '../utils/translations'
import { LanguageSelector } from '../components/ui/LanguageSelector'

export function Payment() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const updateProfile = useAuthStore((state) => state.updateProfile)
  const user = useAuthStore((state) => state.user)
  const { language } = useLanguageStore()
  const t = translations[language]

  // If coming from landing with a pre-selected plan use it, otherwise null to show selector
  const urlPlan = searchParams.get('plan')
  const urlPrice = searchParams.get('price')

  const [selectedPlan, setSelectedPlan] = useState(urlPlan || null)
  const [planPrice, setPlanPrice] = useState(urlPrice || null)

  // Plan selector data
  const planOptions = language === 'ar' ? [
    { duration: '1', name: 'شهر واحد', price: '499', period: 'شهر', popular: false },
    { duration: '2', name: 'شهران', price: '899', period: 'شهران', popular: true, badge: 'الأكثر طلباً' },
    { duration: '3', name: '3 أشهر', price: '1299', period: '3 أشهر', popular: false, saving: 'وفر 14%' },
  ] : [
    { duration: '1', name: '1 Month', price: '499', period: 'Month', popular: false },
    { duration: '2', name: '2 Months', price: '899', period: '2 Months', popular: true, badge: 'MOST POPULAR' },
    { duration: '3', name: '3 Months', price: '1299', period: '3 Months', popular: false, saving: 'SAVE 14%' },
  ]

  const [step, setStep] = useState(1)
  const [copiedMethod, setCopiedMethod] = useState(null)
  
  // Payment config methods fetched
  const [methods] = useState([
    { id: 1, name: 'Instapay', accountName: 'Mosab El-Sayed', number: 'mosabel@instapay', logo: 'I' },
    { id: 2, name: 'Vodafone Cash', accountName: 'Ahmed Mohamed', number: '01023456789', logo: 'V' },
    { id: 3, name: 'Orange Money', accountName: 'Ahmed Mohamed', number: '01234567890', logo: 'O' }
  ])
  const [selectedMethod, setSelectedMethod] = useState(methods[0])

  // Step 2 Form States
  const [amount, setAmount] = useState(planPrice)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleCopy = (text, methodName) => {
    navigator.clipboard.writeText(text)
    setCopiedMethod(methodName)
    toast.success(language === 'ar' ? `تم نسخ تفاصيل ${methodName} إلى الحافظة!` : `Copied ${methodName} details to clipboard!`)
    setTimeout(() => setCopiedMethod(null), 2500)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB maximum limit.')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG and WEBP image files are allowed.')
      return
    }

    setScreenshot(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const phoneRegex = /^01[0125][0-9]{8}$/
    if (!phoneRegex.test(phone)) {
      toast.error(language === 'ar' ? 'الرجاء إدخال رقم موبايل مصري صحيح (01XXXXXXXX).' : 'Please enter a valid Egyptian mobile format (01XXXXXXXX).')
      return
    }

    if (!screenshot) {
      toast.error(language === 'ar' ? 'الرجاء رفع صورة لتأكيد عملية الدفع.' : 'Please upload a screenshot of your payment confirmation.')
      return
    }

    setSubmitting(true)
    try {
      // Telegram Bot Notification Integration
      const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
      const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID

      if (botToken && chatId) {
        const caption = `🏋️‍♂️ COACH MOSAB - NEW PAYMENT 🏋️‍♂️\n\n` +
                        `👤 User: ${user?.full_name || 'N/A'}\n` +
                        `📧 Email: ${user?.email || 'N/A'}\n` +
                        `📱 Sender Phone: ${phone}\n` +
                        `💳 Channel: ${selectedMethod?.name || 'N/A'}\n` +
                        `💰 Amount: ${amount} EGP\n` +
                        `📅 Date: ${date}\n` +
                        `📝 Notes: ${notes || 'None'}`

        const formData = new FormData()
        formData.append('chat_id', chatId)
        formData.append('photo', screenshot)
        formData.append('caption', caption)

        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          method: 'POST',
          body: formData,
        })

        if (!tgRes.ok) {
          const errData = await tgRes.json()
          console.error('Telegram API error details:', errData)
          throw new Error(language === 'ar' ? 'فشل إرسال الإشعار لـ Telegram.' : 'Failed to send notification to Telegram.')
        }
      } else {
        console.warn('Telegram Credentials missing. Falling back to simulation mode.')
        await new Promise((resolve) => setTimeout(resolve, 1500))
      }
      
      // Update subscription status in store profile
      await updateProfile({
        subscription_status: 'pending',
        plan_duration: selectedPlan
      })

      setSuccess(true)
      toast.success(language === 'ar' ? 'تم رفع إثبات الدفع بنجاح!' : 'Your payment screenshot has been uploaded!')
    } catch (err) {
      toast.error(err.message || (language === 'ar' ? 'فشل إرسال الطلب.' : 'Submission failed.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] flex items-center justify-center p-6 relative font-dmsans select-none">
        <div className="noise-overlay" />
        <div className="absolute top-4 right-4 z-20">
          <LanguageSelector />
        </div>
        <div className="w-full max-w-md bg-[#111111] border border-[#1F1F1F] rounded-xl p-8 shadow-2xl text-center space-y-6 relative z-10">
          <div className="flex justify-center">
            <Link to="/">
              <img src="/logo.png" alt="Coach Mosab Logo" className="h-14 w-auto object-contain" />
            </Link>
          </div>
          <div className="w-16 h-16 bg-[#E8FF00]/10 border border-[#E8FF00]/30 rounded-full flex items-center justify-center mx-auto text-[#E8FF00] animate-bounce">
            <CheckCircle2 size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="font-bebas text-3xl tracking-wide">{t.submissionReceived}</h2>
            <p className="text-sm text-[#666666] leading-relaxed">
              {t.paymentPendingNotice}
            </p>
          </div>
          <Button onClick={() => navigate('/dashboard')} className="w-full font-bebas uppercase tracking-wider text-base py-3">
            {t.backToHome}
          </Button>
        </div>
      </div>
    )
  }

  // Plan not yet selected — show the plan picker first
  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] flex items-center justify-center p-6 relative font-dmsans select-none">
        <div className="noise-overlay" />
        <div className="absolute top-4 right-4 z-20">
          <LanguageSelector />
        </div>
        <div className="w-full max-w-2xl bg-[#111111] border border-[#1F1F1F] rounded-xl p-8 shadow-2xl relative z-10 space-y-8">
          <div className="flex justify-center">
            <Link to="/">
              <img src="/logo.png" alt="Coach Mosab Logo" className="h-14 w-auto object-contain" />
            </Link>
          </div>
          <div className="text-center space-y-1">
            <h2 className="font-bebas text-3xl tracking-wide uppercase">
              {language === 'ar' ? 'اختر خطة اشتراكك' : 'Choose Your Plan'}
            </h2>
            <p className="text-xs text-[#666666] font-bold uppercase tracking-wide">
              {language === 'ar' ? 'اختر المدة المناسبة لك قبل المتابعة' : 'Select a duration before proceeding to payment'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {planOptions.map((plan) => (
              <div
                key={plan.duration}
                className={`relative bg-[#161616] border rounded-xl p-6 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1 ${
                  plan.popular
                    ? 'border-[#E8FF00] shadow-[0_0_18px_rgba(232,255,0,0.07)]'
                    : 'border-[#1F1F1F] hover:border-[#E8FF00]/30'
                }`}
                onClick={() => { setSelectedPlan(plan.duration); setPlanPrice(plan.price) }}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E8FF00] text-[#0A0A0A] font-bold text-[10px] uppercase px-3 py-0.5 rounded tracking-wider shadow">
                    {plan.badge}
                  </div>
                )}
                {plan.saving && (
                  <div className="absolute top-3 right-3 bg-[#FF3A2D] text-[#F5F5F5] font-bold text-[9px] uppercase px-2 py-0.5 rounded tracking-wide">
                    {plan.saving}
                  </div>
                )}
                <div>
                  <h3 className="font-bebas text-xl text-[#666666] uppercase tracking-wider">{plan.name}</h3>
                  <div className="flex items-baseline mt-3 gap-1">
                    <span className="font-bebas text-5xl text-[#F5F5F5]">{plan.price}</span>
                    <span className="font-semibold text-base text-[#F5F5F5]">{language === 'ar' ? 'ج.م' : 'EGP'}</span>
                    <span className="text-[10px] text-[#666666] font-bold uppercase ml-1">/ {plan.period}</span>
                  </div>
                </div>
                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  className="mt-6 w-full font-bebas uppercase tracking-wider text-sm"
                  onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan.duration); setPlanPrice(plan.price) }}
                >
                  {language === 'ar' ? 'اختر هذه الخطة' : 'Select Plan'} <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] flex items-center justify-center p-6 relative font-dmsans select-none">
      <div className="noise-overlay" />
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-xl bg-[#111111] border border-[#1F1F1F] rounded-xl p-8 shadow-2xl relative z-10 space-y-6">
        <div className="flex justify-center">
          <Link to="/">
            <img src="/logo.png" alt="Coach Mosab Logo" className="h-14 w-auto object-contain" />
          </Link>
        </div>
        {/* Top summary header */}
        <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-4 text-left rtl:text-right">
          <div className="space-y-1">
            <h2 className="font-bebas text-3xl tracking-wide uppercase">{t.paymentTitle}</h2>
            <p className="text-xs text-[#666666] font-bold uppercase tracking-wide">
              {t.paymentSubtitle}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="accent" className="h-fit shrink-0">
              {selectedPlan === '1'
                ? (language === 'ar' ? 'شهر واحد' : '1 Month Plan')
                : selectedPlan === '2'
                ? (language === 'ar' ? 'شهران' : '2 Months Plan')
                : (language === 'ar' ? '3 أشهر' : '3 Months Plan')} — {planPrice} {language === 'ar' ? 'ج.م' : 'EGP'}
            </Badge>
            <button
              onClick={() => { setSelectedPlan(null); setPlanPrice(null); setStep(1) }}
              className="text-[10px] text-[#666666] hover:text-[#E8FF00] font-bold uppercase tracking-wider transition-colors cursor-pointer outline-none"
            >
              {language === 'ar' ? '← تغيير الخطة' : '← Change Plan'}
            </button>
          </div>
        </div>

        {step === 1 ? (
          /* Step 1 */
          <div className="space-y-6 text-left rtl:text-right">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">{t.selectPaymentChannel}</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {methods.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMethod(m)}
                    className={`p-4 rounded-lg bg-[#161616] border cursor-pointer flex flex-col justify-between h-24 hover:border-[#E8FF00]/40 transition-all ${
                      selectedMethod.id === m.id ? 'border-[#E8FF00] shadow-[0_0_10px_rgba(232,255,0,0.05)]' : 'border-[#1F1F1F]'
                    }`}
                  >
                    <div className="w-6 h-6 rounded bg-[#0A0A0A] flex items-center justify-center text-[10px] text-[#E8FF00] font-bold">
                      {m.logo}
                    </div>
                    <span className="font-bebas text-lg tracking-wide">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instruction Panel */}
            <div className="bg-[#161616] border border-[#1F1F1F] rounded-lg p-5 space-y-4">
              <h4 className="text-xs font-bold text-[#666666] uppercase tracking-wider">{t.sendPaymentTo}</h4>
              <div className="flex items-center justify-between bg-[#0A0A0A] border border-[#1F1F1F] p-3 rounded-lg">
                <div>
                  <span className="text-[10px] text-[#666666] uppercase tracking-wider font-bold block">{language === 'ar' ? 'الحساب: ' : 'Account: '}{selectedMethod.accountName}</span>
                  <span className="font-mono text-lg font-bold text-[#F5F5F5] tracking-wide">{selectedMethod.number}</span>
                </div>
                <button
                  onClick={() => handleCopy(selectedMethod.number, selectedMethod.name)}
                  className="p-2 bg-[#161616] hover:bg-[#1F1F1F] rounded border border-[#1F1F1F] text-[#666666] hover:text-[#E8FF00] transition-colors cursor-pointer outline-none"
                >
                  <Copy size={16} />
                </button>
              </div>

              <div className="text-xs text-[#666666] space-y-2 border-t border-[#1F1F1F] pt-4 leading-relaxed font-medium">
                <p>{t.paymentInstruction1}</p>
                <p>{t.paymentInstruction2}<span className="text-[#F5F5F5] font-semibold font-mono">{selectedMethod.number}</span></p>
                <p>{t.paymentInstruction3}<span className="text-[#E8FF00] font-bold">{planPrice} {language === 'ar' ? 'ج.م' : 'EGP'}</span></p>
                <p>{t.paymentInstruction4}</p>
              </div>
            </div>

            <Button onClick={() => setStep(2)} className="w-full font-bebas uppercase tracking-wider text-base py-3">
              {t.continueToUpload}
            </Button>
          </div>
        ) : (
          /* Step 2 */
          <form onSubmit={handleSubmit} className="space-y-5 text-left rtl:text-right">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs text-[#666666] hover:text-[#F5F5F5] font-bold uppercase transition-colors outline-none cursor-pointer"
              >
                <ArrowLeft size={14} className="rtl:rotate-180" /> {t.backBtn}
              </button>
              <Badge variant="accent">{language === 'ar' ? 'الوسيلة: ' : 'Method: '}{selectedMethod.name}</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">{t.amountPaid}</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-[#666666]" size={16} />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 pl-9 pr-4 rtl:pl-4 rtl:pr-9 text-sm text-[#F5F5F5] outline-none"
                    required
                    readOnly
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">{t.transactionDate}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-[#666666]" size={16} />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 pl-9 pr-4 rtl:pl-4 rtl:pr-9 text-sm text-[#F5F5F5] outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">{t.senderPhone}</label>
              <div className="relative">
                <Phone className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-[#666666]" size={16} />
                <input
                  type="tel"
                  placeholder="010XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 pl-9 pr-4 rtl:pl-4 rtl:pr-9 text-sm text-[#F5F5F5] outline-none focus:border-[#E8FF00]/40 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">{t.notesOptional}</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.notesPlaceholder}
                className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-4 text-sm text-[#F5F5F5] outline-none resize-none focus:border-[#E8FF00]/40 transition-colors"
              />
            </div>

            {/* Screenshot upload zone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">{t.transactionScreenshot}</label>
              <div className="border-2 border-dashed border-[#1F1F1F] bg-[#161616] rounded-xl p-6 text-center hover:border-[#E8FF00]/30 transition-colors relative cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                
                {screenshot ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="text-[#34D399] animate-pulse" size={32} />
                    <span className="text-xs font-semibold text-[#F5F5F5]">{screenshot.name}</span>
                    <span className="text-[10px] text-[#666666] font-bold">{(screenshot.size / 1024 / 1024).toFixed(2)} {language === 'ar' ? 'ميجابايت - اضغط للاستبدال' : 'MB - Tap to replace'}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="text-[#666666]" size={32} />
                    <span className="text-xs font-semibold text-[#F5F5F5]">{t.uploadPlaceholder}</span>
                    <span className="text-[10px] text-[#666666]">{t.uploadHelp}</span>
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" loading={submitting} className="w-full font-bebas uppercase tracking-wider text-base py-3 mt-2">
              {t.sendForReview}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

export default Payment
