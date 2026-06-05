import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { useAuthStore } from '../../store/authStore'
import { useLanguageStore } from '../../store/languageStore'
import { translations } from '../../utils/translations'
import { 
  ArrowLeft, Check, ChevronDown, ChevronUp, Flame, 
  Play, Pause, RotateCcw, Plus, Timer, Volume2 
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { logWorkoutCompletion, getUserStats } from '../../utils/userStats'
import { parseWorkoutPlan } from '../../utils/planParser'

// Synthesize a high-end dual-tone sound cue using browser's AudioContext
const playSuccessSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    osc.type = 'sine'
    // Dynamic gym success tone
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15) // A5
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  } catch (e) {
    console.log('Audio Context muted due to gesture restrictions', e)
  }
}

// Tailored tips database by exercise keywords
const defaultTips = {
  'bench press': {
    tip: 'Keep your shoulder blades retracted and feet planted firmly on the floor. Control the negative barbell path.',
    guide: '1. Lie flat on the bench. 2. Grip barbell slightly wider than shoulders. 3. Lower bar smoothly to mid-chest. 4. Push bar straight back up locking out elbows.'
  },
  'fly': {
    tip: 'Do not lock out elbows at the top. Maintain a slight, constant arc. Squeeze your pecs hard at the peak.',
    guide: '1. Lie on bench (flat or incline). 2. Start with dumbbells above your chest. 3. Lower dumbbells out wide feeling a deep chest stretch. 4. Reverse trajectory.'
  },
  'squat': {
    tip: 'Brace your core tightly, sit back into your hips, and ensure knees track over your toes. Push through your mid-foot.',
    guide: '1. Place barbell across your upper traps. 2. Stand feet shoulder-width apart. 3. Lower hips down below knee height. 4. Drive up explosively.'
  },
  'deadlift': {
    tip: 'Keep the bar close to your shins, engage your lats, and pull with a flat back. Do not round your lower spine.',
    guide: '1. Stand over barbell, mid-foot under bar. 2. Bend down and grab bar with shoulder-width grip. 3. Keep hips down, chest up. 4. Stand up, pulling bar along body.'
  },
  'press': {
    tip: 'Squeeze your glutes and core to stabilize your spine. Do not arch your lower back excessive.',
    guide: '1. Stand or sit upright. 2. Start with dumbbells or barbell at shoulder level. 3. Press upward until arms are straight. 4. Return under control.'
  },
  'pull': {
    tip: 'Drive with your elbows and squeeze your shoulder blades together at the peak contraction.',
    guide: '1. Hang from the bar. 2. Pull your chest up toward the bar by driving elbows down. 3. Lower yourself with slow control.'
  },
  'row': {
    tip: 'Pull towards your lower stomach/hip crease to maximize lat recruitment. Keep your torso stable.',
    guide: '1. Hinge at hips with flat back. 2. Grab weights and pull toward belly button. 3. Squeeze shoulder blades, then slowly release.'
  },
  'curl': {
    tip: 'Keep your elbows pinned to your sides and avoid using momentum to lift the weights.',
    guide: '1. Hold weights with palms facing forward. 2. Flex elbows to bring weights to shoulder height. 3. Control negative.'
  },
  'raise': {
    tip: 'Lead with your elbows. Focus on raising wide rather than high to isolate the lateral deltoids.',
    guide: '1. Stand holding dumbbells at sides. 2. Raise arms out laterally, maintaining a slight bend in elbows. 3. Lower smoothly.'
  }
}

export function WorkoutDay() {
  const { planId, dayId } = useParams()
  const navigate = useNavigate()
  const { language } = useLanguageStore()
  const t = translations[language]

  const user = useAuthStore((state) => state.user)
  const rawWorkoutPlan = user?.workout_plan
  const workoutPlan = useMemo(() => parseWorkoutPlan(rawWorkoutPlan), [rawWorkoutPlan])

  const [stats, setStats] = useState(() => getUserStats(user?.id))

  useEffect(() => {
    setStats(getUserStats(user?.id))
  }, [user?.id])

  // State for tracking completed exercises
  const [completedExercises, setCompletedExercises] = useState({})
  // State for tracking expanded exercise guides
  const [expandedExercise, setExpandedExercise] = useState(null)
  // State for final finished day completion modal
  const [showFinishedModal, setShowFinishedModal] = useState(false)

  // Premium Rest Timer States
  const [timeLeft, setTimeLeft] = useState(0)
  const [timerDuration, setTimerDuration] = useState(90)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [isTimerMinimized, setIsTimerMinimized] = useState(false)

  // Timer Countdown Logic
  useEffect(() => {
    let interval = null
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false)
            playSuccessSound()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, timeLeft])

  // Get raw exercises from user store
  let exercises = []
  if (workoutPlan?.exercises && workoutPlan.exercises.length > 0) {
    const targetDay = dayId === 'today' ? 1 : Number(dayId)
    const filteredRaw = workoutPlan.exercises.filter(ex => Number(ex.day || 1) === targetDay)

    exercises = filteredRaw.map((ex, index) => {
      const nameLower = (ex.name || '').toLowerCase()
      let tip = ex.tip || 'Focus on slow negative control, correct posture, and squeezing the target muscle group.'
      let guide = ex.guide || '1. Assume a stable starting position. 2. Contract the working muscle with slow motion. 3. Return to starting state. 4. Complete targeted repetitions.'

      for (const key of Object.keys(defaultTips)) {
        if (nameLower.includes(key)) {
          tip = ex.tip || defaultTips[key].tip
          guide = ex.guide || defaultTips[key].guide
          break
        }
      }

      const diff = (ex.difficulty || 'medium').toLowerCase()
      let dotColor = 'bg-[#FF8C00]'
      if (diff === 'easy' || diff === 'beginner') dotColor = 'bg-[#34D399]'
      if (diff === 'hard' || diff === 'advanced') dotColor = 'bg-[#FF3A2D]'

      return {
        id: ex.id || `ex-${index}`,
        name: ex.name,
        sets: ex.sets || 3,
        reps: ex.reps || '10',
        rest: ex.rest || '90s',
        difficulty: ex.difficulty || 'Medium',
        dotColor,
        tip,
        guide
      }
    })
  }

  const toggleComplete = (exId) => {
    setCompletedExercises(prev => ({
      ...prev,
      [exId]: !prev[exId]
    }))
  }

  const toggleExpand = (exId) => {
    setExpandedExercise(prev => (prev === exId ? null : exId))
  }

  const handleFinish = () => {
    if (user?.id) {
      const updated = logWorkoutCompletion(user.id)
      if (updated) {
        setStats(updated)
      }
    }

    confetti({
      particleCount: 180,
      spread: 90,
      origin: { y: 0.65 },
      colors: ['#E8FF00', '#FF8C00', '#FFFFFF', '#4DA6FF']
    })
    setShowFinishedModal(true)
  }

  // Trigger Custom Rest Timer duration from badge click
  const triggerRestTimer = (restStr) => {
    const num = parseInt(restStr.replace(/\D/g, '')) || 90
    setTimerDuration(num)
    setTimeLeft(num)
    setIsTimerRunning(true)
    setIsTimerMinimized(false)
  }

  const formattedTimeLeft = () => {
    const m = Math.floor(timeLeft / 60)
    const s = timeLeft % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // Calculate circular stroke offset
  const radius = 24
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = timeLeft > 0 ? circumference - (timeLeft / timerDuration) * circumference : circumference

  return (
    <div className="space-y-6 font-dmsans select-none animate-fade-in relative pb-24">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <Link 
          to="/dashboard/workouts"
          className="flex items-center gap-1.5 text-xs text-[#666666] hover:text-[#F5F5F5] font-bold uppercase transition-colors outline-none cursor-pointer"
        >
          <ArrowLeft size={14} /> {language === 'ar' ? 'العودة للتمارين' : 'Back to Plan'}
        </Link>
        <span className="text-xs text-[#666666] font-bold">
          {workoutPlan ? (language === 'ar' ? 'جلسة تدريبية مخصصة' : 'CUSTOM SESSION') : (language === 'ar' ? 'لا توجد تمارين' : 'NO EXERCISES')}
        </span>
      </div>

      {/* Day title */}
      <div>
        <h1 className="font-bebas text-4xl md:text-5xl text-[#F5F5F5] uppercase tracking-wide">
          {workoutPlan?.title 
            ? `${workoutPlan.title} - DAY ${dayId === 'today' ? '1' : dayId}` 
            : (language === 'ar' ? 'يوم راحة واستشفاء' : 'ACTIVE RECOVERY & REST')}
        </h1>
        <p className="text-sm text-[#666666] font-semibold uppercase tracking-wider">
          {exercises.length > 0 
            ? (language === 'ar' ? 'أكمل التمارين واضغط علامة الصح عند الانتهاء.' : 'Complete each exercise and check them off.')
            : (language === 'ar' ? 'لا توجد تمارين مضافة لليوم من قبل الكوتش.' : 'No movements scheduled for today.')}
        </p>
      </div>

      {/* Exercise Rows */}
      <div className="space-y-4">
        {exercises.length > 0 ? (
          exercises.map((ex, index) => {
          const isCompleted = !!completedExercises[ex.id]
          const isExpanded = expandedExercise === ex.id

          return (
            <Card 
              key={ex.id} 
              className={`p-4 transition-all duration-300 ${
                isCompleted 
                  ? 'opacity-40 border-[#1A1A1A] bg-[#0C0C0C]' 
                  : 'border-[#1F1F1F] bg-[#111111] hover:border-[#2F2F2F]'
              }`}
            >
              {/* Row Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {/* Checkbox */}
                  <div 
                    onClick={() => toggleComplete(ex.id)}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-200 shrink-0 ${
                      isCompleted 
                        ? 'bg-[#E8FF00] border-transparent text-[#0A0A0A] scale-105' 
                        : 'border-[#2F2F2F] bg-transparent text-transparent hover:border-[#E8FF00]'
                    }`}
                  >
                    <Check size={14} strokeWidth={3} />
                  </div>

                  <div className="min-w-0">
                    <h3 className={`font-bebas text-xl text-[#F5F5F5] tracking-wide truncate ${isCompleted ? 'line-through text-[#555555]' : 'group-hover:text-[#E8FF00]'}`}>
                      {ex.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-[#666666] font-bold uppercase mt-1">
                      <span>{ex.sets} Sets × {ex.reps} Reps</span>
                      <span>•</span>
                      <button 
                        onClick={() => triggerRestTimer(ex.rest)}
                        className="flex items-center gap-1 text-[#4DA6FF] hover:text-[#79C1FF] transition-colors font-bold uppercase shrink-0"
                      >
                        <Timer size={12} /> Rest: {ex.rest}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3.5 border-t sm:border-none border-[#1A1A1A] pt-2.5 sm:pt-0">
                  <div className="flex items-center gap-1.5 text-xs text-[#666666] font-semibold uppercase">
                    <span className={`w-2.5 h-2.5 rounded-full ${ex.dotColor}`} />
                    <span>{ex.difficulty}</span>
                  </div>
                  
                  <button 
                    onClick={() => toggleExpand(ex.id)}
                    className="p-1.5 rounded-lg hover:bg-[#1C1C1C] text-[#666666] hover:text-[#F5F5F5] transition-colors cursor-pointer outline-none border border-transparent hover:border-[#1F1F1F]"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expandable Guide Body */}
              {isExpanded && (
                <div className="border-t border-[#1F1F1F] mt-4 pt-4 space-y-3">
                  <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3">
                    <span className="text-[10px] text-[#666666] font-bold uppercase tracking-wider block mb-1">
                      {language === 'ar' ? 'تعليمات أداء التمرين' : 'Exercise Instructions'}
                    </span>
                    <p className="text-xs text-[#888888] leading-relaxed font-semibold">{ex.guide}</p>
                  </div>
                  <div className="bg-[#E8FF00]/5 border border-[#E8FF00]/15 rounded-lg p-3">
                    <span className="text-[10px] text-[#E8FF00] font-bold uppercase tracking-wider block mb-1">
                      💡 {language === 'ar' ? 'نصيحة الكوتش مصعب' : 'Coach Tip'}
                    </span>
                    <p className="text-xs text-[#999999] italic leading-relaxed font-medium">{ex.tip}</p>
                  </div>
                </div>
              )}
            </Card>
          )
        })
        ) : (
          <Card className="border border-[#1F1F1F] bg-[#111111] p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#1F1F1F] flex items-center justify-center text-[#666666] mx-auto border border-[#2F2F2F]">
              <Dumbbell size={20} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bebas text-lg text-[#F5F5F5] tracking-wide uppercase">
                {language === 'ar' ? 'لا توجد تمارين مخصصة اليوم' : 'NO EXERCISES SCHEDULED TODAY'}
              </h3>
              <p className="text-xs text-[#666666] font-semibold max-w-xs mx-auto leading-relaxed">
                {language === 'ar'
                  ? 'لم يتم إضافة حركات أو تمارين مخصصة لجدولك اليوم بعد من الكوتش مصعب. خذ قسطاً كافياً من الراحة اليوم.'
                  : 'Coach Mosab has not added individual exercises for this day yet. Enjoy your recovery and rest day.'}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Action panel */}
      {exercises.length > 0 && (
        <div className="pt-4 select-none">
          <Button onClick={handleFinish} className="w-full font-bebas uppercase tracking-wider text-base py-3.5 shadow-lg shadow-[#E8FF00]/10 hover:shadow-[#E8FF00]/25 transition-all duration-300">
            {language === 'ar' ? 'إنهاء تمرين اليوم وحفظ التقدم' : 'FINISH TRAINING SESSION'}
          </Button>
        </div>
      )}

      {/* ── Active Rest Timer (Floating Panel) ── */}
      {timeLeft > 0 && (
        <div 
          className={`fixed bottom-6 right-6 z-50 transition-all duration-300 shadow-2xl ${
            isTimerMinimized 
              ? 'w-16 h-16 rounded-full overflow-hidden' 
              : 'w-64 rounded-2xl p-4'
          } backdrop-blur-md bg-[#111111]/90 border border-[#4DA6FF]/20 flex flex-col items-center justify-center`}
        >
          {isTimerMinimized ? (
            <div 
              onClick={() => setIsTimerMinimized(false)}
              className="w-full h-full flex items-center justify-center cursor-pointer relative group bg-[#111111]"
            >
              <Timer className="text-[#4DA6FF] animate-pulse" size={24} />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/80 transition-opacity">
                <span className="text-[11px] font-bebas text-[#4DA6FF]">{formattedTimeLeft()}</span>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-3 text-center">
              <div className="flex justify-between items-center border-b border-[#1F1F1F] pb-1.5">
                <div className="flex items-center gap-1 text-xs text-[#4DA6FF] font-bold uppercase">
                  <Volume2 size={14} /> {language === 'ar' ? 'فترة الراحة' : 'REST INTERVAL'}
                </div>
                <button 
                  onClick={() => setIsTimerMinimized(true)}
                  className="text-[10px] font-bold text-[#666666] hover:text-[#FFFFFF] uppercase transition-colors"
                >
                  {language === 'ar' ? 'تصغير' : 'Minimize'}
                </button>
              </div>

              {/* Circular Visual Indicator */}
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle 
                    cx="40" 
                    cy="40" 
                    r={radius} 
                    fill="transparent" 
                    stroke="#1A1A1A" 
                    strokeWidth="4" 
                  />
                  <circle 
                    cx="40" 
                    cy="40" 
                    r={radius} 
                    fill="transparent" 
                    stroke="#4DA6FF" 
                    strokeWidth="4" 
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute font-bebas text-2xl text-[#FFFFFF] tracking-wider">
                  {formattedTimeLeft()}
                </div>
              </div>

              {/* Incremental Adjustment & Audio Indicators */}
              <div className="flex items-center justify-center gap-2">
                <button 
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="p-2 rounded-lg bg-[#1C1C1C] border border-[#2F2F2F] hover:bg-[#252525] text-white transition-colors"
                  title="Pause/Play"
                >
                  {isTimerRunning ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button 
                  onClick={() => { setTimeLeft(timerDuration); setIsTimerRunning(true); }}
                  className="p-2 rounded-lg bg-[#1C1C1C] border border-[#2F2F2F] hover:bg-[#252525] text-white transition-colors"
                  title="Reset"
                >
                  <RotateCcw size={14} />
                </button>
                <button 
                  onClick={() => setTimeLeft(prev => prev + 30)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#4DA6FF]/10 border border-[#4DA6FF]/30 text-[#4DA6FF] hover:bg-[#4DA6FF]/20 transition-all font-bold text-xs flex items-center gap-0.5"
                  title="Add 30s"
                >
                  <Plus size={11} /> 30s
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Finished day celebration modal */}
      <Modal 
        isOpen={showFinishedModal}
        onClose={() => {
          setShowFinishedModal(false)
          navigate('/dashboard/workouts')
        }}
        title="DAY COMPLETE!"
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-[#FF8C00]/10 border border-[#FF8C00]/30 rounded-full flex items-center justify-center mx-auto text-[#FF8C00] animate-pulse">
            <Flame size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="font-bebas text-3xl text-[#F5F5F5] tracking-wide">
              {language === 'ar' ? 'أحسنت يا بطل! تم إنهاء التمرين 🔥' : 'WORKOUT DAY FINISHED! 🔥'}
            </h2>
            <p className="text-sm text-[#666666] leading-relaxed font-semibold">
              {language === 'ar' 
                ? 'لقد تم تسجيل أدائك وتحديث التزامك المتواصل بنجاح. الكوتش مصعب فخور بالتزامك!' 
                : 'Your streak has incremented. Coach Mosab has logged your progression checks. Keep grinding!'}
            </p>
          </div>
          <div className="bg-[#161616] border border-[#1F1F1F] rounded-lg p-4 font-bebas text-2xl text-[#E8FF00] tracking-wide shadow-inner">
            {language === 'ar' 
              ? `الالتزام المتواصل الحالي: ${stats?.streak} يوم` 
              : `CURRENT STREAK: ${stats?.streak} DAYS`}
          </div>
          <Button 
            onClick={() => {
              setShowFinishedModal(false)
              navigate('/dashboard/workouts')
            }}
            className="w-full uppercase tracking-wider font-bebas text-base py-3"
          >
            {language === 'ar' ? 'متابعة' : 'CONTINUE'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default WorkoutDay;
