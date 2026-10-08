import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { estimateFoodCalories } from '../../lib/groqCalories'
import { toast } from '../../store/toastStore'
import { parseWorkoutPlan, parseNutritionPlan } from '../../utils/planParser'
import { useLanguageStore } from '../../store/languageStore'
import {
  Search,
  Dumbbell,
  Apple,
  Edit3,
  Eye,
  RefreshCw,
  Plus,
  Trash2,
  UserCheck,
  Check,
  X,
  Send,
  AlertTriangle,
  Sparkles,
  Loader2
} from 'lucide-react'

// Inline YouTube icon (lucide-react version-safe)
const YtIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)

export function ManagePlans() {
  const { language } = useLanguageStore()
  
  // Independent templates state
  const [plans, setPlans] = useState([])
  const [subscribers, setSubscribers] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [loadingSubs, setLoadingSubs] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('workout') // 'workout' | 'nutrition'
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { id, title } | null
  
  // Selection and template form state
  const [selectedPlan, setSelectedPlan] = useState(null) // plan template object
  const [templateBeingEdited, setTemplateBeingEdited] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newType, setNewType] = useState('workout')
  const [creatingPlan, setCreatingPlan] = useState(false)
  // Structured workout — organized by training days
  const [trainingDays, setTrainingDays] = useState(3)
  const [activeDay, setActiveDay] = useState(0) // which day tab is active
  const [newDays, setNewDays] = useState([
    { label: 'Day 1', exercises: [{ name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s', youtubeUrl: '' }] },
    { label: 'Day 2', exercises: [{ name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s', youtubeUrl: '' }] },
    { label: 'Day 3', exercises: [{ name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s', youtubeUrl: '' }] },
  ])
  // Structured nutrition fields
  const [newCalories, setNewCalories] = useState(2200)
  const [newProtein, setNewProtein] = useState(160)
  const [newCarbs, setNewCarbs] = useState(220)
  const [newFat, setNewFat] = useState(65)
  const [newMeals, setNewMeals] = useState([{ name: 'Breakfast', time: '7:00 AM', foods: [{ name: '', qty: '' }] }])
  const [calculatingNutrition, setCalculatingNutrition] = useState(false)
  const [nutritionCalculated, setNutritionCalculated] = useState(false)
  const nutritionEditsRef = useRef(0)

  // Assignment Modal states
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignSearch, setAssignSearch] = useState('')
  const [assigningTo, setAssigningTo] = useState(null) // subscriber profile
  const [submittingAssignment, setSubmittingAssignment] = useState(false)

  // Training days change handler
  const handleTrainingDaysChange = (count) => {
    const n = Number(count)
    setTrainingDays(n)
    setNewDays(prev => {
      if (n > prev.length) {
        return [...prev, ...Array.from({ length: n - prev.length }, (_, i) => ({ label: `Day ${prev.length + i + 1}`, exercises: [{ name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s' }] }))]
      }
      return prev.slice(0, n)
    })
    if (activeDay >= n) setActiveDay(n - 1)
  }

  // Day-scoped exercise helpers
  const addExercise = () => setNewDays(prev => prev.map((d, i) => i === activeDay ? { ...d, exercises: [...d.exercises, { name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s', youtubeUrl: '' }] } : d))
  const removeExercise = (idx) => setNewDays(prev => prev.map((d, i) => i === activeDay ? { ...d, exercises: d.exercises.filter((_, ei) => ei !== idx) } : d))
  const updateExercise = (idx, field, value) => setNewDays(prev => prev.map((d, i) => i === activeDay ? { ...d, exercises: d.exercises.map((ex, ei) => ei === idx ? { ...ex, [field]: value } : ex) } : d))
  const updateDayLabel = (dayIdx, label) => setNewDays(prev => prev.map((d, i) => i === dayIdx ? { ...d, label } : d))

  // Meal card helpers
  const invalidateNutritionCalculation = () => {
    nutritionEditsRef.current += 1
    setNutritionCalculated(false)
  }
  const addMeal = () => {
    invalidateNutritionCalculation()
    setNewMeals(prev => [...prev, { name: '', time: '', foods: [{ name: '', qty: '' }] }])
  }
  const removeMeal = (idx) => {
    invalidateNutritionCalculation()
    setNewMeals(prev => prev.filter((_, i) => i !== idx))
  }
  const updateMeal = (idx, field, value) => {
    nutritionEditsRef.current += 1
    setNewMeals(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m))
  }
  const addFood = (mealIdx) => {
    invalidateNutritionCalculation()
    setNewMeals(prev => prev.map((m, i) => i === mealIdx ? { ...m, foods: [...m.foods, { name: '', qty: '' }] } : m))
  }
  const removeFood = (mealIdx, foodIdx) => {
    invalidateNutritionCalculation()
    setNewMeals(prev => prev.map((m, i) => i === mealIdx ? { ...m, foods: m.foods.filter((_, fi) => fi !== foodIdx) } : m))
  }
  const updateFood = (mealIdx, foodIdx, field, value) => {
    invalidateNutritionCalculation()
    setNewMeals(prev => prev.map((m, i) => i === mealIdx ? { ...m, foods: m.foods.map((f, fi) => fi === foodIdx ? { ...f, [field]: value } : f) } : m))
  }

  const handleCalculateNutrition = async () => {
    const foods = newMeals.flatMap(meal => meal.foods.filter(food => food.name.trim()))
    if (foods.length === 0) {
      toast.error(language === 'ar' ? 'أضف طعاماً واحداً على الأقل أولاً.' : 'Add at least one food item first.')
      return
    }
    if (foods.some(food => !food.qty.trim())) {
      toast.error(language === 'ar' ? 'أدخل كمية لكل طعام قبل الحساب.' : 'Enter a quantity for each food before calculating.')
      return
    }

    const editVersion = nutritionEditsRef.current
    setCalculatingNutrition(true)
    try {
      const result = await estimateFoodCalories(foods)
      if (editVersion !== nutritionEditsRef.current) return
      if (result.foods.length !== foods.length) throw new Error('Incomplete food estimates received.')

      let foodIndex = 0
      const updatedMeals = newMeals.map(meal => ({
        ...meal,
        foods: meal.foods.map(food => {
          if (!food.name.trim()) return food
          const estimate = result.foods[foodIndex++]
          return {
            ...food,
            calories: Number(estimate.calories) || 0,
            protein: Number(estimate.protein) || 0,
            carbs: Number(estimate.carbs) || 0,
            fat: Number(estimate.fat) || 0
          }
        })
      }))
      setNewMeals(updatedMeals)
      setNewCalories(Number(result.totals.calories) || 0)
      setNewProtein(Number(result.totals.protein) || 0)
      setNewCarbs(Number(result.totals.carbs) || 0)
      setNewFat(Number(result.totals.fat) || 0)
      setNutritionCalculated(true)
      toast.success(language === 'ar' ? 'تم حساب السعرات والعناصر الغذائية.' : 'Calories and macros calculated.')
    } catch (err) {
      console.error('Error calculating template nutrition:', err)
      toast.error((language === 'ar' ? 'فشل حساب السعرات: ' : 'Calorie calculation failed: ') + err.message)
    } finally {
      setCalculatingNutrition(false)
    }
  }

  // 1. Fetch Plan Templates from public.plans
  const fetchPlansTemplates = useCallback(async () => {
    setLoadingPlans(true)
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPlans(data || [])
    } catch (err) {
      console.error('Error fetching plan templates:', err)
      toast.error(language === 'ar' ? 'فشل تحميل الخطط المخزنة.' : 'Failed to load stored templates.')
    } finally {
      setLoadingPlans(false)
    }
  }, [language])

  // 2. Fetch Active Subscribers
  const fetchSubscribersList = useCallback(async () => {
    setLoadingSubs(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, fitness_level, workout_plan, nutrition_plan')
        .eq('role', 'subscriber')
        .order('full_name', { ascending: true })

      if (error) throw error
      setSubscribers(data || [])
    } catch (err) {
      console.error('Error fetching subscriber profiles:', err)
    } finally {
      setLoadingSubs(false)
    }
  }, [])

  useEffect(() => {
    fetchPlansTemplates()
    fetchSubscribersList()
  }, [fetchPlansTemplates, fetchSubscribersList])

  // Split plans by type, dynamically applying client-side parsing fallback so old templates show rich metrics too
  const workoutTemplates = useMemo(() => {
    return plans.filter(p => p.type === 'workout').map(p => {
      const parsedData = parseWorkoutPlan(p.plan_data || { text: p.plan_data?.text || '' })
      return {
        ...p,
        plan_data: parsedData
      }
    })
  }, [plans])

  const nutritionTemplates = useMemo(() => {
    return plans.filter(p => p.type === 'nutrition').map(p => {
      const parsedData = parseNutritionPlan(p.plan_data || { text: p.plan_data?.text || '' })
      return {
        ...p,
        plan_data: parsedData
      }
    })
  }, [plans])

  // Filter templates list
  const filteredTemplates = useMemo(() => {
    const list = activeTab === 'workout' ? workoutTemplates : nutritionTemplates
    return list.filter(p =>
      (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [activeTab, workoutTemplates, nutritionTemplates, searchTerm])

  // Filter subscribers list for assigning modal
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter(s =>
      (s.full_name || '').toLowerCase().includes(assignSearch.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(assignSearch.toLowerCase())
    )
  }, [subscribers, assignSearch])

  // Visual preview of the selected template
  const parsedPreview = useMemo(() => {
    if (!selectedPlan) return null
    return selectedPlan.type === 'workout'
      ? parseWorkoutPlan(selectedPlan.plan_data)
      : parseNutritionPlan(selectedPlan.plan_data)
  }, [selectedPlan])

  // Handle plan template selection
  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan)
  }

  const openCreateTemplate = () => {
    setTemplateBeingEdited(null)
    setNewType(activeTab)
    setNewTitle('')
    setNewDescription('')
    setTrainingDays(3)
    setActiveDay(0)
    setNewDays([1, 2, 3].map(n => ({
      label: `Day ${n}`,
      exercises: [{ name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s', youtubeUrl: '' }]
    })))
    setNewCalories(2200)
    setNewProtein(160)
    setNewCarbs(220)
    setNewFat(65)
    setNewMeals([{ name: 'Breakfast', time: '7:00 AM', foods: [{ name: '', qty: '' }] }])
    nutritionEditsRef.current += 1
    setNutritionCalculated(false)
    setShowCreateModal(true)
  }

  const openEditTemplate = () => {
    if (!selectedPlan) return
    setTemplateBeingEdited(selectedPlan.id)
    setNewType(selectedPlan.type)
    setNewTitle(selectedPlan.title || '')
    setNewDescription(selectedPlan.description || '')

    if (selectedPlan.type === 'workout') {
      const plan = parseWorkoutPlan(selectedPlan.plan_data)
      const exercises = plan?.exercises || []
      const dayCount = Math.min(7, Math.max(1, plan?.days?.length || 0, Number(plan?.daysPerWeek) || 0, ...exercises.map(ex => Number(ex.day) || 1)))
      const days = Array.from({ length: dayCount }, (_, index) => {
        const day = plan?.days?.[index]
        const dayExercises = day?.exercises || exercises.filter(ex => Number(ex.day || 1) === index + 1)
        return {
          label: day?.label || `Day ${index + 1}`,
          exercises: dayExercises.length > 0 ? dayExercises.map(ex => ({
            name: ex.name || '',
            sets: Number(ex.sets) || 3,
            reps: ex.reps || '8:10',
            rir: String(ex.rir || '—').match(/[0-3]/)?.[0] || '—',
            rest: ex.rest || '90s',
            youtubeUrl: ex.youtubeUrl || ''
          })) : [{ name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s', youtubeUrl: '' }]
        }
      })
      setTrainingDays(dayCount)
      setActiveDay(0)
      setNewDays(days)
    } else {
      const plan = parseNutritionPlan(selectedPlan.plan_data)
      setNewCalories(Number(plan?.calories) || 0)
      setNewProtein(Number(plan?.macros?.protein) || 0)
      setNewCarbs(Number(plan?.macros?.carbs) || 0)
      setNewFat(Number(plan?.macros?.fat) || 0)
      setNewMeals(plan?.meals?.length ? plan.meals.map(meal => ({
        name: meal.name || '',
        time: meal.time || '',
        foods: meal.foods?.length ? meal.foods.map(food => ({ ...food })) : [{ name: '', qty: '' }]
      })) : [{ name: 'Breakfast', time: '7:00 AM', foods: [{ name: '', qty: '' }] }])
      setNutritionCalculated(Boolean(plan?.meals?.some(meal => meal.foods?.some(food => food.calories != null))))
    }

    nutritionEditsRef.current += 1
    setShowCreateModal(true)
  }

  // Save the visual template form for both new and existing templates.
  const handleSaveTemplate = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال العنوان.' : 'Please enter a title.')
      return
    }
    if (newType === 'workout' && newDays.every(d => d.exercises.filter(ex => ex.name.trim()).length === 0)) {
      toast.error(language === 'ar' ? 'أضف تمريناً واحداً على الأقل.' : 'Add at least one exercise.')
      return
    }
    if (newType === 'nutrition' && newMeals.filter(m => m.name.trim()).length === 0) {
      toast.error(language === 'ar' ? 'أضف وجبة واحدة على الأقل.' : 'Add at least one meal.')
      return
    }
    setCreatingPlan(true)
    try {
      let planData = {}
      let textRepresentation = ''

      if (newType === 'workout') {
        // Build days structure
        const days = newDays.map((day, di) => {
          const exercises = day.exercises.filter(ex => ex.name.trim()).map((ex, ei) => ({
            id: `d${di+1}-ex-${ei+1}`,
            name: ex.name.trim(),
            sets: Number(ex.sets) || 3,
            reps: ex.reps || '10',
            rest: ex.rest || '90s',
            rir: ex.rir && ex.rir !== '\u2014' ? `${ex.rir} RIR` : undefined,
            difficulty: ex.rir === '0' ? 'Hard' : ex.rir === '1' ? 'Medium' : 'Easy',
            dotColor: ex.rir === '0' ? 'bg-[#FF3A2D]' : ex.rir === '1' ? 'bg-[#FF8C00]' : 'bg-[#34D399]',
            guide: `RIR: ${ex.rir}. Keep form stable.`,
            tip: 'Maintain control and focus on the target muscles.',
            youtubeUrl: ex.youtubeUrl || ''
          }))
          return { label: day.label, exercises }
        })
        // Keep day numbers on the flat list for subscriber views and older readers.
        const allExercises = days.flatMap((day, index) =>
          day.exercises.map(ex => ({ ...ex, day: index + 1 }))
        )
        textRepresentation = days.map(d => `# ${d.label}:\n${d.exercises.map(ex => `${ex.name} ${ex.sets} ${ex.reps}`).join('\n')}`).join('\n\n')
        planData = {
          title: newTitle.trim(), days, exercises: allExercises,
          level: templateBeingEdited ? selectedPlan.plan_data?.level || 'intermediate' : 'intermediate',
          duration: templateBeingEdited ? selectedPlan.plan_data?.duration || 'Ongoing' : 'Ongoing',
          daysPerWeek: trainingDays, text: textRepresentation
        }
      } else {
        const meals = newMeals.filter(m => m.name.trim()).map((m, i) => ({
          id: 'meal-' + (i + 1),
          name: m.name.trim(),
          time: m.time || 'Anytime',
          foods: m.foods.filter(f => f.name.trim()).map(f => ({
            name: f.name.trim(),
            qty: f.qty || '1 portion',
            ...(nutritionCalculated ? {
              calories: f.calories || 0,
              protein: f.protein || 0,
              carbs: f.carbs || 0,
              fat: f.fat || 0
            } : {})
          }))
        }))
        textRepresentation = `Calories: ${newCalories} kcal | Protein: ${newProtein}g | Carbs: ${newCarbs}g | Fat: ${newFat}g\n\n` +
          meals.map((m, i) => `MEAL ${i+1}: ${m.name} (${m.time})\n${m.foods.map(f => `• ${f.name} — ${f.qty}`).join('\n')}`).join('\n\n')
        planData = { calories: newCalories, macros: { protein: newProtein, carbs: newCarbs, fat: newFat }, meals, text: textRepresentation }
      }

      const payload = { title: newTitle.trim(), type: newType, description: newDescription, plan_data: planData }
      const query = templateBeingEdited
        ? supabase.from('plans').update(payload).eq('id', templateBeingEdited)
        : supabase.from('plans').insert(payload)
      const { data, error } = await query.select().single()

      if (error) throw error
      toast.success(templateBeingEdited
        ? (language === 'ar' ? 'تم تحديث القالب بنجاح!' : 'Template updated successfully!')
        : (language === 'ar' ? 'تم إنشاء خطة جديدة بنجاح!' : 'New plan template created successfully!'))
      if (data) {
        setPlans(prev => templateBeingEdited
          ? prev.map(plan => plan.id === data.id ? data : plan)
          : [data, ...prev])
        handleSelectPlan(data)
      }

      // Reset
      setNewTitle(''); setNewDescription('')
      setTrainingDays(3); setActiveDay(0)
      setNewDays([
        { label: 'Day 1', exercises: [{ name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s', youtubeUrl: '' }] },
        { label: 'Day 2', exercises: [{ name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s', youtubeUrl: '' }] },
        { label: 'Day 3', exercises: [{ name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s', youtubeUrl: '' }] },
      ])
      setNewMeals([{ name: 'Breakfast', time: '7:00 AM', foods: [{ name: '', qty: '' }] }])
      setNewCalories(2200); setNewProtein(160); setNewCarbs(220); setNewFat(65)
      nutritionEditsRef.current += 1
      setNutritionCalculated(false)
      setTemplateBeingEdited(null)
      setShowCreateModal(false)
    } catch (err) {
      console.error('Error saving template:', err)
      toast.error(language === 'ar' ? 'فشل حفظ القالب في قاعدة البيانات.' : 'Failed to save template.')
    } finally {
      setCreatingPlan(false)
    }
  }

  // Delete Template handler
  const confirmDeleteTemplate = async () => {
    if (!deleteConfirm) return
    const { id: planId } = deleteConfirm
    setDeleteConfirm(null)
    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId)

      if (error) throw error

      toast.success(language === 'ar' ? 'تم حذف قالب الخطة.' : 'Plan template deleted.')
      setPlans(prev => prev.filter(p => p.id !== planId))
      if (selectedPlan?.id === planId) {
        setSelectedPlan(null)
      }
    } catch (err) {
      console.error('Error deleting template:', err)
      toast.error(language === 'ar' ? 'فشل حذف الخطة.' : 'Failed to delete template.')
    }
  }

  // Confirm manual assignment to subscriber
  const handleAssignToSubscriber = async () => {
    if (!selectedPlan || !assigningTo) return
    setSubmittingAssignment(true)
    try {
      const targetColumn = selectedPlan.type === 'workout' ? 'workout_plan' : 'nutrition_plan'
      
      const { error } = await supabase
        .from('profiles')
        .update({
          [targetColumn]: selectedPlan.plan_data
        })
        .eq('id', assigningTo.id)

      if (error) throw error

      toast.success(
        language === 'ar'
          ? `تم تعيين الخطة بنجاح لـ ${assigningTo.full_name || assigningTo.email}!`
          : `Plan successfully assigned to ${assigningTo.full_name || assigningTo.email}!`
      )

      // Refresh subscriber info local state
      setSubscribers(prev => prev.map(s => {
        if (s.id === assigningTo.id) {
          return {
            ...s,
            [targetColumn]: selectedPlan.plan_data
          }
        }
        return s
      }))

      setShowAssignModal(false)
      setAssigningTo(null)
      setAssignSearch('')
    } catch (err) {
      console.error('Error assigning plan:', err)
      toast.error(language === 'ar' ? 'فشل تعيين الخطة للمشترك.' : 'Failed to assign plan to subscriber.')
    } finally {
      setSubmittingAssignment(false)
    }
  }

  return (
    <div className="space-y-6 font-dmsans select-none relative text-left">
      
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <h1 className="font-bebas text-4xl md:text-5xl text-[#F5F5F5] uppercase tracking-wide">
            {language === 'ar' ? 'دليل الخطط والبرامج المستقلة' : 'PLANS TEMPLATES CATALOG'}
          </h1>
          <p className="text-sm text-[#666666] font-semibold uppercase tracking-wider">
            {language === 'ar'
              ? 'صمم خطط تمارين وأنظمة غذائية مستقلة ثم قم بتعيينها بنقرة واحدة للمشتركين.'
              : 'Design standalone workout and meal templates, edit, and assign manually to subscribers.'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={openCreateTemplate}
            className="font-bebas uppercase tracking-wider text-xs py-2 px-4 shadow-[#E8FF00]/5 flex items-center gap-1.5"
          >
            <Plus size={14} /> {language === 'ar' ? 'إنشاء قالب جديد' : 'CREATE NEW TEMPLATE'}
          </Button>
          
          <button
            onClick={fetchPlansTemplates}
            className="p-2.5 rounded-lg border border-[#1F1F1F] bg-[#111111] text-[#666666] hover:text-[#E8FF00] hover:border-[#E8FF00]/30 transition-colors cursor-pointer outline-none"
            title="Refresh Catalog"
          >
            <RefreshCw size={16} className={loadingPlans ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Statistics Quick Indicator Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 bg-[#111111] border border-[#1F1F1F]">
          <div className="p-3 rounded-lg border border-[#E8FF00]/20 bg-[#E8FF00]/10 text-[#E8FF00]">
            <Dumbbell size={20} />
          </div>
          <div>
            <span className="text-[10px] text-[#666666] font-bold uppercase tracking-wider block">
              {language === 'ar' ? 'قوالب خطط التمارين' : 'Workout Templates'}
            </span>
            <span className="font-bebas text-2xl text-[#F5F5F5]">{workoutTemplates.length}</span>
          </div>
        </Card>
        
        <Card className="flex items-center gap-4 bg-[#111111] border border-[#1F1F1F]">
          <div className="p-3 rounded-lg border border-[#4DA6FF]/20 bg-[#4DA6FF]/10 text-[#4DA6FF]">
            <Apple size={20} />
          </div>
          <div>
            <span className="text-[10px] text-[#666666] font-bold uppercase tracking-wider block">
              {language === 'ar' ? 'قوالب الأنظمة الغذائية' : 'Diet Templates'}
            </span>
            <span className="font-bebas text-2xl text-[#F5F5F5]">{nutritionTemplates.length}</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-[#111111] border border-[#1F1F1F]">
          <div className="p-3 rounded-lg border border-[#A78BFA]/20 bg-[#A78BFA]/10 text-[#A78BFA]">
            <UserCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] text-[#666666] font-bold uppercase tracking-wider block">
              {language === 'ar' ? 'إجمالي المشتركين النشطين' : 'Active Subscribers'}
            </span>
            <span className="font-bebas text-2xl text-[#F5F5F5]">{subscribers.length}</span>
          </div>
        </Card>
      </div>

      {/* Tabs list & Search filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between border-b border-[#1F1F1F]/40 pb-2">
        <div className="flex border border-[#1F1F1F] bg-[#111111] p-1 rounded-xl self-start">
          <button
            onClick={() => { setActiveTab('workout'); setSelectedPlan(null) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bebas text-sm tracking-wide uppercase transition-all cursor-pointer outline-none ${
              activeTab === 'workout'
                ? 'bg-[#1C1C1C] text-[#E8FF00]'
                : 'text-[#666666] hover:text-[#F5F5F5]'
            }`}
          >
            <Dumbbell size={14} />
            <span>{language === 'ar' ? 'كتالوج التمارين' : 'Workouts Catalog'}</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('nutrition'); setSelectedPlan(null) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bebas text-sm tracking-wide uppercase transition-all cursor-pointer outline-none ${
              activeTab === 'nutrition'
                ? 'bg-[#1C1C1C] text-[#4DA6FF]'
                : 'text-[#666666] hover:text-[#F5F5F5]'
            }`}
          >
            <Apple size={14} />
            <span>{language === 'ar' ? 'كتالوج الأنظمة الغذائية' : 'Nutrition Catalog'}</span>
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" size={16} />
          <input
            type="text"
            placeholder={language === 'ar' ? 'ابحث باسم الخطة أو الوصف...' : 'Search by template name or description...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111111] border border-[#1F1F1F] rounded-xl py-2 pl-9 pr-4 text-xs text-[#F5F5F5] placeholder-[#666666] focus:border-[#E8FF00]/40 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Main Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Template Cards List */}
        <div className={`space-y-4 ${selectedPlan ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          {loadingPlans ? (
            <div className="text-center py-12 text-sm text-[#666666] font-bold uppercase animate-pulse">
              {language === 'ar' ? 'جاري مزامنة كتالوج الخطط...' : 'Syncing template catalog...'}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#666666] font-bold uppercase">
              {language === 'ar' ? 'لا توجد قوالب خطط مخزنة.' : 'No templates match your search criteria.'}
            </div>
          ) : (
            filteredTemplates.map((p) => {
              const details = p.plan_data || {}
              return (
                <Card
                  key={p.id}
                  onClick={() => handleSelectPlan(p)}
                  className={`p-4 cursor-pointer hover:border-zinc-700 transition-all text-left ${
                    selectedPlan?.id === p.id
                      ? activeTab === 'workout'
                        ? 'border-[#E8FF00] bg-[#141414] shadow-[0_0_12px_rgba(232,255,0,0.02)]'
                        : 'border-[#4DA6FF] bg-[#141414] shadow-[0_0_12px_rgba(77,166,255,0.02)]'
                      : 'bg-[#111111] border-[#1F1F1F]'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bebas text-lg text-[#F5F5F5] tracking-wide block truncate">
                          {p.title}
                        </span>
                        <Badge variant="beginner" className="text-[9px] uppercase font-bold py-0 px-1.5 capitalize">
                          {details.level || 'Custom'}
                        </Badge>
                      </div>

                      {p.description && (
                        <p className="text-xs text-[#666666] leading-relaxed line-clamp-1">
                          {p.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#555555] font-bold uppercase pt-1 border-t border-[#1F1F1F]/40">
                        {activeTab === 'workout' ? (
                          <>
                            <span className="text-[#E8FF00]">{details.duration || 'Ongoing'}</span>
                            <span>•</span>
                            <span>{details.daysPerWeek || 3} Days/Week</span>
                            <span>•</span>
                            <span>{details.exercises?.length || 0} Exercises</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[#4DA6FF]">{details.calories || 2200} kcal</span>
                            <span>•</span>
                            <span>P: {details.macros?.protein || 0}g</span>
                            <span>•</span>
                            <span>C: {details.macros?.carbs || 0}g</span>
                            <span>•</span>
                            <span>F: {details.macros?.fat || 0}g</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: p.id, title: p.title }) }}
                        className="p-1 rounded hover:bg-[#1C1C1C] text-red-500 hover:text-red-400 transition-colors cursor-pointer outline-none"
                        title="Delete Template"
                      >
                        <Trash2 size={15} />
                      </button>
                      
                      <button className="p-1 rounded hover:bg-[#1C1C1C] text-[#666666] hover:text-[#E8FF00] transition-colors cursor-pointer outline-none">
                        <Eye size={15} />
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>

        {/* Right Column: Visual Preview and Manual Assignment Trigger */}
        {selectedPlan && (
          <div className="lg:col-span-6 space-y-6">
            <div className={`border rounded-xl bg-[#111111] p-6 space-y-6 shadow-2xl relative ${
              selectedPlan.type === 'workout' ? 'border-[#E8FF00]/25' : 'border-[#4DA6FF]/25'
            }`}>
              <button
                onClick={() => setSelectedPlan(null)}
                className="absolute top-4 right-4 text-xs font-bold text-[#666666] hover:text-[#F5F5F5] uppercase tracking-wider outline-none cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="space-y-2 border-b border-[#1F1F1F] pb-4 text-left">
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  selectedPlan.type === 'workout' ? 'text-[#E8FF00]' : 'text-[#4DA6FF]'
                }`}>
                  {selectedPlan.type === 'workout' ? 'STANDALONE WORKOUT PLAN TEMPLATE' : 'STANDALONE DIET PLAN TEMPLATE'}
                </span>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bebas text-2xl text-[#F5F5F5] tracking-wide uppercase">{selectedPlan.title}</h3>
                    {selectedPlan.description && <p className="text-xs text-[#666666] font-medium">{selectedPlan.description}</p>}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={openEditTemplate} variant="outline" className="font-bebas text-xs py-2 px-4 uppercase tracking-wide flex items-center gap-1.5">
                      <Edit3 size={12} /> {language === 'ar' ? 'تعديل القالب' : 'Edit Template'}
                    </Button>
                    <Button
                      onClick={() => { setShowAssignModal(true); setAssignSearch('') }}
                      className="font-bebas text-xs py-2 px-4 uppercase tracking-wide bg-[#E8FF00] hover:bg-[#E8FF00]/90 text-black flex items-center gap-1.5 shrink-0 shadow-lg shadow-[#E8FF00]/10"
                    >
                      <Send size={12} />
                      {language === 'ar' ? 'تعيين لمشترك' : 'Assign to Subscriber'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Graphical Preview Card */}
              <div className="space-y-4 text-left">
                <h4 className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                  {language === 'ar' ? 'العرض المرئي التفاعلي' : 'DYNAMIC VISUAL CARD PREVIEW'}
                </h4>
                
                {selectedPlan.type === 'workout' ? (
                  /* Workouts List Preview */
                  parsedPreview && parsedPreview.exercises?.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {parsedPreview.exercises.map((ex, exIdx) => (
                        <div
                          key={ex.id || exIdx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F]"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#E8FF00]" />
                            <span className="text-xs text-[#EAEAEA] font-semibold truncate max-w-[180px]">
                              {ex.name}
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-[#666666] bg-[#161616] px-2 py-0.5 rounded border border-[#1F1F1F] uppercase">
                            {language === 'ar' ? 'اليوم' : 'Day'} {ex.day || 1} · {ex.sets} × {ex.reps}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs italic text-[#555555]">
                      {language === 'ar' ? 'تعذر تحليل تفاصيل التمارين.' : 'Could not parse specific exercise metrics.'}
                    </div>
                  )
                ) : (
                  /* Meals Target List Preview */
                  parsedPreview && parsedPreview.meals?.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold uppercase mb-2">
                        <div className="bg-[#1C1C1C]/40 p-1.5 rounded border border-[#1F1F1F] text-[#F5F5F5]">
                          <span className="block text-[8px] text-[#666666]">CAL</span>
                          {parsedPreview.calories || 2200}
                        </div>
                        <div className="bg-[#FF3A2D]/10 p-1.5 rounded border border-[#FF3A2D]/10 text-[#FF3A2D]">
                          <span className="block text-[8px] text-[#666666]">PRO</span>
                          {parsedPreview.macros?.protein || 0}g
                        </div>
                        <div className="bg-[#4DA6FF]/10 p-1.5 rounded border border-[#4DA6FF]/10 text-[#4DA6FF]">
                          <span className="block text-[8px] text-[#666666]">CARB</span>
                          {parsedPreview.macros?.carbs || 0}g
                        </div>
                        <div className="bg-[#34D399]/10 p-1.5 rounded border border-[#34D399]/10 text-[#34D399]">
                          <span className="block text-[8px] text-[#666666]">FAT</span>
                          {parsedPreview.macros?.fat || 0}g
                        </div>
                      </div>

                      {parsedPreview.meals.map((meal, mIdx) => (
                        <div
                          key={meal.id || mIdx}
                          className="p-3 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F] space-y-1.5"
                        >
                          <div className="flex justify-between items-center text-xs font-bold text-[#4DA6FF] uppercase">
                            <span>{meal.name}</span>
                            <span className="text-[9px] text-[#666666]">{meal.time}</span>
                          </div>
                          {meal.foods && meal.foods.length > 0 && (
                            <div className="space-y-1 pl-2 border-l border-[#1F1F1F]">
                              {meal.foods.map((food, fIdx) => (
                                <div key={fIdx} className="flex flex-wrap justify-between gap-x-2 text-[10px] text-[#CCCCCC]">
                                  <span>• {food.name}</span>
                                  <span className="font-semibold text-[#888888]">
                                    {food.qty}{food.calories != null ? ` · ${food.calories} kcal` : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs italic text-[#555555]">
                      {language === 'ar' ? 'تعذر تحليل وجبات الجدول.' : 'Could not parse specific meals target list.'}
                    </div>
                  )
                )}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ====================================================
          MODAL: CREATE NEW STANDALONE TEMPLATE
          ==================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 font-dmsans text-left">
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-2xl w-full max-w-3xl p-6 relative overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-[#666666] hover:text-[#FFFFFF]"
            >
              <X size={18} />
            </button>

            <h3 className="font-bebas text-2xl text-[#F5F5F5] tracking-wide uppercase mb-1">
              {templateBeingEdited
                ? (language === 'ar' ? 'تعديل القالب' : 'EDIT TEMPLATE')
                : (language === 'ar' ? 'إنشاء قالب برنامج جديد' : 'CREATE NEW SAVED TEMPLATE')}
            </h3>
            <p className="text-[11px] text-[#666666] font-bold uppercase tracking-wider mb-4">
              {language === 'ar' ? 'أضف قالب تمرين أو نظام غذائي مستقل بالكامل' : 'Create an independent blueprint catalog template'}
            </p>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-[10px] text-[#666666] font-bold uppercase mb-1.5">{language === 'ar' ? 'نوع الخطة' : 'Plan Type'}</label>
                <div className="flex border border-[#1F1F1F] bg-[#0A0A0A] p-1 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setNewType('workout')}
                    disabled={Boolean(templateBeingEdited)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bebas text-xs tracking-wide uppercase transition-all cursor-pointer ${
                      newType === 'workout' ? 'bg-[#1C1C1C] text-[#E8FF00]' : 'text-[#666666]'
                    }`}
                  >
                    <Dumbbell size={12} />
                    <span>Workout</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('nutrition')}
                    disabled={Boolean(templateBeingEdited)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bebas text-xs tracking-wide uppercase transition-all cursor-pointer ${
                      newType === 'nutrition' ? 'bg-[#1C1C1C] text-[#4DA6FF]' : 'text-[#666666]'
                    }`}
                  >
                    <Apple size={12} />
                    <span>Nutrition</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#666666] font-bold uppercase mb-1.5">{language === 'ar' ? 'عنوان القالب' : 'Template Title'}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Upper / Lower Mechanical Tension"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl py-2 px-3 text-xs text-[#F5F5F5] placeholder-[#555555] focus:border-[#E8FF00]/40 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#666666] font-bold uppercase mb-1.5">{language === 'ar' ? 'وصف قصير' : 'Short Description'}</label>
                <input
                  type="text"
                  placeholder="e.g. Advanced split focusing on hypertrophy triggers"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl py-2 px-3 text-xs text-[#F5F5F5] placeholder-[#555555] focus:border-[#E8FF00]/40 outline-none"
                />
              </div>

              {/* Structured Plan Builder */}
              {newType === 'workout' ? (
                <div className="space-y-3">
                  {/* Training days selector */}
                  <div className="flex items-center gap-3">
                    <label className="text-[10px] text-[#E8FF00] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Dumbbell size={12} /> Training Days
                    </label>
                    <select value={trainingDays} onChange={(e) => handleTrainingDaysChange(e.target.value)} className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg py-1 px-3 text-xs text-[#E8FF00] font-bold outline-none cursor-pointer">
                      {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Day' : 'Days'}</option>)}
                    </select>
                  </div>

                  {/* Day tabs */}
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {newDays.map((day, di) => (
                      <button key={di} type="button" onClick={() => setActiveDay(di)}
                        className={`px-3 py-1.5 rounded-lg font-bebas text-xs tracking-wide uppercase transition-all cursor-pointer outline-none shrink-0 ${
                          activeDay === di ? 'bg-[#E8FF00] text-black' : 'bg-[#0A0A0A] border border-[#1F1F1F] text-[#666] hover:text-[#E8FF00]'
                        }`}>
                        {day.label}
                      </button>
                    ))}
                  </div>

                  {/* Active day label editor + exercises */}
                  <div className="flex items-center justify-between">
                    <input type="text" value={newDays[activeDay]?.label || ''} onChange={(e) => updateDayLabel(activeDay, e.target.value)}
                      className="bg-transparent font-bebas text-sm text-[#E8FF00] border-b border-transparent focus:border-[#E8FF00]/40 outline-none uppercase tracking-wide w-32" />
                    <button type="button" onClick={addExercise} className="flex items-center gap-1 text-[9px] font-bold text-[#E8FF00] hover:text-[#F5F5F5] uppercase tracking-wider cursor-pointer outline-none transition-colors">
                      <Plus size={12} /> Add Exercise
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {(newDays[activeDay]?.exercises || []).map((ex, idx) => (
                      <div key={idx} className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-3 space-y-2 relative group">
                        {(newDays[activeDay]?.exercises || []).length > 1 && (
                          <button type="button" onClick={() => removeExercise(idx)} className="absolute top-2 right-2 text-[#444] hover:text-[#FF3A2D] transition-colors cursor-pointer outline-none opacity-0 group-hover:opacity-100">
                            <X size={14} />
                          </button>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-bebas text-sm text-[#E8FF00] w-6 shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                          <input type="text" value={ex.name} onChange={(e) => updateExercise(idx, 'name', e.target.value)} placeholder="Exercise name" className="flex-1 bg-transparent border-b border-[#1F1F1F] focus:border-[#E8FF00]/40 text-xs text-[#F5F5F5] py-1 outline-none placeholder-[#444]" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <span className="text-[8px] text-[#555] font-bold uppercase block mb-0.5">Sets</span>
                            <select value={ex.sets} onChange={(e) => updateExercise(idx, 'sets', e.target.value)} className="w-full bg-[#111] border border-[#1F1F1F] rounded-lg py-1 px-2 text-[10px] text-[#F5F5F5] outline-none cursor-pointer">
                              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                          <div>
                            <span className="text-[8px] text-[#555] font-bold uppercase block mb-0.5">Reps</span>
                            <select value={ex.reps} onChange={(e) => updateExercise(idx, 'reps', e.target.value)} className="w-full bg-[#111] border border-[#1F1F1F] rounded-lg py-1 px-2 text-[10px] text-[#F5F5F5] outline-none cursor-pointer">
                              {['3:5','6:8','8:10','8:12','10:12','12:15','15:20','20'].map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                          <div>
                            <span className="text-[8px] text-[#555] font-bold uppercase block mb-0.5">RIR</span>
                            <select value={ex.rir} onChange={(e) => updateExercise(idx, 'rir', e.target.value)} className="w-full bg-[#111] border border-[#1F1F1F] rounded-lg py-1 px-2 text-[10px] text-[#F5F5F5] outline-none cursor-pointer">
                              {['0','1','2','3','\u2014'].map(r => <option key={r} value={r}>{r === '0' ? '0 (Failure)' : r === '\u2014' ? 'N/A' : r}</option>)}
                            </select>
                          </div>
                          <div>
                            <span className="text-[8px] text-[#555] font-bold uppercase block mb-0.5">Rest</span>
                            <select value={ex.rest || '90s'} onChange={(e) => updateExercise(idx, 'rest', e.target.value)} className="w-full bg-[#111] border border-[#1F1F1F] rounded-lg py-1 px-2 text-[10px] text-[#F5F5F5] outline-none cursor-pointer">
                              {['30s','45s','60s','90s','120s','150s','180s'].map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <YtIcon size={10} className="text-[#FF0000] shrink-0" />
                          <input
                            type="url"
                            value={ex.youtubeUrl || ''}
                            onChange={(e) => updateExercise(idx, 'youtubeUrl', e.target.value)}
                            placeholder="YouTube demo link (optional)"
                            className="flex-1 bg-transparent border-b border-[#1F1F1F] focus:border-[#FF0000]/30 text-[10px] text-[#888] py-0.5 outline-none placeholder-[#444]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Macro targets */}
                  <div>
                    <label className="text-[10px] text-[#4DA6FF] font-bold uppercase tracking-wider flex items-center gap-1 mb-2">
                      <Apple size={12} /> Daily Macro Targets
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <span className="text-[8px] text-[#555] font-bold uppercase block mb-0.5">Calories</span>
                        <input type="number" value={newCalories} onChange={(e) => setNewCalories(Number(e.target.value))} className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg py-1 px-2 text-[10px] text-[#F5F5F5] outline-none" />
                      </div>
                      <div>
                        <span className="text-[8px] text-[#FF3A2D] font-bold uppercase block mb-0.5">Protein (g)</span>
                        <input type="number" value={newProtein} onChange={(e) => setNewProtein(Number(e.target.value))} className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg py-1 px-2 text-[10px] text-[#F5F5F5] outline-none" />
                      </div>
                      <div>
                        <span className="text-[8px] text-[#4DA6FF] font-bold uppercase block mb-0.5">Carbs (g)</span>
                        <input type="number" value={newCarbs} onChange={(e) => setNewCarbs(Number(e.target.value))} className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg py-1 px-2 text-[10px] text-[#F5F5F5] outline-none" />
                      </div>
                      <div>
                        <span className="text-[8px] text-[#34D399] font-bold uppercase block mb-0.5">Fat (g)</span>
                        <input type="number" value={newFat} onChange={(e) => setNewFat(Number(e.target.value))} className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg py-1 px-2 text-[10px] text-[#F5F5F5] outline-none" />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#A78BFA]/20 bg-[#A78BFA]/5 p-3">
                    <Button
                      type="button"
                      onClick={handleCalculateNutrition}
                      disabled={calculatingNutrition || !newMeals.some(meal => meal.foods.some(food => food.name.trim()))}
                      className="font-bebas uppercase tracking-wider text-xs py-2 px-4 flex items-center gap-1.5 bg-[#A78BFA] hover:bg-[#B79CFF] text-black"
                    >
                      {calculatingNutrition ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                      {calculatingNutrition
                        ? (language === 'ar' ? 'جاري الحساب...' : 'Calculating...')
                        : (language === 'ar' ? 'احسب السعرات بالذكاء الاصطناعي' : 'Calculate Calories with AI')}
                    </Button>
                    <span className="text-[10px] text-[#888888] font-medium">
                      {nutritionCalculated
                        ? (language === 'ar' ? 'تم ملء السعرات والعناصر الغذائية، ويمكنك تعديلها.' : 'Calories and macros filled in. You can adjust them.')
                        : (language === 'ar' ? 'أضف الطعام والكميات أولاً، ثم احسب.' : 'Add foods and quantities, then calculate.')}
                    </span>
                  </div>
                  {/* Meal cards */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#4DA6FF] font-bold uppercase tracking-wider">Meals</span>
                    <button type="button" onClick={addMeal} className="flex items-center gap-1 text-[9px] font-bold text-[#4DA6FF] hover:text-[#F5F5F5] uppercase tracking-wider cursor-pointer outline-none transition-colors">
                      <Plus size={12} /> Add Meal
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {newMeals.map((meal, mIdx) => (
                      <div key={mIdx} className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-3 space-y-2 relative group">
                        {newMeals.length > 1 && (
                          <button type="button" onClick={() => removeMeal(mIdx)} className="absolute top-2 right-2 text-[#444] hover:text-[#FF3A2D] transition-colors cursor-pointer outline-none opacity-0 group-hover:opacity-100">
                            <X size={14} />
                          </button>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={meal.name} onChange={(e) => updateMeal(mIdx, 'name', e.target.value)} placeholder="Meal name" className="bg-transparent border-b border-[#1F1F1F] focus:border-[#4DA6FF]/40 text-xs text-[#F5F5F5] py-1 outline-none placeholder-[#444]" />
                          <input type="text" value={meal.time} onChange={(e) => updateMeal(mIdx, 'time', e.target.value)} placeholder="Time (e.g. 7:00 AM)" className="bg-transparent border-b border-[#1F1F1F] focus:border-[#4DA6FF]/40 text-xs text-[#F5F5F5] py-1 outline-none placeholder-[#444]" />
                        </div>
                        <div className="space-y-1 pl-2 border-l border-[#1F1F1F]">
                          {meal.foods.map((food, fIdx) => (
                            <div key={fIdx} className="flex flex-wrap items-center gap-2">
                              <input type="text" value={food.name} onChange={(e) => updateFood(mIdx, fIdx, 'name', e.target.value)} placeholder="Food item" className="flex-1 min-w-28 bg-transparent border-b border-[#1A1A1A] text-[10px] text-[#CCC] py-0.5 outline-none placeholder-[#444]" />
                              <input type="text" value={food.qty} onChange={(e) => updateFood(mIdx, fIdx, 'qty', e.target.value)} placeholder="Qty" className="w-16 bg-transparent border-b border-[#1A1A1A] text-[10px] text-[#888] py-0.5 outline-none placeholder-[#444]" />
                              {nutritionCalculated && food.name.trim() && (
                                <span className="text-[9px] text-[#A78BFA] font-bold w-full sm:w-auto">
                                  {food.calories || 0} kcal · P {food.protein || 0} · C {food.carbs || 0} · F {food.fat || 0}
                                </span>
                              )}
                              {meal.foods.length > 1 && (
                                <button type="button" onClick={() => removeFood(mIdx, fIdx)} className="text-[#444] hover:text-[#FF3A2D] cursor-pointer outline-none"><X size={10} /></button>
                              )}
                            </div>
                          ))}
                          <button type="button" onClick={() => addFood(mIdx)} className="text-[8px] text-[#4DA6FF] font-bold uppercase hover:text-[#F5F5F5] cursor-pointer outline-none mt-1">+ Add Food</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={creatingPlan || calculatingNutrition}
                  className="w-full font-bebas uppercase tracking-wider py-3"
                >
                  {creatingPlan
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving Template...')
                    : templateBeingEdited
                      ? (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes')
                      : (language === 'ar' ? 'إنشاء الخطة وتخزينها' : 'Create Template')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL: MANUAL ASSIGNMENT TO SUBSCRIBER
          ==================================================== */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 font-dmsans text-left animate-fade-in">
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-2xl w-full max-w-md p-6 relative overflow-hidden">
            <button
              onClick={() => { setShowAssignModal(false); setAssigningTo(null) }}
              className="absolute top-4 right-4 text-[#666666] hover:text-[#FFFFFF]"
            >
              <X size={18} />
            </button>

            <h3 className="font-bebas text-2xl text-[#F5F5F5] tracking-wide uppercase mb-1">
              {language === 'ar' ? 'تعيين الخطة يدوياً لمشترك' : 'MANUALLY ASSIGN PLAN'}
            </h3>
            
            <div className="bg-[#1C1C1C]/40 border border-[#1F1F1F] rounded-xl p-3 my-3">
              <span className="text-[9px] text-[#666666] font-bold uppercase tracking-wider block">Selected Template</span>
              <span className="font-bebas text-base text-[#E8FF00] uppercase tracking-wide block mt-0.5">{selectedPlan.title}</span>
              <span className="text-[10px] text-[#888888] capitalize">Type: {selectedPlan.type}</span>
            </div>

            {/* Subscriber Select Search */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" size={14} />
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'ابحث باسم أو إيميل المشترك...' : 'Search subscriber name or email...'}
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl py-2 pl-9 pr-4 text-xs text-[#F5F5F5] placeholder-[#555555] focus:border-[#E8FF00]/40 outline-none"
                />
              </div>

              {/* Sub list */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {loadingSubs ? (
                  <div className="text-center py-4 text-xs text-[#666666] animate-pulse uppercase">Syncing client list...</div>
                ) : filteredSubscribers.length === 0 ? (
                  <div className="text-center py-4 text-xs text-[#555555] uppercase font-bold">No active subscribers found</div>
                ) : (
                  filteredSubscribers.map((sub) => {
                    const isSelected = assigningTo?.id === sub.id
                    return (
                      <div
                        key={sub.id}
                        onClick={() => setAssigningTo(sub)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-[#E8FF00] bg-[#E8FF00]/5'
                            : 'border-[#1F1F1F] bg-[#0A0A0A] hover:border-zinc-700'
                        }`}
                      >
                        <div>
                          <span className="font-bebas text-sm text-[#F5F5F5] tracking-wide block">
                            {sub.full_name || 'Fitness Client'}
                          </span>
                          <span className="text-[9px] text-[#666666] block">{sub.email}</span>
                        </div>
                        
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-[#E8FF00] flex items-center justify-center text-black">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-zinc-800" />
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Confirm Assignment Buttons */}
              <div className="pt-2 flex gap-3">
                <Button
                  onClick={() => { setShowAssignModal(false); setAssigningTo(null) }}
                  variant="outline"
                  className="flex-1 font-bebas uppercase text-xs py-2.5"
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={handleAssignToSubscriber}
                  disabled={!assigningTo || submittingAssignment}
                  className="flex-1 font-bebas uppercase text-xs py-2.5 bg-[#E8FF00] text-black hover:bg-[#E8FF00]/90"
                >
                  {submittingAssignment ? 'Assigning...' : 'Confirm Assign'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ─────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />

          {/* Dialog */}
          <div className="relative z-10 w-full max-w-sm bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6 shadow-2xl space-y-5">
            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#FF3A2D]/10 border border-[#FF3A2D]/25 mx-auto">
              <AlertTriangle size={26} className="text-[#FF3A2D]" />
            </div>

            {/* Text */}
            <div className="text-center space-y-1.5">
              <h3 className="font-bebas text-2xl tracking-wide text-[#F5F5F5] uppercase">
                {language === 'ar' ? 'حذف القالب' : 'Delete Template'}
              </h3>
              <p className="text-sm text-[#888] leading-relaxed">
                {language === 'ar' ? (
                  <>
                    هل أنت متأكد من حذف قالب الخطة{' '}
                    <span className="text-[#F5F5F5] font-semibold">{deleteConfirm.title}</span> بشكل نهائي؟
                  </>
                ) : (
                  <>
                    Are you sure you want to permanently delete the template{' '}
                    <span className="text-[#F5F5F5] font-semibold">{deleteConfirm.title}</span>?
                  </>
                )}
                <br />
                <span className="text-xs text-[#FF3A2D]/80">
                  {language === 'ar' ? 'لا يمكن التراجع عن هذا الإجراء.' : 'This action cannot be undone.'}
                </span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#2a2a2a] text-sm font-bold text-[#888] hover:text-[#F5F5F5] hover:border-[#444] transition-all cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDeleteTemplate}
                className="flex-1 py-2.5 rounded-xl bg-[#FF3A2D] hover:bg-[#e02d21] text-white text-sm font-bold transition-all cursor-pointer shadow-[0_0_16px_rgba(255,58,45,0.25)]"
              >
                {language === 'ar' ? 'نعم، احذف' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default ManagePlans;
