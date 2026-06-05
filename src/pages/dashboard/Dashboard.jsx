import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useLanguageStore } from '../../store/languageStore'
import { translations } from '../../utils/translations'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Flame, Dumbbell, Apple, Video, Play, Radio, Calendar } from 'lucide-react'
import { getUserStats } from '../../utils/userStats'
import { parseWorkoutPlan, parseNutritionPlan } from '../../utils/planParser'
import { supabase } from '../../lib/supabase'

export function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { language } = useLanguageStore()
  const t = translations[language]

  const [latestVideo, setLatestVideo] = useState(null)
  const [loadingVideo, setLoadingVideo] = useState(true)

  useEffect(() => {
    const fetchLatestVideo = async () => {
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) throw error
        if (data && data.length > 0) {
          setLatestVideo(data[0])
        }
      } catch (err) {
        console.error('Error fetching latest video:', err)
      } finally {
        setLoadingVideo(false)
      }
    }
    fetchLatestVideo()
  }, [])

  const stats = useMemo(() => getUserStats(user?.id), [user?.id])

  const rawNutritionPlan = user?.nutrition_plan
  const rawWorkoutPlan = user?.workout_plan

  const nutritionPlan = useMemo(() => parseNutritionPlan(rawNutritionPlan), [rawNutritionPlan])
  const workoutPlan = useMemo(() => parseWorkoutPlan(rawWorkoutPlan), [rawWorkoutPlan])

  // Estimate calories and metrics dynamically
  const targetCalories = nutritionPlan?.calories || null
  const totalExercises = (workoutPlan?.exercises && Array.isArray(workoutPlan.exercises)) ? workoutPlan.exercises.length : 0
  const workoutLevel = String(workoutPlan?.level || 'intermediate').toLowerCase()
  const workoutTitle = workoutPlan?.title || null
  const workoutDuration = workoutPlan?.duration || null

  const totalDays = workoutPlan?.daysPerWeek || 5
  const totalDaysAr = totalDays === 1 ? 'يوم واحد'
    : totalDays === 2 ? 'يومين'
    : totalDays >= 3 && totalDays <= 10 ? `${totalDays} أيام`
    : `${totalDays} يوم`

  // Dynamic description
  const workoutDescription = workoutPlan 
    ? (language === 'ar' 
        ? `برنامج تدريبي مخصص ومصمم من الكوتش مصعب خصيصاً لأهدافك. يحتوي البرنامج على ${totalExercises} تمارين متتابعة تركز على الأداء والضخامة العضلية البنائية.`
        : `Tailored training routine designed explicitly for your physical profile by Coach Mosab. Includes ${totalExercises} highly optimized compound movements focusing on hypertrophic response.`)
    : null

  // Dynamic meals mapping
  let displayMeals = []
  if (nutritionPlan?.meals && Array.isArray(nutritionPlan.meals)) {
    displayMeals = nutritionPlan.meals
      .filter(m => m && typeof m === 'object')
      .map(m => ({
        name: m.name || 'Meal',
        time: m.time || 'Anytime',
        isDynamic: true,
        foods: Array.isArray(m.foods) ? m.foods : [],
        kcal: (Array.isArray(m.foods) ? m.foods.length : 0) * 150 + 120 // dynamic estimation for aesthetic visualization
      }))
  }

  return (
    <div className="space-y-8 font-dmsans select-none animate-fade-in">
      {/* Header */}
      <div className="text-left rtl:text-right flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-bebas text-4xl md:text-5xl text-[#F5F5F5] uppercase tracking-wide">
            {language === 'ar' ? `مرحباً بك مجدداً، ${user?.full_name?.split(' ')[0] || 'بطل'}` : `WELCOME BACK, ${user?.full_name?.split(' ')[0] || 'LIFTER'}`}
          </h1>
          <p className="text-sm text-[#666666] font-semibold uppercase tracking-wider">
            {language === 'ar' ? 'لنحقق أهداف اليوم البدنية.' : "Let's smash today's targets."}
          </p>
        </div>
        {(workoutPlan || nutritionPlan) && (
          <Badge variant="accent" className="self-start md:self-auto font-bebas uppercase tracking-wider text-xs">
            {language === 'ar' ? 'الخطة المخصصة نشطة' : 'ACTIVE CUSTOM PLAN'}
          </Badge>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left rtl:text-right">
        <Card className="flex items-center gap-4 bg-[#111111] border border-[#1F1F1F] hover:border-[#2F2F2F] transition-all duration-300">
          <div className="p-3 rounded-lg bg-[#E8FF00]/10 text-[#E8FF00] border border-[#E8FF00]/25">
            <Dumbbell size={24} />
          </div>
          <div>
            <span className="text-[10px] text-[#666666] font-bold uppercase tracking-wider block">{language === 'ar' ? 'المكتمل' : 'Completed'}</span>
            <span className="font-bebas text-2xl text-[#F5F5F5]">
              {language === 'ar' 
                ? `${stats.completedDaysThisWeek} / ${totalDaysAr}` 
                : `${stats.completedDaysThisWeek} / ${totalDays} days`}
            </span>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-[#111111] border border-[#1F1F1F] hover:border-[#2F2F2F] transition-all duration-300">
          <div className="p-3 rounded-lg bg-[#FF8C00]/10 text-[#FF8C00] border border-[#FF8C00]/25">
            <Flame size={24} />
          </div>
          <div>
            <span className="text-[10px] text-[#666666] font-bold uppercase tracking-wider block">{language === 'ar' ? 'التزام متواصل' : 'Streak'}</span>
            <span className="font-bebas text-2xl text-[#F5F5F5]">
              {language === 'ar' 
                ? `${stats.streak} يوم` 
                : `${stats.streak} Days`}
            </span>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-[#111111] border border-[#1F1F1F] hover:border-[#2F2F2F] transition-all duration-300">
          <div className="p-3 rounded-lg bg-[#4DA6FF]/10 text-[#4DA6FF] border border-[#4DA6FF]/25">
            <Calendar size={24} />
          </div>
          <div>
            <span className="text-[10px] text-[#666666] font-bold uppercase tracking-wider block">{language === 'ar' ? 'التمرين التالي' : 'Next Up'}</span>
            <span className="font-bebas text-2xl text-[#F5F5F5] truncate max-w-[120px]">
              {workoutPlan ? (workoutTitle || 'TRAINING SESSION').toUpperCase() : (language === 'ar' ? 'يوم راحة' : 'REST DAY')}
            </span>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-[#111111] border border-[#1F1F1F] hover:border-[#2F2F2F] transition-all duration-300">
          <div className="p-3 rounded-lg bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/25">
            <Apple size={24} />
          </div>
          <div>
            <span className="text-[10px] text-[#666666] font-bold uppercase tracking-wider block">{language === 'ar' ? 'السعرات المستهدفة' : 'Target Calories'}</span>
            <span className="font-bebas text-2xl text-[#F5F5F5]">
              {targetCalories ? `${targetCalories} kcal` : '—'}
            </span>
          </div>
        </Card>
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left rtl:text-right">
        {/* Today's Workout Card */}
        {workoutPlan ? (
          <Card className="lg:col-span-2 flex flex-col justify-between border-l-4 border-l-[#E8FF00] rtl:border-l-0 rtl:border-r-4 rtl:border-r-[#E8FF00] bg-[#111111] border-y border-r border-[#1F1F1F] p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#E8FF00]/2 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#E8FF00] uppercase tracking-wider">
                  {language === 'ar' ? 'جلسة اليوم المخصصة' : "Today's Session"}
                </span>
                <Badge variant={workoutLevel === 'beginner' ? 'beginner' : workoutLevel === 'advanced' ? 'advanced' : 'intermediate'} className="font-bold text-[10px] uppercase">
                  {language === 'ar' ? `${workoutLevel === 'beginner' ? 'مبتدئ' : workoutLevel === 'advanced' ? 'متقدم' : 'متوسط'}` : workoutLevel}
                </Badge>
              </div>
              <h3 className="font-bebas text-3xl text-[#F5F5F5] tracking-wide group-hover:text-[#E8FF00] transition-colors duration-300">
                {String(workoutTitle || 'CUSTOM WORKOUT').toUpperCase()}
              </h3>
              <p className="text-sm text-[#888888] leading-relaxed font-semibold">
                {workoutDescription}
              </p>
              <div className="flex items-center gap-4 text-xs font-bold text-[#666666] uppercase mt-2 pt-2 border-t border-[#1F1F1F]">
                <span>{totalExercises} {language === 'ar' ? 'تمارين' : 'Exercises'}</span>
                <span>•</span>
                <span>{workoutDuration || 'Ongoing'} {language === 'ar' ? 'المدة المقدرة' : 'Est. Duration'}</span>
              </div>
            </div>
            <Button onClick={() => navigate('/dashboard/workouts/active/today')} className="mt-6 w-full font-bebas uppercase tracking-wider text-base py-3.5 shadow-lg shadow-[#E8FF00]/10 hover:shadow-[#E8FF00]/20 transition-all duration-300">
              {language === 'ar' ? 'ابدأ التمرين التفاعلي' : 'START INTERACTIVE WORKOUT'}
            </Button>
          </Card>
        ) : (
          <Card className="lg:col-span-2 flex flex-col justify-center items-center text-center border border-[#1F1F1F] bg-[#111111] p-8 space-y-4 min-h-[300px]">
            <div className="w-12 h-12 rounded-full bg-[#1F1F1F] flex items-center justify-center text-[#666666] border border-[#2F2F2F]">
              <Dumbbell size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bebas text-lg text-[#F5F5F5] tracking-wide uppercase">
                {language === 'ar' ? 'لا توجد حصة تدريبية مجدولة اليوم' : 'NO WORKOUT SCHEDULED TODAY'}
              </h4>
              <p className="text-xs text-[#666666] font-semibold max-w-xs leading-relaxed">
                {language === 'ar'
                  ? 'برنامجك التدريبي قيد المراجعة والتحضير من الكوتش مصعب. خذ قسطاً كافياً من الراحة والاستشفاء اليوم.'
                  : 'Your physical metrics are being analyzed. Coach Mosab will assign your training program shortly. Focus on hydration and recovery today.'}
              </p>
            </div>
          </Card>
        )}

        {/* Recent video thumbnail card */}
        <Card className="flex flex-col justify-between bg-[#111111] border border-[#1F1F1F] p-6 relative overflow-hidden group">
          <div className="space-y-3">
            <span className="text-xs font-bold text-[#666666] uppercase tracking-wider block">
              {language === 'ar' ? 'أحدث الفيديوهات التعليمية' : 'Latest Instruction Video'}
            </span>
            {latestVideo ? (
              <>
                <div 
                  className="aspect-video relative rounded-lg overflow-hidden bg-black flex items-center justify-center border border-[#1F1F1F] group cursor-pointer" 
                  onClick={() => navigate(`/dashboard/videos/${latestVideo.youtube_id}`)}
                >
                  <img 
                    src={`https://img.youtube.com/vi/${latestVideo.youtube_id}/mqdefault.jpg`} 
                    alt={latestVideo.title} 
                    className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-[#E8FF00]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Play size={32} className="absolute text-[#E8FF00] drop-shadow-[0_0_10px_rgba(232,255,0,0.5)]" fill="#E8FF00" />
                </div>
                <h4 className="font-bebas text-lg text-[#F5F5F5] truncate leading-tight mt-1">
                  {latestVideo.title}
                </h4>
              </>
            ) : (
              <>
                <div className="aspect-video relative rounded-lg overflow-hidden bg-black/40 flex flex-col items-center justify-center border border-dashed border-[#1F1F1F] gap-2 p-4 text-center">
                  <span className="text-[10px] text-[#666666] font-bold uppercase tracking-wider">
                    {language === 'ar' ? 'المكتبة فارغة' : 'Library Empty'}
                  </span>
                  <span className="text-[10px] text-[#444444] font-medium leading-relaxed">
                    {language === 'ar' ? 'سيقوم الكوتش مصعب بإضافة فيديوهات تعليمية قريباً.' : 'Coach Mosab will upload instructional videos soon.'}
                  </span>
                </div>
                <h4 className="font-bebas text-lg text-[#555555] truncate leading-tight mt-1">
                  {language === 'ar' ? 'لا توجد فيديوهات بعد' : 'No Videos Available Yet'}
                </h4>
              </>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/dashboard/videos')} 
            className="mt-4 border-[#1F1F1F] hover:bg-[#161616] font-bebas uppercase tracking-wider text-xs py-2"
          >
            {language === 'ar' ? 'فتح المكتبة' : 'OPEN LIBRARY'}
          </Button>
        </Card>
      </div>

      {/* Today's meals scroll list */}
      <div className="space-y-3 text-left rtl:text-right">
        <h3 className="font-bebas text-xl text-[#F5F5F5] uppercase tracking-wider">
          {language === 'ar' ? 'وجبات اليوم المجدولة' : "Today's Scheduled Meals"}
        </h3>
        {nutritionPlan && displayMeals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {displayMeals.map((meal, idx) => (
              <Card key={idx} className="p-4 space-y-3 bg-[#111111] border border-[#1F1F1F] hover:border-[#4DA6FF]/30 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#4DA6FF]/2 rounded-full blur-2xl pointer-events-none" />
                <div className="flex justify-between items-center border-b border-[#1F1F1F] pb-2">
                  <span className="font-bebas text-lg text-[#F5F5F5] tracking-wide group-hover:text-[#4DA6FF] transition-colors duration-300">
                    {meal.name}
                  </span>
                  <span className="text-[10px] text-[#666666] font-bold uppercase tracking-wider">
                    {meal.time}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="space-y-1 max-h-[80px] overflow-y-auto pr-1">
                    {meal.foods.length === 0 ? (
                      <span className="text-[10px] text-[#555555] italic">No items listed.</span>
                    ) : (
                      meal.foods.slice(0, 3).map((food, fIdx) => (
                        <div key={fIdx} className="flex justify-between text-[11px] font-semibold text-[#888888]">
                          <span className="truncate max-w-[120px]">{food.name}</span>
                          <span className="text-[#666666] shrink-0 font-bold">{food.qty}</span>
                        </div>
                      ))
                    )}
                    {meal.foods.length > 3 && (
                      <div className="text-[9px] text-[#4DA6FF] font-bold uppercase mt-1">
                        + {meal.foods.length - 3} {language === 'ar' ? 'أصناف إضافية' : 'more items'}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border border-[#1F1F1F] bg-[#111111]/40 p-6 text-center text-xs text-[#666666] font-semibold">
            {language === 'ar'
              ? 'لا توجد وجبات مجدولة حالياً. سيقوم الكوتش مصعب بإضافة جدول التغذية الخاص بك قريباً.'
              : 'No scheduled meals available. Your customized nutrition program will appear here once assigned by Coach Mosab.'}
          </Card>
        )}
      </div>
    </div>
  )
}

export default Dashboard;
