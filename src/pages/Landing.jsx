import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Check, 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Award,
  Globe
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { useLanguageStore } from '../store/languageStore'
import { translations } from '../utils/translations'
import { LanguageSelector } from '../components/ui/LanguageSelector'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

// Animated intersection count-up counter component
function Counter({ endValue, duration = 1500, suffix = "" }) {
  const [count, setCount] = useState(0)
  const elementRef = useRef(null)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasStarted(true)
        }
      },
      { threshold: 0.1 }
    )
    if (elementRef.current) observer.observe(elementRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!hasStarted) return
    let start = 0
    const end = parseInt(endValue, 10)
    if (isNaN(end)) return
    
    const step = Math.ceil(end / (duration / 25))
    const timer = setInterval(() => {
      start += step
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(start)
      }
    }, 25)

    return () => clearInterval(timer)
  }, [hasStarted, endValue, duration])

  return (
    <span ref={elementRef} className="font-bebas text-5xl md:text-6xl text-[#E8FF00] tracking-wider block">
      {count}{suffix}
    </span>
  )
}

function ClientTransformationCard({ trans, language }) {
  const [activeAngle, setActiveAngle] = useState('front')
  const [isHovered, setIsHovered] = useState(false)

  const availableViews = useMemo(() => {
    const views = ['front']
    if (trans.before_side_url || trans.after_side_url) {
      views.push('side')
    }
    if (trans.before_back_url || trans.after_back_url) {
      views.push('back')
    }
    return views
  }, [trans])

  // Auto cycle on hover
  useEffect(() => {
    if (!isHovered || availableViews.length <= 1) return

    const interval = setInterval(() => {
      setActiveAngle((prev) => {
        const currentIndex = availableViews.indexOf(prev)
        const nextIndex = (currentIndex + 1) % availableViews.length
        return availableViews[nextIndex]
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [isHovered, availableViews])

  return (
    <div 
      className="bg-[#111111] border border-[#1F1F1F] rounded-2xl overflow-hidden hover:border-[#E8FF00]/40 transition-all duration-300 flex flex-col group hover:-translate-y-1.5 shadow-xl hover:shadow-[0_10px_30px_rgba(232,255,0,0.02)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setActiveAngle('front') // Reset to front on leave
      }}
    >
      {/* Before/After vertical shape side-by-side images container */}
      <div className="relative flex items-stretch aspect-[4/3] w-full overflow-hidden bg-black border-b border-[#1F1F1F]">
        
        {/* Float views indicators / toggle pill */}
        {availableViews.length > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded-full z-30 transition-all duration-300 opacity-0 group-hover:opacity-100">
            {availableViews.map((angle) => (
              <button
                type="button"
                key={angle}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setActiveAngle(angle)
                }}
                onMouseEnter={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setActiveAngle(angle)
                }}
                className={`px-3 py-0.5 text-[9px] font-bebas tracking-wider uppercase rounded-full transition-all duration-300 cursor-pointer ${
                  activeAngle === angle
                    ? 'bg-[#E8FF00] text-black font-bold'
                    : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
                }`}
              >
                {language === 'ar' ? (angle === 'front' ? 'أمام' : angle === 'side' ? 'جانب' : 'خلف') : angle}
              </button>
            ))}
          </div>
        )}

        {/* Before Half */}
        <div className="flex-1 relative overflow-hidden h-full">
          {availableViews.map((angle) => {
            const imgUrl = angle === 'side' ? (trans.before_side_url || trans.before_image_url) :
                           angle === 'back' ? (trans.before_back_url || trans.before_image_url) :
                           trans.before_image_url
            return (
              <img
                key={angle}
                src={imgUrl}
                alt={`Before ${angle}`}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                  activeAngle === angle ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-95'
                } group-hover:scale-105 transition-transform duration-500`}
              />
            )
          })}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10" />
          <span className="absolute bottom-3 left-3 bg-[#FF3A2D] text-white font-bebas text-xs tracking-wider uppercase px-2.5 py-0.5 rounded shadow-md z-10">
            {language === 'ar' ? 'قبل' : 'Before'}
          </span>
        </div>

        {/* Divider Line */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-[#E8FF00]/70 z-20 shadow-[0_0_10px_rgba(232,255,0,0.5)]" />

        {/* After Half */}
        <div className="flex-1 relative overflow-hidden h-full">
          {availableViews.map((angle) => {
            const imgUrl = angle === 'side' ? (trans.after_side_url || trans.after_image_url) :
                           angle === 'back' ? (trans.after_back_url || trans.after_image_url) :
                           trans.after_image_url
            return (
              <img
                key={angle}
                src={imgUrl}
                alt={`After ${angle}`}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                  activeAngle === angle ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-95'
                } group-hover:scale-105 transition-transform duration-500`}
              />
            )
          })}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10" />
          <span className="absolute bottom-3 right-3 bg-[#E8FF00] text-black font-bebas text-xs tracking-wider uppercase px-2.5 py-0.5 rounded shadow-md z-10">
            {language === 'ar' ? 'بعد' : 'After'}
          </span>
        </div>
      </div>

      {/* Info details */}
      <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2.5 items-center">
            {(trans.type_en || trans.type_ar) && (
              <span className="bg-[#E8FF00]/10 border border-[#E8FF00]/25 text-[#E8FF00] font-bebas text-xs uppercase px-3 py-1 rounded-full tracking-wide">
                {language === 'ar' ? (trans.type_ar || trans.type_en) : (trans.type_en || trans.type_ar)}
              </span>
            )}
            <span className="bg-[#161616] border border-[#1F1F1F] text-[#666666] font-bebas text-xs uppercase px-3 py-1 rounded-full tracking-wide">
              ⏱️ {language === 'ar' ? trans.duration_ar : trans.duration_en}
            </span>
          </div>

          {(trans.description_en || trans.description_ar) && (
            <p className="text-sm text-[#F5F5F5] font-dmsans leading-relaxed">
              {language === 'ar' ? (trans.description_ar || trans.description_en) : (trans.description_en || trans.description_ar)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function Landing() {
  const navigate = useNavigate()
  const { language } = useLanguageStore()
  const t = translations[language]
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const user = useAuthStore((state) => state.user)

  const [transformations, setTransformations] = useState([])
  const [loadingTrans, setLoadingTrans] = useState(true)
  const [testimonials, setTestimonials] = useState([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(true)

  useEffect(() => {
    const fetchTrans = async () => {
      try {
        const { data, error } = await supabase
          .from('transformations')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false })
        if (!error && data) {
          setTransformations(data)
        }
      } catch (err) {
        console.error('Error fetching transformations:', err)
      } finally {
        setLoadingTrans(false)
      }
    }

    const fetchTestimonials = async () => {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false })
        if (!error && data) {
          setTestimonials(data)
        }
      } catch (err) {
        console.error('Error fetching testimonials:', err)
      } finally {
        setLoadingTestimonials(false)
      }
    }

    fetchTrans()
    fetchTestimonials()
  }, [])

  // Auto scroll testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  const pricingTiers = language === 'ar' ? [
    {
      name: "شهر واحد",
      price: "499",
      duration: "1",
      period: "شهر",
      popular: false,
      features: [
        "برنامج تمارين أسبوعي مخصص لك",
        "جدول تغذية وحساب ماكروز مخصص",
        "الوصول لجدول بدائل الوجبات المرن",
        "الوصول الكامل لمكتبة الفيديوهات",
        "نموذج متابعة وقياسات أسبوعي",
        "دعم فني عبر لوحة التحكم"
      ]
    },
    {
      name: "شهران",
      price: "899",
      duration: "2",
      period: "شهران",
      popular: true,
      badge: "الأكثر طلباً",
      features: [
        "جميع مميزات اشتراك شهر واحد",
        "أولوية المراجعة اليدوية من الكوتش",
        "بث مباشر دوري للرد على الأسئلة",
        "رسوم بيانية وإحصائيات متقدمة للوزن والتمارين",
        "الوصول لمجتمع المشتركين الخاص",
        "الدخول لجروب الواتساب والتليجرام"
      ]
    },
    {
      name: "3 أشهر",
      price: "1,299",
      duration: "3",
      period: "3 أشهر",
      popular: false,
      saving: "وفر 14%",
      features: [
        "جميع مميزات اشتراك شهرين",
        "أسعار ثابتة ومحمية لمدة 3 أشهر",
        "متابعة دورية شخصية 1-على-1 من المدرب",
        "أولوية قصوى للرد على الدعم الفني",
        "إمكانية تصدير قياساتك لملف PDF"
      ]
    }
  ] : [
    {
      name: "1 Month",
      price: "499",
      duration: "1",
      period: "Month",
      popular: false,
      features: [
        "Personalized Weekly Workout Builder",
        "Customized Diet Sheet & Macro Targets",
        "Alternatives & Swaps sheet access",
        "Access to Video Library",
        "Weekly Progress check-in tracker",
        "Support via platform settings"
      ]
    },
    {
      name: "2 Months",
      price: "899",
      duration: "2",
      period: "2 Months",
      popular: true,
      badge: "MOST POPULAR",
      features: [
        "All features in 1-Month Plan",
        "Direct Coach manual review priority",
        "Dedicated Live Q&A Sessions",
        "Advanced workout stats & history charts",
        "Access to elite community",
        "WhatsApp & Telegram group access"
      ]
    },
    {
      name: "3 Months",
      price: "1,299",
      duration: "3",
      period: "3 Months",
      popular: false,
      saving: "SAVE 14%",
      features: [
        "All features in 2-Month Plan",
        "Full 3-month locked-in pricing",
        "1-on-1 direct coaching review logs",
        "Instant support priority response",
        "Personalized PDF progress logs export"
      ]
    }
  ]

  const paymentMethodsLogos = [
    { name: "Instapay", logo: "/icons/instapay.png", text: "Instapay" },
    { name: "Vodafone Cash", logo: "/icons/vodafone.png", text: "Vodafone Cash" },
    { name: "Orange Money", logo: "/icons/orange.png", text: "Orange Money" },
    { name: "Etisalat Cash", logo: "/icons/etisalat.png", text: "Etisalat Cash" },
    { name: "WE Pay", logo: "/icons/we.png", text: "WE Pay" }
  ]



  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] overflow-hidden select-none font-dmsans relative">
      <div className="noise-overlay" />

      {/* Hero Section */}
      <section className="relative h-screen w-full flex flex-col justify-between items-center text-center px-6 md:px-12 py-8 overflow-hidden border-b border-[#1F1F1F]">
        {/* Background Image with Dark Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 opacity-40 scale-105"
          style={{ backgroundImage: `url('/hero_athlete.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/70 to-[#0A0A0A] z-0" />

        {/* Top Navbar */}
        <header className="w-full max-w-7xl mx-auto flex items-center justify-between z-20 relative">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="Coach Mosab Logo" className="h-12 md:h-14 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-3 md:gap-5">
            <LanguageSelector />
            <Link to="/login" className="text-xs md:text-sm font-semibold hover:text-[#E8FF00] transition-colors whitespace-nowrap">
              {t.signIn}
            </Link>
            <Button variant="accentGhost" size="sm" onClick={() => navigate('/register')} className="text-xs md:text-sm py-1 md:py-1.5">
              {t.register}
            </Button>
          </div>
        </header>

        {/* Headline */}
        <div className="max-w-4xl mx-auto flex-1 flex flex-col justify-center items-center z-10 relative px-4 mt-8 md:mt-0">
          <h1 className="font-bebas text-6xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tight uppercase text-[#F5F5F5]">
            {t.heroTitle1} <br className="hidden md:block"/>
            <span className="text-[#E8FF00] text-stroke-accent">{t.heroTitle2}</span>
          </h1>
          <p className="mt-6 text-base md:text-lg lg:text-xl text-[#666666] max-w-2xl font-medium tracking-wide">
            {t.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button size="lg" onClick={() => navigate('/register')} className="px-10">
              {t.startNow}
            </Button>
            <Button variant="outline" size="lg" onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })} className="px-10">
              {t.seePrograms}
            </Button>
          </div>
        </div>

        {/* Scrolling Ticker Marquee */}
        <div className="w-full border-t border-[#1F1F1F] bg-[#0A0A0A]/85 backdrop-blur-sm py-4 overflow-hidden z-10 relative">
          <div className="animate-marquee flex gap-8 whitespace-nowrap text-xl md:text-2xl font-bebas tracking-widest text-[#666666]">
            {Array(10).fill(t.marqueeText).map((text, idx) => (
              <span key={idx} className="hover:text-[#E8FF00] transition-colors">{text}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#111111] border-b border-[#1F1F1F] py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <Counter endValue="500" suffix="+" />
            <p className="text-xs uppercase text-[#666666] font-bold tracking-widest mt-2">{t.activeClients}</p>
          </div>
          <div>
            <Counter endValue="3" suffix="" />
            <p className="text-xs uppercase text-[#666666] font-bold tracking-widest mt-2">{t.fitnessLevels}</p>
          </div>
          <div>
            <Counter endValue="200" suffix="+" />
            <p className="text-xs uppercase text-[#666666] font-bold tracking-widest mt-2">{t.workoutRoutines}</p>
          </div>
          <div>
            <Counter endValue="98" suffix="%" />
            <p className="text-xs uppercase text-[#666666] font-bold tracking-widest mt-2">{t.clientSatisfaction}</p>
          </div>
        </div>
      </section>

      {/* About the Coach */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto border-b border-[#1F1F1F]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="font-bebas text-sm md:text-base text-[#E8FF00] tracking-widest block uppercase">
              {t.aboutLabel}
            </span>
            <h2 className="font-bebas text-4xl md:text-5xl lg:text-6xl text-[#F5F5F5] uppercase tracking-wide leading-tight">
              {t.aboutTitle}
            </h2>
            <p className="text-[#666666] text-base md:text-lg leading-relaxed font-medium">
              {t.aboutDesc1}
            </p>
            <p className="text-[#666666] text-base leading-relaxed">
              {t.aboutDesc2}
            </p>
            
            {/* Badges/Certs */}
            <div className="pt-4 flex flex-wrap gap-2.5">
              <Badge variant="accent" className="py-1 px-3">{t.certIssa}</Badge>
              <Badge variant="accent" className="py-1 px-3">{t.certNutrition}</Badge>
              <Badge variant="accent" className="py-1 px-3">{t.certWeight}</Badge>
              <Badge variant="accent" className="py-1 px-3">{t.certAthlete}</Badge>
            </div>
          </div>

          <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
            <div 
              className="w-full max-w-md h-[400px] md:h-[500px] bg-cover bg-center border border-[#1F1F1F] rounded-lg shadow-xl relative overflow-hidden"
              style={{ 
                backgroundImage: `url('/coach_mosab.png')`,
                clipPath: 'polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)' 
              }}
            />
            <div className="absolute bottom-4 left-4 bg-[#111111]/90 border border-[#1F1F1F] rounded px-4 py-2 font-bebas text-[#E8FF00] tracking-wider text-lg">
              EST. 2023
            </div>
          </div>
        </div>
      </section>





      {/* Client Transformations Section */}
      {transformations.length > 0 && (
        <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto border-b border-[#1F1F1F] relative">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <span className="font-bebas text-sm text-[#E8FF00] tracking-widest block uppercase">
                {language === 'ar' ? 'النتائج والتحولات' : 'RESULTS & EVOLUTIONS'}
              </span>
              <h2 className="font-bebas text-4xl md:text-5xl lg:text-6xl text-[#F5F5F5] uppercase tracking-wide">
                {t.transformationsTitle}
              </h2>
              <p className="text-[#666666] max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                {t.transformationsSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {transformations.map((trans) => (
                <ClientTransformationCard 
                  key={trans.id} 
                  trans={trans} 
                  language={language} 
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Carousel */}
      {testimonials.length > 0 && (
        <section className="py-20 px-6 md:px-12 bg-[#111111]/30 border-b border-[#1F1F1F]">
          <div className="max-w-4xl mx-auto space-y-8 relative">
            <div className="text-center space-y-4">
              <span className="font-bebas text-sm text-[#E8FF00] tracking-widest block uppercase">{t.testimonialsLabel}</span>
              <h2 className="font-bebas text-4xl md:text-5xl text-[#F5F5F5] uppercase tracking-wide">{t.testimonialsTitle}</h2>
            </div>

            <div className="min-h-[220px] bg-[#161616] border border-[#1F1F1F] rounded-xl p-8 relative flex flex-col justify-between group">
              {/* Rating */}
              <div className="flex gap-1 text-[#E8FF00] mb-4">
                {Array(testimonials[currentTestimonial].rating || 5).fill(0).map((_, i) => (
                  <Star key={i} size={16} fill="#E8FF00" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-[#F5F5F5] text-base md:text-lg italic leading-relaxed font-dmsans">
                "{language === 'ar' ? testimonials[currentTestimonial].quote_ar : testimonials[currentTestimonial].quote_en}"
              </p>

              {/* Client Bio */}
              <div className="mt-6 flex items-center justify-between border-t border-[#1F1F1F] pt-4">
                <div>
                  <h4 className="font-bebas text-xl text-[#E8FF00] tracking-wide">
                    {language === 'ar' ? testimonials[currentTestimonial].name_ar : testimonials[currentTestimonial].name_en}
                  </h4>
                  <p className="text-xs text-[#666666] font-semibold uppercase tracking-wider">
                    {language === 'ar' ? "الهدف: " : "Goal: "}{language === 'ar' ? testimonials[currentTestimonial].goal_ar : testimonials[currentTestimonial].goal_en}
                  </p>
                </div>

                {/* Navigation controls */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                    className="w-8 h-8 rounded border border-[#1F1F1F] flex items-center justify-center text-[#666666] hover:text-[#E8FF00] hover:border-[#E8FF00]/30 transition-all cursor-pointer"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                    className="w-8 h-8 rounded border border-[#1F1F1F] flex items-center justify-center text-[#666666] hover:text-[#E8FF00] hover:border-[#E8FF00]/30 transition-all cursor-pointer"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      <section id="pricing-section" className="py-20 px-6 md:px-12 max-w-7xl mx-auto border-b border-[#1F1F1F]">
        <div className="space-y-16">
          <div className="text-center space-y-4">
            <h2 className="font-bebas text-4xl md:text-5xl lg:text-6xl text-[#F5F5F5] uppercase tracking-wide">
              {t.pricingTitle}
            </h2>
            <p className="text-[#666666] max-w-xl mx-auto text-sm md:text-base">
              {t.pricingSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {pricingTiers.map((tier) => (
              <div 
                key={tier.name}
                className={`bg-[#161616] border rounded-xl p-8 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 relative ${
                  tier.popular 
                    ? 'border-[#E8FF00] shadow-[0_0_20px_rgba(232,255,0,0.06)]' 
                    : 'border-[#1F1F1F] hover:border-[#E8FF00]/20'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#E8FF00] text-[#0A0A0A] font-bold text-xs uppercase px-3 py-1 rounded tracking-wider shadow">
                    {tier.badge}
                  </div>
                )}
                {tier.saving && (
                  <div className="absolute top-4 right-4 bg-[#FF3A2D] text-[#F5F5F5] font-bold text-[10px] uppercase px-2 py-0.5 rounded tracking-wide">
                    {tier.saving}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="font-bebas text-2xl text-[#666666] uppercase tracking-wider">{tier.name}</h3>
                    <div className="flex items-baseline mt-4 gap-1">
                      <span className="font-bebas text-6xl text-[#F5F5F5]">{tier.price}</span>
                      <span className="font-semibold text-lg text-[#F5F5F5]">{language === 'ar' ? 'ج.م' : 'EGP'}</span>
                      <span className="text-xs text-[#666666] font-bold uppercase ml-2">/ {tier.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3.5 pt-4 border-t border-[#1F1F1F]">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-xs md:text-sm text-[#F5F5F5]">
                        <Check size={16} className="text-[#E8FF00] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button 
                  variant={tier.popular ? 'primary' : 'outline'}
                  onClick={() => {
                    const cleanPrice = tier.price.replace(',', '')
                    if (user) {
                      navigate(`/payment?plan=${tier.duration}&price=${cleanPrice}`)
                    } else {
                      navigate(`/register?plan=${tier.duration}&price=${cleanPrice}`)
                    }
                  }}
                  className="mt-8 w-full font-bebas uppercase tracking-wider text-base"
                >
                  {t.getStarted} <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            ))}
          </div>

          {/* Payment Methods and Trust Info */}
          <div className="text-center space-y-6 max-w-2xl mx-auto pt-6">
            <h4 className="text-[#666666] uppercase text-xs tracking-widest font-bold">{t.acceptedWallets}</h4>
            
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 bg-[#111111] border border-[#1F1F1F] p-4 rounded-xl">
              {paymentMethodsLogos.map((pm) => (
                <div key={pm.name} className="flex items-center gap-1.5 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all select-none">
                  <div className="w-6 h-6 rounded bg-[#161616] border border-[#1F1F1F] flex items-center justify-center font-bold text-xs text-[#E8FF00] uppercase">
                    {pm.name.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-[#F5F5F5] font-dmsans">{pm.text}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-[#666666] italic">
              ℹ️ {t.manualNotice}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111111] border-t border-[#E8FF00]/40 py-12 px-6 md:px-12 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo & Tagline */}
          <div className="space-y-2 flex flex-col items-center md:items-start text-center md:text-left">
            <img src="/logo.png" alt="Coach Mosab Logo" className="h-12 w-auto object-contain" />
            <p className="text-xs text-[#666666] font-medium max-w-xs">
              {language === 'ar' 
                ? "برنامج تدريب وتغذية وتصميم ماكروز مصري مخصص. مصمم لتطور رياضي فائق."
                : "Egyptian customized fitness and macro builder software. Developed for elite athletic progressions."
              }
            </p>
          </div>

          {/* Nav links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-[#666666]">
            <Link to="/" className="hover:text-[#E8FF00] transition-colors">{t.home}</Link>
            <Link to="/login" className="hover:text-[#E8FF00] transition-colors">{t.signIn}</Link>
            <Link to="/register" className="hover:text-[#E8FF00] transition-colors">{t.register}</Link>
            <Link to="/payment" className="hover:text-[#E8FF00] transition-colors">{language === 'ar' ? "خطوات الدفع" : "PAYMENT STEPS"}</Link>
          </div>

          {/* Social icons */}
          <div className="flex gap-4">
            <a 
              href="https://www.instagram.com/mosab_radwan/" 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs text-[#666666] hover:text-[#E8FF00] font-bold border border-[#1F1F1F] bg-[#161616] px-3 py-1.5 rounded-lg transition-all"
            >
              INSTAGRAM
            </a>
            <a 
              href="https://www.tiktok.com/@mosab_radwan" 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs text-[#666666] hover:text-[#E8FF00] font-bold border border-[#1F1F1F] bg-[#161616] px-3 py-1.5 rounded-lg transition-all"
            >
              TIKTOK
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-[#1F1F1F] mt-8 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-[#666666]">
          <p>© {new Date().getFullYear()} COACH MOSAB. {language === 'ar' ? "جميع الحقوق محفوظة." : "ALL RIGHTS RESERVED."}</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:underline">{language === 'ar' ? "سياسة الخصوصية" : "Privacy Policy"}</a>
            <a href="#" className="hover:underline">{language === 'ar' ? "شروط الخدمة" : "Terms of Service"}</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
