import React, { useMemo, useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../store/authStore'
import { useLanguageStore } from '../../store/languageStore'
import { supabase } from '../../lib/supabase'
import { Apple, Flame, Beef, Wheat, Droplets, Clock, UtensilsCrossed, Sparkles, ArrowLeftRight } from 'lucide-react'
import { parseNutritionPlan } from '../../utils/planParser'

/* ── Circular macro ring ──────────────── */
function MacroRing({ value, label, color, icon: Icon, unit = 'g' }) {
  const radius = 36, stroke = 5
  const circumference = 2 * Math.PI * radius
  return (
    <div className="flex flex-col items-center gap-2 group cursor-help transition-all duration-300 hover:scale-105">
      <div className="relative w-[96px] h-[96px]">
        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-10 blur-md transition-opacity duration-300" style={{ backgroundColor: color }} />
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="#161616" strokeWidth={stroke} />
          <circle cx="40" cy="40" r={radius} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circumference} strokeDashoffset={0} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon size={16} style={{ color }} className="group-hover:scale-110 transition-transform duration-300" />
          <span className="font-bebas text-lg text-[#F5F5F5] leading-tight mt-0.5">{value}</span>
          <span className="text-[9px] font-bold text-[#666666] uppercase">{unit}</span>
        </div>
      </div>
      <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider group-hover:text-white transition-colors">{label}</span>
    </div>
  )
}

/* ── Meal card ─────────────── */
function MealCard({ meal, index, language }) {
  const accentColors = ['#E8FF00', '#4DA6FF', '#A78BFA', '#34D399', '#FF8C00', '#FF3A2D']
  const accent = accentColors[index % accentColors.length]
  return (
    <Card className="p-0 overflow-hidden border border-[#1F1F1F] hover:border-[#2F2F2F] transition-all duration-300 group hover:-translate-y-0.5 bg-[#111111] relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFFFFF]/1 rounded-full blur-2xl pointer-events-none" />
      <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${accent}18` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}12`, border: `1px solid ${accent}25` }}>
            <UtensilsCrossed size={16} style={{ color: accent }} />
          </div>
          <div>
            <h4 className="font-bebas text-lg text-[#F5F5F5] tracking-wide leading-tight group-hover:text-white transition-colors">{meal.name}</h4>
            <div className="flex items-center gap-1 mt-0.5">
              <Clock size={10} className="text-[#666666]" />
              <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">{meal.time}</span>
            </div>
          </div>
        </div>
        <Badge variant="default" className="text-[10px] font-bold uppercase py-0.5 px-2">
          {meal.foods?.length || 0} {language === 'ar' ? 'أصناف' : 'items'}
        </Badge>
      </div>
      {meal.foods && meal.foods.length > 0 && (
        <div className="px-5 py-3 space-y-2">
          {meal.foods.map((food, fi) => (
            <div key={fi} className="flex items-center justify-between py-1.5 border-b border-[#1A1A1A] last:border-0">
              <div className="min-w-0 flex-1">
                <span className="text-xs text-[#CCCCCC] font-semibold">{food.name}</span>
                {food.calories > 0 && (
                  <div className="flex items-center gap-2.5 mt-1">
                    <span className="text-[9px] font-bold text-[#E8FF00] bg-[#E8FF00]/8 px-1.5 py-0.5 rounded">{food.calories} kcal</span>
                    <span className="text-[8px] font-bold text-[#FF3A2D]">P:{food.protein}g</span>
                    <span className="text-[8px] font-bold text-[#4DA6FF]">C:{food.carbs}g</span>
                    <span className="text-[8px] font-bold text-[#34D399]">F:{food.fat}g</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold text-[#666666] uppercase shrink-0 ml-3">{food.qty}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

/* ══ Main Nutrition Page ══════════════════════════════════════ */
export function Nutrition() {
  const { language } = useLanguageStore()
  const user = useAuthStore((state) => state.user)
  const rawPlan = user?.nutrition_plan
  const plan = useMemo(() => parseNutritionPlan(rawPlan), [rawPlan])

  const [alternatives, setAlternatives] = useState([])
  const [altLoading, setAltLoading] = useState(true)

  useEffect(() => {
    supabase.from('food_alternatives').select('*').order('sort_order', { ascending: true })
      .then(({ data }) => { setAlternatives(data || []); setAltLoading(false) })
  }, [])

  const altCategories = [
    { key: 'Protein', icon: Beef, color: '#FF3A2D', label: language === 'ar' ? 'البروتين' : 'Protein' },
    { key: 'Carbs', icon: Wheat, color: '#4DA6FF', label: language === 'ar' ? 'الكربوهيدرات' : 'Carbs' },
    { key: 'Fats', icon: Droplets, color: '#34D399', label: language === 'ar' ? 'الدهون' : 'Fats' },
  ]

  const hasStructuredData = plan && plan.meals && plan.meals.length > 0

  return (
    <div className="space-y-6 font-dmsans select-none animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F1F] pb-4 text-left rtl:text-right">
        <div>
          <h1 className="font-bebas text-4xl md:text-5xl text-[#F5F5F5] uppercase tracking-wide">
            {language === 'ar' ? 'التغذية والأنظمة الغذائية اليومية' : "TODAY'S NUTRITION"}
          </h1>
          <p className="text-sm text-[#666666] font-semibold uppercase tracking-wider mt-0.5">
            {language === 'ar' ? 'المخططات الغذائية المخصصة وجداول الوجبات اليومية الخاصة بك.' : 'Your customized nutritional guidelines and daily meal intake.'}
          </p>
        </div>
        {plan && (
          <Badge variant="accent" className="font-bebas uppercase tracking-wider text-xs self-start sm:self-auto">
            {language === 'ar' ? 'الخطة الغذائية نشطة' : 'ACTIVE CUSTOM PLAN'}
          </Badge>
        )}
      </div>

      {hasStructuredData ? (
        <>
          {/* Macro targets */}
          <Card className="bg-[#111111] border border-[#1F1F1F] p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#E8FF00]/2 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
            <div className="flex items-center gap-3 mb-8 border-b border-[#1F1F1F] pb-4 text-left rtl:text-right">
              <div className="w-10 h-10 rounded-xl bg-[#E8FF00]/10 border border-[#E8FF00]/20 flex items-center justify-center text-[#E8FF00]"><Flame size={20} /></div>
              <div>
                <h2 className="font-bebas text-xl text-[#F5F5F5] tracking-wide uppercase">{language === 'ar' ? 'الأهداف الغذائية اليومية' : 'DAILY NUTRITION TARGETS'}</h2>
                <p className="text-[10px] text-[#666666] font-bold uppercase tracking-wider">{language === 'ar' ? 'مصمم بواسطة الكوتش مصعب' : 'Designed by Coach Mosab'}</p>
              </div>
            </div>
            <div className="flex items-center justify-around flex-wrap gap-6 py-2">
              <MacroRing value={plan.calories || 0} label={language === 'ar' ? 'السعرات' : 'Calories'} color="#E8FF00" icon={Flame} unit="kcal" />
              <MacroRing value={plan.macros?.protein || 0} label={language === 'ar' ? 'البروتين' : 'Protein'} color="#FF3A2D" icon={Beef} />
              <MacroRing value={plan.macros?.carbs || 0} label={language === 'ar' ? 'الكربوهيدرات' : 'Carbs'} color="#4DA6FF" icon={Wheat} />
              <MacroRing value={plan.macros?.fat || 0} label={language === 'ar' ? 'الدهون' : 'Fat'} color="#34D399" icon={Droplets} />
            </div>
            <div className="mt-6 pt-4 border-t border-[#1F1F1F] flex items-start gap-2.5 text-xs text-[#666666]">
              <Sparkles size={16} className="text-[#E8FF00] shrink-0 mt-0.5" />
              <p className="leading-relaxed font-semibold">
                {language === 'ar'
                  ? 'رؤية التغذية: تأكد من تلبية أهداف البروتين الخاصة بك يومياً لتسريع استشفاء العضلات.'
                  : 'Nutrition Insight: Hit your daily protein target for muscle tissue repair. Stay hydrated with at least 3.5L of water daily.'}
              </p>
            </div>
          </Card>

          {/* Meal schedule */}
          {plan.meals.length > 0 && (
            <div className="space-y-4 text-left rtl:text-right">
              <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide uppercase">
                {language === 'ar' ? `جدول الوجبات (${plan.meals.length} وجبات)` : `MEAL SCHEDULE (${plan.meals.length} meals)`}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.meals.map((meal, idx) => <MealCard key={meal.id || idx} meal={meal} index={idx} language={language} />)}
              </div>
            </div>
          )}
        </>
      ) : (
        <Card className="border border-[#1F1F1F] bg-[#111111] p-8 text-center space-y-4 max-w-xl mx-auto mt-8 relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-[#1F1F1F] flex items-center justify-center text-[#666666] mx-auto border border-[#2F2F2F]"><Apple size={28} /></div>
          <div className="space-y-1.5">
            <h3 className="font-bebas text-2xl text-[#F5F5F5] tracking-wide uppercase">
              {language === 'ar' ? 'لم يتم تعيين خطة غذائية بعد' : 'NO NUTRITION PLAN ASSIGNED'}
            </h3>
            <p className="text-xs text-[#666666] font-semibold max-w-sm mx-auto leading-relaxed">
              {language === 'ar'
                ? 'يقوم الكوتش مصعب حالياً بحساب السعرات الحرارية المناسبة. ستظهر خطتك هنا بمجرد تعيينها!'
                : 'Coach Mosab is currently calculating your caloric limits. Your personalized diet plan will appear here once assigned!'}
            </p>
          </div>
        </Card>
      )}

      {/* ══ Food Alternatives (always visible to all subscribers) ══ */}
      {!altLoading && alternatives.length > 0 && (
        <Card className="bg-[#111111] border border-[#1F1F1F] p-6 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#4DA6FF]/3 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
          <div className="flex items-center gap-3 mb-5 border-b border-[#1F1F1F] pb-4 text-left rtl:text-right">
            <div className="w-10 h-10 rounded-xl bg-[#A78BFA]/10 border border-[#A78BFA]/20 flex items-center justify-center text-[#A78BFA]">
              <ArrowLeftRight size={20} />
            </div>
            <div>
              <h2 className="font-bebas text-xl text-[#F5F5F5] tracking-wide uppercase">
                {language === 'ar' ? 'بدائل الأغذية' : 'FOOD ALTERNATIVES'}
              </h2>
              <p className="text-[10px] text-[#666666] font-bold uppercase tracking-wider">
                {language === 'ar' ? 'استبدل أي عنصر غذائي ببديل مكافئ' : 'Swap any food item with an equivalent alternative'}
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {altCategories.map(cat => {
              const catItems = alternatives.filter(a => a.category === cat.key)
              if (catItems.length === 0) return null
              return (
                <div key={cat.key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <cat.icon size={14} style={{ color: cat.color }} />
                    <span className="font-bebas text-sm tracking-wide uppercase" style={{ color: cat.color }}>{cat.label}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {catItems.map(item => (
                      <div key={item.id} className="flex items-center gap-3 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl px-4 py-2.5 hover:border-[#2A2A2A] transition-colors">
                        <span className="text-xs text-[#F5F5F5] font-bold shrink-0">{item.original_food}</span>
                        <ArrowLeftRight size={10} className="text-[#444] shrink-0" />
                        <div className="flex flex-wrap gap-1">
                          {item.alternatives.map((alt, ai) => (
                            <span key={ai} className="text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-full"
                              style={{ backgroundColor: `${cat.color}12`, color: cat.color, border: `1px solid ${cat.color}20` }}>
                              {alt}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

export default Nutrition
