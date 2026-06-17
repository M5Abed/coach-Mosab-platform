import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import { Button } from '../components/ui/Button'
import { Mail, Lock, User, Phone, ChevronRight, ChevronLeft } from 'lucide-react'
import { useLanguageStore } from '../store/languageStore'
import { translations } from '../utils/translations'
import { LanguageSelector } from '../components/ui/LanguageSelector'

export function Register() {
  const navigate = useNavigate()
  const register = useAuthStore((state) => state.register)
  const loading = useAuthStore((state) => state.loading)
  const { language } = useLanguageStore()
  const t = translations[language]

  const [step, setStep] = useState(1)

  // Step 1: Account
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [fitnessLevel, setFitnessLevel] = useState('beginner')

  // Step 2: General & Health Info
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [activity, setActivity] = useState('')
  const [hasChronic, setHasChronic] = useState('no')
  const [chronicDetails, setChronicDetails] = useState('')
  const [hasAllergies, setHasAllergies] = useState('no')
  const [allergiesDetails, setAllergiesDetails] = useState('')
  const [hasDigestion, setHasDigestion] = useState('no')
  const [digestionDetails, setDigestionDetails] = useState('')
  const [hasMeds, setHasMeds] = useState('no')
  const [medsDetails, setMedsDetails] = useState('')

  // Step 3: Fitness & Lifestyle
  const [trainingDuration, setTrainingDuration] = useState('')
  const [workoutDays, setWorkoutDays] = useState('')
  const [sleepHours, setSleepHours] = useState('')
  const [sleepSchedule, setSleepSchedule] = useState('')
  const [stressLevel, setStressLevel] = useState('')
  const [dailySteps, setDailySteps] = useState('')

  // Step 4: Eating & Supplements
  const [mealsPerDay, setMealsPerDay] = useState('')
  const [unskippableMeals, setUnskippableMeals] = useState('')
  const [favFoods, setFavFoods] = useState('')
  const [hatedFoods, setHatedFoods] = useState('')
  const [eatOut, setEatOut] = useState('')
  const [waterIntake, setWaterIntake] = useState('')
  const [useSupplements, setUseSupplements] = useState('no')
  const [supplementsDetails, setSupplementsDetails] = useState('')
  const [hasSuppSideEffects, setHasSuppSideEffects] = useState('no')
  const [suppSideEffectsDetails, setSuppSideEffectsDetails] = useState('')

  // Step 5: Goals & Budget
  const [primaryGoal, setPrimaryGoal] = useState('')
  const [goalTimeline, setGoalTimeline] = useState('')
  const [monthlyBudget, setMonthlyBudget] = useState('')
  const [prepareMeals, setPrepareMeals] = useState('')
  const [didDietBefore, setDidDietBefore] = useState('no')
  const [successfulDiet, setSuccessfulDiet] = useState('')
  const [dietFailureReasons, setDietFailureReasons] = useState([])

  const [searchParams] = useSearchParams()
  const plan = searchParams.get('plan')
  const price = searchParams.get('price')

  // Option Lists
  const activityOptions = [
    { value: 'desk', label: t.qActivityDesk },
    { value: 'physical', label: t.qActivityPhysical },
    { value: 'shifts', label: t.qActivityShifts },
  ]
  const expDurOptions = [
    { value: '<3m', label: t.qExperienceDur1 },
    { value: '3-6m', label: t.qExperienceDur2 },
    { value: '6-12m', label: t.qExperienceDur3 },
    { value: '>1y', label: t.qExperienceDur4 },
  ]
  const workoutDaysOptions = [
    { value: '1-2', label: t.qWorkoutDays1 },
    { value: '3-5', label: t.qWorkoutDays2 },
    { value: '5-7', label: t.qWorkoutDays3 },
  ]
  const sleepHoursOptions = [
    { value: '<5', label: t.qSleepHours1 },
    { value: '5-7', label: t.qSleepHours2 },
    { value: '>7', label: t.qSleepHours3 },
  ]
  const stressOptions = [
    { value: 'low', label: t.qStressLow },
    { value: 'medium', label: t.qStressMedium },
    { value: 'high', label: t.qStressHigh },
  ]
  const stepsOptions = [
    { value: '<5000', label: t.qDailySteps1 },
    { value: '5000-10000', label: t.qDailySteps2 },
    { value: '>10000', label: t.qDailySteps3 },
  ]
  const eatOutOptions = [
    { value: 'yes', label: t.qEatOutYes },
    { value: 'no', label: t.qEatOutNo },
    { value: 'sometimes', label: t.qEatOutSometimes },
  ]
  const waterOptions = [
    { value: '1-2', label: t.qWaterIntake1 },
    { value: '2-4', label: t.qWaterIntake2 },
    { value: '>4', label: t.qWaterIntake3 },
  ]
  const primaryGoalOptions = [
    { value: 'shredding', label: t.qPrimaryGoal1 },
    { value: 'bulking', label: t.qPrimaryGoal2 },
    { value: 'recomp', label: t.qPrimaryGoal3 },
    { value: 'health', label: t.qPrimaryGoal4 },
  ]
  const timelineOptions = [
    { value: '3m', label: t.qGoalTimeline1 },
    { value: '6m', label: t.qGoalTimeline2 },
    { value: '1y', label: t.qGoalTimeline3 },
    { value: 'indefinite', label: t.qGoalTimeline4 },
  ]
  const budgetOptions = [
    { value: '1000-2000', label: language === 'ar' ? '1000-2000 ج.م' : '1000-2000 EGP' },
    { value: '2000-3000', label: language === 'ar' ? '2000-3000 ج.م' : '2000-3000 EGP' },
    { value: '3000-4000', label: language === 'ar' ? '3000-4000 ج.م' : '3000-4000 EGP' },
    { value: '4000+', label: language === 'ar' ? '4000+ ج.م' : '4000+ EGP' },
  ]
  const prepHomeOptions = [
    { value: 'home', label: t.qPrepHomeYes },
    { value: 'ready', label: t.qPrepHomeNo },
    { value: 'both', label: t.qPrepHomeBoth },
  ]
  const failureReasonsOptions = [
    { value: 'hunger', label: t.qDietFailureReason1 },
    { value: 'boredom', label: t.qDietFailureReason2 },
    { value: 'time', label: t.qDietFailureReason3 },
    { value: 'cost', label: t.qDietFailureReason4 },
  ]

  const validateStep = () => {
    const isAr = language === 'ar'
    if (step === 1) {
      if (!fullName.trim()) return isAr ? 'يرجى إدخال الاسم بالكامل' : 'Full Name is required.'
      if (!email.trim()) return isAr ? 'يرجى إدخال البريد الإلكتروني' : 'Email is required.'
      if (!phone.trim()) return isAr ? 'يرجى إدخال رقم الهاتف' : 'Phone is required.'
      
      const phoneRegex = /^01[0125][0-9]{8}$/
      if (!phoneRegex.test(phone)) {
        return isAr ? 'أدخل رقم موبايل مصري صحيح (مثال: 010XXXXXXXX).' : 'Enter a valid Egyptian phone format (e.g. 010XXXXXXXX).'
      }
      
      if (!password || password.length < 6) {
        return isAr ? 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' : 'Password must be at least 6 characters.'
      }
    }
    
    if (step === 2) {
      if (!age || isNaN(age) || parseInt(age) <= 0) return isAr ? 'يرجى إدخال سن صحيح' : 'Please enter a valid age.'
      if (!height || isNaN(height) || parseInt(height) <= 0) return isAr ? 'يرجى إدخال طول صحيح' : 'Please enter a valid height.'
      if (!weight || isNaN(weight) || parseFloat(weight) <= 0) return isAr ? 'يرجى إدخال وزن صحيح' : 'Please enter a valid weight.'
      if (!activity) return isAr ? 'يرجى اختيار طبيعة النشاط اليومي' : 'Please select your daily activity status.'
      
      if (hasChronic === 'yes' && !chronicDetails.trim()) return isAr ? 'يرجى تحديد تفاصيل الأمراض المزمنة' : 'Please specify chronic diseases.'
      if (hasAllergies === 'yes' && !allergiesDetails.trim()) return isAr ? 'يرجى تحديد تفاصيل حساسية الطعام' : 'Please specify food allergies.'
      if (hasDigestion === 'yes' && !digestionDetails.trim()) return isAr ? 'يرجى تحديد تفاصيل مشاكل الهضم' : 'Please specify digestive issues.'
      if (hasMeds === 'yes' && !medsDetails.trim()) return isAr ? 'يرجى تحديد تفاصيل الأدوية' : 'Please specify medication details.'
    }
    
    if (step === 3) {
      if (!trainingDuration) return isAr ? 'يرجى اختيار مدة التمرين' : 'Please select training experience duration.'
      if (!workoutDays) return isAr ? 'يرجى اختيار عدد أيام التمرين' : 'Please select workout days per week.'
      if (!sleepHours) return isAr ? 'يرجى اختيار عدد ساعات النوم' : 'Please select sleep hours.'
      if (!sleepSchedule.trim()) return isAr ? 'يرجى إدخال مواعيد النوم والاستيقاظ' : 'Please enter sleep and wake schedule.'
      if (!stressLevel) return isAr ? 'يرجى اختيار مستوى التوتر' : 'Please select stress level.'
      if (!dailySteps) return isAr ? 'يرجى اختيار عدد الخطوات اليومية' : 'Please select daily steps.'
    }
    
    if (step === 4) {
      if (!mealsPerDay || isNaN(mealsPerDay) || parseInt(mealsPerDay) <= 0) return isAr ? 'يرجى إدخال عدد الوجبات اليومية' : 'Please enter a valid number of meals.'
      if (!unskippableMeals.trim()) return isAr ? 'يرجى إدخال الوجبات المفضلة التي لا تفوتها' : 'Please specify unskippable meals.'
      if (!favFoods.trim()) return isAr ? 'يرجى إدخال الأكلات التي تحبها' : 'Please specify favorite foods.'
      if (!hatedFoods.trim()) return isAr ? 'يرجى إدخال الأكلات التي تكرهها' : 'Please specify disliked foods.'
      if (!eatOut) return isAr ? 'يرجى تحديد مدى تناولك للطعام خارج البيت' : 'Please specify how often you eat out.'
      if (!waterIntake) return isAr ? 'يرجى اختيار معدل شرب المياه اليومي' : 'Please select daily water intake.'
      
      if (useSupplements === 'yes' && !supplementsDetails.trim()) return isAr ? 'يرجى تحديد المكملات التي تستخدمها' : 'Please specify supplements.'
      if (hasSuppSideEffects === 'yes' && !suppSideEffectsDetails.trim()) return isAr ? 'يرجى تحديد الأعراض الجانبية للمكملات' : 'Please specify supplement side effects.'
    }
    
    if (step === 5) {
      if (!primaryGoal) return isAr ? 'يرجى اختيار هدفك الأساسي' : 'Please select your primary goal.'
      if (!goalTimeline) return isAr ? 'يرجى اختيار المدة الزمنية المستهدفة' : 'Please select goal timeline.'
      if (!monthlyBudget) return isAr ? 'يرجى اختيار ميزانيتك الشهرية للأكل' : 'Please select monthly food budget.'
      if (!prepareMeals) return isAr ? 'يرجى تحديد كيفية تجهيز الأكل' : 'Please specify how you prepare meals.'
      
      if (didDietBefore === 'yes') {
        if (!successfulDiet.trim()) return isAr ? 'يرجى كتابة الدايت الأكثر نجاحاً' : 'Please specify your successful diet.'
        if (dietFailureReasons.length === 0) return isAr ? 'يرجى اختيار سبب فشل الدايت السابق' : 'Please select at least one reason for diet failure.'
      }
    }
    return null
  }

  const handleNext = (e) => {
    e.preventDefault()
    const errorMsg = validateStep()
    if (errorMsg) {
      toast.error(errorMsg)
      return
    }
    setStep(step + 1)
  }

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errorMsg = validateStep()
    if (errorMsg) {
      toast.error(errorMsg)
      return
    }

    const questionnaireData = {
      age: parseInt(age, 10),
      height: parseInt(height, 10),
      weight: parseFloat(weight),
      activity,
      health: {
        has_chronic: hasChronic === 'yes',
        chronic_details: hasChronic === 'yes' ? chronicDetails : '',
        has_allergies: hasAllergies === 'yes',
        allergies_details: hasAllergies === 'yes' ? allergiesDetails : '',
        has_digestion: hasDigestion === 'yes',
        digestion_details: hasDigestion === 'yes' ? digestionDetails : '',
        has_meds: hasMeds === 'yes',
        meds_details: hasMeds === 'yes' ? medsDetails : '',
      },
      fitness_history: {
        training_duration: trainingDuration,
        workout_days: workoutDays,
        fitness_level: fitnessLevel,
      },
      lifestyle: {
        sleep_hours: sleepHours,
        sleep_schedule: sleepSchedule,
        stress_level: stressLevel,
        daily_steps: dailySteps,
      },
      eating_habits: {
        meals_per_day: parseInt(mealsPerDay, 10),
        unskippable_meals: unskippableMeals,
        favorite_foods: favFoods,
        disliked_foods: hatedFoods,
        eat_out: eatOut,
        water_intake: waterIntake,
      },
      supplements: {
        use_supplements: useSupplements === 'yes',
        supplements_details: useSupplements === 'yes' ? supplementsDetails : '',
        has_side_effects: hasSuppSideEffects === 'yes',
        side_effects_details: hasSuppSideEffects === 'yes' ? suppSideEffectsDetails : '',
      },
      diet_history: {
        did_diet_before: didDietBefore === 'yes',
        successful_diet: didDietBefore === 'yes' ? successfulDiet : '',
        failure_reasons: didDietBefore === 'yes' ? dietFailureReasons : [],
      },
      goals: {
        primary_goal: primaryGoal,
        timeline: goalTimeline,
      },
      capabilities: {
        monthly_budget: monthlyBudget,
        prepare_meals: prepareMeals,
      }
    }

    try {
      await register(email, password, fullName, phone, fitnessLevel, questionnaireData)
      toast.success(language === 'ar' ? 'تم إنشاء الحساب بنجاح!' : 'Registration successful!')
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

      <div className={`w-full ${step === 1 ? 'max-w-md' : 'max-w-2xl'} bg-[#111111] border border-[#1F1F1F] rounded-xl p-8 shadow-2xl relative z-10 space-y-6 transition-all duration-300`}>
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="Coach Mosab Logo" className="h-16 w-auto object-contain mx-auto" />
          </Link>
          <h2 className="text-xs text-[#666666] font-bold uppercase tracking-widest">
            {step === 1 ? t.registerTitle : t.intakeFormTitle}
          </h2>
          {step > 1 && (
            <p className="text-xs text-[#999999] max-w-md mx-auto">
              {t.intakeFormSubtitle}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-[#666666]">
            <span>{language === 'ar' ? `الخطوة ${step} من 5` : `Step ${step} of 5`}</span>
            <span>{step === 1 ? t.step1 : t.step2}</span>
          </div>
          <div className="h-1 bg-[#1F1F1F] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E8FF00] transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: ACCOUNT DETAILS */}
        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4">
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
              {t.nextStep} <ChevronRight className="inline ml-1 rtl:rotate-180" size={16} />
            </Button>
          </form>
        )}

        {/* STEP 2: GENERAL & HEALTH INFO */}
        {step === 2 && (
          <form onSubmit={handleNext} className="space-y-6">
            <h3 className="text-sm font-bold text-[#E8FF00] border-b border-[#1F1F1F] pb-2 uppercase tracking-wide">
              {language === 'ar' ? '1️⃣ بيانات عامة وصحية' : '1️⃣ General & Health Info'}
            </h3>

            {/* Numeric Fields Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5 text-left rtl:text-right">
                <label className="text-xs font-bold text-[#666666] uppercase">{t.qAge}</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="25"
                  min="1"
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] focus:border-[#E8FF00]/50 outline-none"
                  required
                />
              </div>
              <div className="space-y-1.5 text-left rtl:text-right">
                <label className="text-xs font-bold text-[#666666] uppercase">{t.qHeight}</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="175"
                  min="1"
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] focus:border-[#E8FF00]/50 outline-none"
                  required
                />
              </div>
              <div className="space-y-1.5 text-left rtl:text-right">
                <label className="text-xs font-bold text-[#666666] uppercase">{t.qWeight}</label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="75.5"
                  min="1"
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] focus:border-[#E8FF00]/50 outline-none"
                  required
                />
              </div>
            </div>

            {/* Activity Status */}
            <div className="space-y-2 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qActivity}</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {activityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setActivity(opt.value)}
                    className={`py-2.5 px-4 rounded-lg text-xs font-bold border transition-all duration-200 ${
                      activity === opt.value
                        ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                        : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chronic Diseases */}
            <div className="space-y-2 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qChronic}</label>
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                <button
                  type="button"
                  onClick={() => { setHasChronic('yes') }}
                  className={`py-2 px-4 rounded-lg text-xs font-bold border transition-all duration-200 ${
                    hasChronic === 'yes'
                      ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                      : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                  }`}
                >
                  {t.qYes}
                </button>
                <button
                  type="button"
                  onClick={() => { setHasChronic('no'); setChronicDetails('') }}
                  className={`py-2 px-4 rounded-lg text-xs font-bold border transition-all duration-200 ${
                    hasChronic === 'no'
                      ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                      : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                  }`}
                >
                  {t.qNo}
                </button>
              </div>
              {hasChronic === 'yes' && (
                <textarea
                  value={chronicDetails}
                  onChange={(e) => setChronicDetails(e.target.value)}
                  placeholder={t.qChronicPlaceholder}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-3.5 text-sm text-[#F5F5F5] placeholder-[#555] focus:border-[#E8FF00]/50 outline-none min-h-[80px]"
                  required
                />
              )}
            </div>

            {/* Food Allergies */}
            <div className="space-y-2 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qAllergies}</label>
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                <button
                  type="button"
                  onClick={() => { setHasAllergies('yes') }}
                  className={`py-2 px-4 rounded-lg text-xs font-bold border transition-all duration-200 ${
                    hasAllergies === 'yes'
                      ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                      : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                  }`}
                >
                  {t.qYes}
                </button>
                <button
                  type="button"
                  onClick={() => { setHasAllergies('no'); setAllergiesDetails('') }}
                  className={`py-2 px-4 rounded-lg text-xs font-bold border transition-all duration-200 ${
                    hasAllergies === 'no'
                      ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                      : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                  }`}
                >
                  {t.qNo}
                </button>
              </div>
              {hasAllergies === 'yes' && (
                <textarea
                  value={allergiesDetails}
                  onChange={(e) => setAllergiesDetails(e.target.value)}
                  placeholder={t.qAllergiesPlaceholder}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-3.5 text-sm text-[#F5F5F5] placeholder-[#555] focus:border-[#E8FF00]/50 outline-none min-h-[80px]"
                  required
                />
              )}
            </div>

            {/* Digestive Issues */}
            <div className="space-y-2 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qDigestion}</label>
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                <button
                  type="button"
                  onClick={() => { setHasDigestion('yes') }}
                  className={`py-2 px-4 rounded-lg text-xs font-bold border transition-all duration-200 ${
                    hasDigestion === 'yes'
                      ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                      : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                  }`}
                >
                  {t.qYes}
                </button>
                <button
                  type="button"
                  onClick={() => { setHasDigestion('no'); setDigestionDetails('') }}
                  className={`py-2 px-4 rounded-lg text-xs font-bold border transition-all duration-200 ${
                    hasDigestion === 'no'
                      ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                      : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                  }`}
                >
                  {t.qNo}
                </button>
              </div>
              {hasDigestion === 'yes' && (
                <textarea
                  value={digestionDetails}
                  onChange={(e) => setDigestionDetails(e.target.value)}
                  placeholder={t.qDigestionPlaceholder}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-3.5 text-sm text-[#F5F5F5] placeholder-[#555] focus:border-[#E8FF00]/50 outline-none min-h-[80px]"
                  required
                />
              )}
            </div>

            {/* Regular Medications */}
            <div className="space-y-2 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qMeds}</label>
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                <button
                  type="button"
                  onClick={() => { setHasMeds('yes') }}
                  className={`py-2 px-4 rounded-lg text-xs font-bold border transition-all duration-200 ${
                    hasMeds === 'yes'
                      ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                      : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                  }`}
                >
                  {t.qYes}
                </button>
                <button
                  type="button"
                  onClick={() => { setHasMeds('no'); setMedsDetails('') }}
                  className={`py-2 px-4 rounded-lg text-xs font-bold border transition-all duration-200 ${
                    hasMeds === 'no'
                      ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                      : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                  }`}
                >
                  {t.qNo}
                </button>
              </div>
              {hasMeds === 'yes' && (
                <textarea
                  value={medsDetails}
                  onChange={(e) => setMedsDetails(e.target.value)}
                  placeholder={t.qMedsPlaceholder}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-3.5 text-sm text-[#F5F5F5] placeholder-[#555] focus:border-[#E8FF00]/50 outline-none min-h-[80px]"
                  required
                />
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-2">
              <Button type="button" onClick={handlePrev} variant="outline" className="flex-1 font-bold text-xs py-3 border-[#1F1F1F] hover:bg-[#161616]">
                <ChevronLeft className="inline mr-1 rtl:rotate-180" size={14} /> {t.prevStep}
              </Button>
              <Button type="submit" className="flex-1 font-bold text-xs py-3">
                {t.nextStep} <ChevronRight className="inline ml-1 rtl:rotate-180" size={14} />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: FITNESS & LIFESTYLE */}
        {step === 3 && (
          <form onSubmit={handleNext} className="space-y-6">
            <h3 className="text-sm font-bold text-[#E8FF00] border-b border-[#1F1F1F] pb-2 uppercase tracking-wide">
              {language === 'ar' ? '2️⃣ التاريخ الرياضي ونمط الحياة' : '2️⃣ Fitness & Lifestyle'}
            </h3>

            {/* Training Duration */}
            <div className="space-y-2 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qExperienceDur}</label>
              <div className="grid grid-cols-2 gap-3">
                {expDurOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTrainingDuration(opt.value)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all duration-200 ${
                      trainingDuration === opt.value
                        ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                        : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Workout Days */}
            <div className="space-y-2 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qWorkoutDays}</label>
              <div className="grid grid-cols-3 gap-3">
                {workoutDaysOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setWorkoutDays(opt.value)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all duration-200 ${
                      workoutDays === opt.value
                        ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                        : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep Hours */}
            <div className="space-y-2 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qSleepHours}</label>
              <div className="grid grid-cols-3 gap-3">
                {sleepHoursOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSleepHours(opt.value)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all duration-200 ${
                      sleepHours === opt.value
                        ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                        : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep Schedule */}
            <div className="space-y-1.5 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qSleepSchedule}</label>
              <input
                type="text"
                value={sleepSchedule}
                onChange={(e) => setSleepSchedule(e.target.value)}
                placeholder={t.qSleepSchedulePlaceholder}
                className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-3.5 text-sm text-[#F5F5F5] placeholder-[#555] focus:border-[#E8FF00]/50 outline-none"
                required
              />
            </div>

            {/* Stress Level */}
            <div className="space-y-2 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qStress}</label>
              <div className="grid grid-cols-3 gap-3">
                {stressOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStressLevel(opt.value)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all duration-200 ${
                      stressLevel === opt.value
                        ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                        : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Steps */}
            <div className="space-y-2 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qDailySteps}</label>
              <div className="grid grid-cols-3 gap-3">
                {stepsOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDailySteps(opt.value)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all duration-200 ${
                      dailySteps === opt.value
                        ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                        : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-2">
              <Button type="button" onClick={handlePrev} variant="outline" className="flex-1 font-bold text-xs py-3 border-[#1F1F1F] hover:bg-[#161616]">
                <ChevronLeft className="inline mr-1 rtl:rotate-180" size={14} /> {t.prevStep}
              </Button>
              <Button type="submit" className="flex-1 font-bold text-xs py-3">
                {t.nextStep} <ChevronRight className="inline ml-1 rtl:rotate-180" size={14} />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 4: EATING & SUPPLEMENTS */}
        {step === 4 && (
          <form onSubmit={handleNext} className="space-y-6">
            <h3 className="text-sm font-bold text-[#E8FF00] border-b border-[#1F1F1F] pb-2 uppercase tracking-wide">
              {language === 'ar' ? '3️⃣ العادات الغذائية والمكملات' : '3️⃣ Eating & Supplements'}
            </h3>

            {/* Meals Per Day */}
            <div className="space-y-1.5 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qMealsPerDay}</label>
              <input
                type="number"
                value={mealsPerDay}
                onChange={(e) => setMealsPerDay(e.target.value)}
                placeholder="3"
                min="1"
                className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-3.5 text-sm text-[#F5F5F5] focus:border-[#E8FF00]/50 outline-none"
                required
              />
            </div>

            {/* Unskippable Meals */}
            <div className="space-y-1.5 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qUnskippableMeals}</label>
              <input
                type="text"
                value={unskippableMeals}
                onChange={(e) => setUnskippableMeals(e.target.value)}
                placeholder={t.qUnskippableMealsPlaceholder}
                className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-3.5 text-sm text-[#F5F5F5] placeholder-[#555] focus:border-[#E8FF00]/50 outline-none"
                required
              />
            </div>

            {/* Favorite Foods */}
            <div className="space-y-1.5 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qFavFoods}</label>
              <input
                type="text"
                value={favFoods}
                onChange={(e) => setFavFoods(e.target.value)}
                placeholder={t.qFavFoodsPlaceholder}
                className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-3.5 text-sm text-[#F5F5F5] placeholder-[#555] focus:border-[#E8FF00]/50 outline-none"
                required
              />
            </div>

            {/* Disliked Foods */}
            <div className="space-y-1.5 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qHatedFoods}</label>
              <input
                type="text"
                value={hatedFoods}
                onChange={(e) => setHatedFoods(e.target.value)}
                placeholder={t.qHatedFoodsPlaceholder}
                className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-3.5 text-sm text-[#F5F5F5] placeholder-[#555] focus:border-[#E8FF00]/50 outline-none"
                required
              />
            </div>

            {/* Eating Out frequency */}
            <div className="space-y-2 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qEatOut}</label>
              <div className="grid grid-cols-3 gap-3">
                {eatOutOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEatOut(opt.value)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all duration-200 ${
                      eatOut === opt.value
                        ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                        : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Water Intake */}
            <div className="space-y-2 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qWaterIntake}</label>
              <div className="grid grid-cols-3 gap-3">
                {waterOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setWaterIntake(opt.value)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all duration-200 ${
                      waterIntake === opt.value
                        ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                        : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Use Supplements */}
            <div className="space-y-2 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qSupplements}</label>
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                <button
                  type="button"
                  onClick={() => setUseSupplements('yes')}
                  className={`py-2 px-4 rounded-lg text-xs font-bold border transition-all duration-200 ${
                    useSupplements === 'yes'
                      ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                      : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                  }`}
                >
                  {t.qYes}
                </button>
                <button
                  type="button"
                  onClick={() => { setUseSupplements('no'); setSupplementsDetails('') }}
                  className={`py-2 px-4 rounded-lg text-xs font-bold border transition-all duration-200 ${
                    useSupplements === 'no'
                      ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                      : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                  }`}
                >
                  {t.qNo}
                </button>
              </div>
              {useSupplements === 'yes' && (
                <textarea
                  value={supplementsDetails}
                  onChange={(e) => setSupplementsDetails(e.target.value)}
                  placeholder={t.qSupplementsPlaceholder}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-3.5 text-sm text-[#F5F5F5] placeholder-[#555] focus:border-[#E8FF00]/50 outline-none min-h-[80px]"
                  required
                />
              )}
            </div>

            {/* Supplement Side Effects */}
            <div className="space-y-2 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qSuppSideEffects}</label>
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                <button
                  type="button"
                  onClick={() => setHasSuppSideEffects('yes')}
                  className={`py-2 px-4 rounded-lg text-xs font-bold border transition-all duration-200 ${
                    hasSuppSideEffects === 'yes'
                      ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                      : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                  }`}
                >
                  {t.qYes}
                </button>
                <button
                  type="button"
                  onClick={() => { setHasSuppSideEffects('no'); setSuppSideEffectsDetails('') }}
                  className={`py-2 px-4 rounded-lg text-xs font-bold border transition-all duration-200 ${
                    hasSuppSideEffects === 'no'
                      ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                      : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                  }`}
                >
                  {t.qNo}
                </button>
              </div>
              {hasSuppSideEffects === 'yes' && (
                <textarea
                  value={suppSideEffectsDetails}
                  onChange={(e) => setSuppSideEffectsDetails(e.target.value)}
                  placeholder={t.qSuppSideEffectsPlaceholder}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-3.5 text-sm text-[#F5F5F5] placeholder-[#555] focus:border-[#E8FF00]/50 outline-none min-h-[80px]"
                  required
                />
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-2">
              <Button type="button" onClick={handlePrev} variant="outline" className="flex-1 font-bold text-xs py-3 border-[#1F1F1F] hover:bg-[#161616]">
                <ChevronLeft className="inline mr-1 rtl:rotate-180" size={14} /> {t.prevStep}
              </Button>
              <Button type="submit" className="flex-1 font-bold text-xs py-3">
                {t.nextStep} <ChevronRight className="inline ml-1 rtl:rotate-180" size={14} />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 5: GOALS & BUDGET */}
        {step === 5 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-sm font-bold text-[#E8FF00] border-b border-[#1F1F1F] pb-2 uppercase tracking-wide">
              {language === 'ar' ? '4️⃣ الأهداف والإمكانيات' : '4️⃣ Goals & Budget'}
            </h3>

            {/* Primary Goal */}
            <div className="space-y-2 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qPrimaryGoal}</label>
              <div className="grid grid-cols-2 gap-3">
                {primaryGoalOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPrimaryGoal(opt.value)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all duration-200 ${
                      primaryGoal === opt.value
                        ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                        : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Timeline */}
            <div className="space-y-2 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qGoalTimeline}</label>
              <div className="grid grid-cols-2 gap-3">
                {timelineOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGoalTimeline(opt.value)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all duration-200 ${
                      goalTimeline === opt.value
                        ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                        : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Monthly Food Budget */}
            <div className="space-y-2 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qMonthlyBudget}</label>
              <div className="grid grid-cols-2 gap-3">
                {budgetOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMonthlyBudget(opt.value)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all duration-200 ${
                      monthlyBudget === opt.value
                        ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                        : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prepare Meals */}
            <div className="space-y-2 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qPrepHome}</label>
              <div className="grid grid-cols-3 gap-2">
                {prepHomeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPrepareMeals(opt.value)}
                    className={`py-1.5 px-2.5 rounded-lg text-[10px] md:text-xs font-bold border transition-all duration-200 ${
                      prepareMeals === opt.value
                        ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                        : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Diet History */}
            <div className="space-y-3 text-left rtl:text-right">
              <label className="text-xs font-bold text-[#666666] uppercase">{t.qDietBefore}</label>
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                <button
                  type="button"
                  onClick={() => setDidDietBefore('yes')}
                  className={`py-2 px-4 rounded-lg text-xs font-bold border transition-all duration-200 ${
                    didDietBefore === 'yes'
                      ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                      : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                  }`}
                >
                  {t.qYes}
                </button>
                <button
                  type="button"
                  onClick={() => { setDidDietBefore('no'); setSuccessfulDiet(''); setDietFailureReasons([]) }}
                  className={`py-2 px-4 rounded-lg text-xs font-bold border transition-all duration-200 ${
                    didDietBefore === 'no'
                      ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                      : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                  }`}
                >
                  {t.qNo}
                </button>
              </div>

              {didDietBefore === 'yes' && (
                <div className="space-y-3 p-3 bg-[#161616]/50 rounded-lg border border-[#1F1F1F]">
                  <div className="space-y-1 text-left rtl:text-right">
                    <label className="text-[11px] font-bold text-[#999999] uppercase">{t.qSuccessDiet}</label>
                    <input
                      type="text"
                      value={successfulDiet}
                      onChange={(e) => setSuccessfulDiet(e.target.value)}
                      placeholder={t.qSuccessDietPlaceholder}
                      className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] placeholder-[#555] focus:border-[#E8FF00]/50 outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-2 text-left rtl:text-right">
                    <label className="text-[11px] font-bold text-[#999999] uppercase">{t.qDietFailureReason}</label>
                    <div className="grid grid-cols-2 gap-3">
                      {failureReasonsOptions.map((opt) => {
                        const isSelected = dietFailureReasons.includes(opt.value)
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setDietFailureReasons(dietFailureReasons.filter(r => r !== opt.value))
                              } else {
                                setDietFailureReasons([...dietFailureReasons, opt.value])
                              }
                            }}
                            className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all duration-200 ${
                              isSelected
                                ? 'bg-[#E8FF00] text-black border-[#E8FF00]'
                                : 'bg-[#161616] border-[#1F1F1F] text-[#999999] hover:border-[#E8FF00]/30 hover:text-white'
                            }`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation & Submit Buttons */}
            <div className="flex gap-4 pt-2">
              <Button type="button" onClick={handlePrev} variant="outline" className="flex-1 font-bold text-xs py-3 border-[#1F1F1F] hover:bg-[#161616]">
                <ChevronLeft className="inline mr-1 rtl:rotate-180" size={14} /> {t.prevStep}
              </Button>
              <Button type="submit" loading={loading} className="flex-1 font-bebas tracking-wide text-base py-3 bg-[#E8FF00] text-black border-[#E8FF00]">
                {t.submitSignUp}
              </Button>
            </div>
          </form>
        )}

        {/* Footer Link */}
        {step === 1 && (
          <div className="text-center text-xs text-[#666666]">
            {t.haveAccount}{' '}
            <Link to="/login" className="text-[#E8FF00] font-bold hover:underline">
              {t.loginHere}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Register
