import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import { Button } from '../components/ui/Button'
import { Mail, Lock, User, Phone } from 'lucide-react'
import { useLanguageStore } from '../store/languageStore'
import { translations } from '../utils/translations'
import { LanguageSelector } from '../components/ui/LanguageSelector'

export function Register() {
  const navigate = useNavigate()
  const register = useAuthStore((state) => state.register)
  const loading = useAuthStore((state) => state.loading)
  const { language } = useLanguageStore()
  const t = translations[language]

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [fitnessLevel, setFitnessLevel] = useState('beginner')

  const [searchParams] = useSearchParams()
  const plan = searchParams.get('plan')
  const price = searchParams.get('price')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Egyptian phone formats (010, 011, 012, 015 followed by 8 digits)
    const phoneRegex = /^01[0125][0-9]{8}$/
    if (!phoneRegex.test(phone)) {
      toast.error(language === 'ar' ? 'أدخل رقم موبايل مصري صحيح (مثال: 010XXXXXXXX).' : 'Enter a valid Egyptian phone format (e.g. 010XXXXXXXX).')
      return
    }

    try {
      await register(email, password, fullName, phone, fitnessLevel)
      toast.success('Registration successful!')
      if (plan && price) {
        navigate(`/payment?plan=${plan}&price=${price}`)
      } else {
        navigate('/payment')
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed.')
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] flex items-center justify-center p-6 relative font-dmsans select-none">
      <div className="noise-overlay" />

      {/* Top right language switch */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-md bg-[#111111] border border-[#1F1F1F] rounded-xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="Coach Mosab Logo" className="h-16 w-auto object-contain mx-auto" />
          </Link>
          <p className="text-xs text-[#666666] font-bold uppercase tracking-widest">
            {t.registerTitle}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left rtl:text-right">
            <label className="text-xs font-bold text-[#666666] uppercase tracking-wider">{t.fullName}</label>
            <div className="relative">
              <User className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-[#666666]" size={16} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ahmed Mohamed"
                className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 pl-10 pr-4 rtl:pl-4 rtl:pr-10 text-sm text-[#F5F5F5] placeholder-[#666666] focus:border-[#E8FF00]/50 outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left rtl:text-right">
            <label className="text-xs font-bold text-[#666666] uppercase tracking-wider">{t.emailAddress}</label>
            <div className="relative">
              <Mail className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-[#666666]" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 pl-10 pr-4 rtl:pl-4 rtl:pr-10 text-sm text-[#F5F5F5] placeholder-[#666666] focus:border-[#E8FF00]/50 outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left rtl:text-right">
            <label className="text-xs font-bold text-[#666666] uppercase tracking-wider">{t.egyPhone}</label>
            <div className="relative">
              <Phone className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-[#666666]" size={16} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 pl-10 pr-4 rtl:pl-4 rtl:pr-10 text-sm text-[#F5F5F5] placeholder-[#666666] focus:border-[#E8FF00]/50 outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left rtl:text-right">
            <label className="text-xs font-bold text-[#666666] uppercase tracking-wider">{t.password}</label>
            <div className="relative">
              <Lock className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-[#666666]" size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 pl-10 pr-4 rtl:pl-4 rtl:pr-10 text-sm text-[#F5F5F5] placeholder-[#666666] focus:border-[#E8FF00]/50 outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left rtl:text-right">
            <label className="text-xs font-bold text-[#666666] uppercase tracking-wider">{t.fitnessExp}</label>
            <select
              value={fitnessLevel}
              onChange={(e) => setFitnessLevel(e.target.value)}
              className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] focus:border-[#E8FF00]/50 outline-none transition-colors cursor-pointer"
            >
              <option value="beginner">{language === 'ar' ? "مبتدئ (تأسيس ونحت القوام)" : "Beginner (Foundation Shred)"}</option>
              <option value="intermediate">{language === 'ar' ? "متوسط (ضخامة عضلية)" : "Intermediate (Hypertrophy Bulk)"}</option>
              <option value="advanced">{language === 'ar' ? "متقدم (تنشيف وقوة مطلقة)" : "Advanced (Elite Conditioning)"}</option>
            </select>
          </div>

          <Button type="submit" loading={loading} className="w-full font-bebas tracking-wide text-base mt-2 py-3">
            {t.registerPayButton}
          </Button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs text-[#666666]">
          {t.haveAccount}{' '}
          <Link to="/login" className="text-[#E8FF00] font-bold hover:underline">
            {t.loginHere}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register
