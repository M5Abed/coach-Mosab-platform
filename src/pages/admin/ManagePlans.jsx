import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { toast } from '../../store/toastStore'
import { parseWorkoutPlan, parseNutritionPlan } from '../../utils/planParser'
import { useLanguageStore } from '../../store/languageStore'
import {
  Search,
  Dumbbell,
  Apple,
  Edit3,
  Eye,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  UserCheck,
  Check,
  X,
  Send,
  FileText
} from 'lucide-react'

export function ManagePlans() {
  const { language } = useLanguageStore()
  
  // Independent templates state
  const [plans, setPlans] = useState([])
  const [subscribers, setSubscribers] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [loadingSubs, setLoadingSubs] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('workout') // 'workout' | 'nutrition'
  
  // Selection and Editor states
  const [selectedPlan, setSelectedPlan] = useState(null) // plan template object
  const [editingTitle, setEditingTitle] = useState('')
  const [editingDescription, setEditingDescription] = useState('')
  const [editingText, setEditingText] = useState('')
  const [savingPlan, setSavingPlan] = useState(false)
  
  // Creator states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newType, setNewType] = useState('workout')
  const [creatingPlan, setCreatingPlan] = useState(false)
  // Structured workout — organized by training days
  const [trainingDays, setTrainingDays] = useState(3)
  const [activeDay, setActiveDay] = useState(0) // which day tab is active
  const [newDays, setNewDays] = useState([
    { label: 'Day 1', exercises: [{ name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s' }] },
    { label: 'Day 2', exercises: [{ name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s' }] },
    { label: 'Day 3', exercises: [{ name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s' }] },
  ])
  // Structured nutrition fields
  const [newCalories, setNewCalories] = useState(2200)
  const [newProtein, setNewProtein] = useState(160)
  const [newCarbs, setNewCarbs] = useState(220)
  const [newFat, setNewFat] = useState(65)
  const [newMeals, setNewMeals] = useState([{ name: 'Breakfast', time: '7:00 AM', foods: [{ name: '', qty: '' }] }])

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
  const addExercise = () => setNewDays(prev => prev.map((d, i) => i === activeDay ? { ...d, exercises: [...d.exercises, { name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s' }] } : d))
  const removeExercise = (idx) => setNewDays(prev => prev.map((d, i) => i === activeDay ? { ...d, exercises: d.exercises.filter((_, ei) => ei !== idx) } : d))
  const updateExercise = (idx, field, value) => setNewDays(prev => prev.map((d, i) => i === activeDay ? { ...d, exercises: d.exercises.map((ex, ei) => ei === idx ? { ...ex, [field]: value } : ex) } : d))
  const updateDayLabel = (dayIdx, label) => setNewDays(prev => prev.map((d, i) => i === dayIdx ? { ...d, label } : d))

  // Meal card helpers
  const addMeal = () => setNewMeals(prev => [...prev, { name: '', time: '', foods: [{ name: '', qty: '' }] }])
  const removeMeal = (idx) => setNewMeals(prev => prev.filter((_, i) => i !== idx))
  const updateMeal = (idx, field, value) => setNewMeals(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m))
  const addFood = (mealIdx) => setNewMeals(prev => prev.map((m, i) => i === mealIdx ? { ...m, foods: [...m.foods, { name: '', qty: '' }] } : m))
  const removeFood = (mealIdx, foodIdx) => setNewMeals(prev => prev.map((m, i) => i === mealIdx ? { ...m, foods: m.foods.filter((_, fi) => fi !== foodIdx) } : m))
  const updateFood = (mealIdx, foodIdx, field, value) => setNewMeals(prev => prev.map((m, i) => i === mealIdx ? { ...m, foods: m.foods.map((f, fi) => fi === foodIdx ? { ...f, [field]: value } : f) } : m))

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

  // Live parsed preview based on active typing/modifications
  const parsedPreview = useMemo(() => {
    if (!selectedPlan) return null
    if (selectedPlan.type === 'workout') {
      return parseWorkoutPlan({ text: editingText })
    } else {
      return parseNutritionPlan({ text: editingText })
    }
  }, [selectedPlan, editingText])

  // Handle plan template selection
  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan)
    setEditingTitle(plan.title || '')
    setEditingDescription(plan.description || '')
    setEditingText(plan.plan_data?.text || '')
  }

  // Create Template handler
  const handleCreateTemplate = async (e) => {
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
            rir: ex.rir && ex.rir !== '—' ? `${ex.rir} RIR` : undefined,
            difficulty: ex.rir === '0' ? 'Hard' : ex.rir === '1' ? 'Medium' : 'Easy',
            dotColor: ex.rir === '0' ? 'bg-[#FF3A2D]' : ex.rir === '1' ? 'bg-[#FF8C00]' : 'bg-[#34D399]',
            guide: `RIR: ${ex.rir}. Keep form stable.`,
            tip: 'Maintain control and focus on the target muscles.'
          }))
          return { label: day.label, exercises }
        })
        // Flat exercises list for backward compat with subscriber views
        const allExercises = days.flatMap(d => d.exercises)
        textRepresentation = days.map(d => `# ${d.label}:\n${d.exercises.map(ex => `${ex.name} ${ex.sets} ${ex.reps}`).join('\n')}`).join('\n\n')
        planData = { title: newTitle, days, exercises: allExercises, level: 'intermediate', duration: 'Ongoing', daysPerWeek: trainingDays, text: textRepresentation }
      } else {
        const meals = newMeals.filter(m => m.name.trim()).map((m, i) => ({
          id: 'meal-' + (i + 1),
          name: m.name.trim(),
          time: m.time || 'Anytime',
          foods: m.foods.filter(f => f.name.trim()).map(f => ({ name: f.name.trim(), qty: f.qty || '1 portion' }))
        }))
        textRepresentation = `Calories: ${newCalories} kcal | Protein: ${newProtein}g | Carbs: ${newCarbs}g | Fat: ${newFat}g\n\n` +
          meals.map((m, i) => `MEAL ${i+1}: ${m.name} (${m.time})\n${m.foods.map(f => `• ${f.name} — ${f.qty}`).join('\n')}`).join('\n\n')
        planData = { calories: newCalories, macros: { protein: newProtein, carbs: newCarbs, fat: newFat }, meals, text: textRepresentation }
      }

      const { data, error } = await supabase
        .from('plans')
        .insert({ title: newTitle, type: newType, description: newDescription, plan_data: planData })
        .select()

      if (error) throw error
      toast.success(language === 'ar' ? 'تم إنشاء خطة جديدة بنجاح!' : 'New plan template created successfully!')
      if (data && data[0]) {
        setPlans(prev => [data[0], ...prev])
        handleSelectPlan(data[0])
      }

      // Reset
      setNewTitle(''); setNewDescription('')
      setTrainingDays(3); setActiveDay(0)
      setNewDays([
        { label: 'Day 1', exercises: [{ name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s' }] },
        { label: 'Day 2', exercises: [{ name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s' }] },
        { label: 'Day 3', exercises: [{ name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s' }] },
      ])
      setNewMeals([{ name: 'Breakfast', time: '7:00 AM', foods: [{ name: '', qty: '' }] }])
      setNewCalories(2200); setNewProtein(160); setNewCarbs(220); setNewFat(65)
      setShowCreateModal(false)
    } catch (err) {
      console.error('Error creating template:', err)
      toast.error(language === 'ar' ? 'فشل حفظ الخطة في قاعدة البيانات.' : 'Failed to save new template.')
    } finally {
      setCreatingPlan(false)
    }
  }

  // Save changes made to selected template
  const handleUpdateTemplate = async () => {
    if (!selectedPlan) return
    setSavingPlan(true)
    try {
      const parsedData = selectedPlan.type === 'workout'
        ? parseWorkoutPlan({ text: editingText })
        : parseNutritionPlan({ text: editingText })

      const updatedPayload = {
        title: editingTitle,
        description: editingDescription,
        plan_data: { ...parsedData, text: editingText }
      }

      const { error } = await supabase
        .from('plans')
        .update(updatedPayload)
        .eq('id', selectedPlan.id)

      if (error) throw error

      toast.success(
        language === 'ar'
          ? 'تم تحديث قالب الخطة بنجاح!'
          : 'Plan template updated successfully!'
      )

      // Refresh list
      setPlans(prev => prev.map(p => {
        if (p.id === selectedPlan.id) {
          return {
            ...p,
            ...updatedPayload
          }
        }
        return p
      }))

      // Update selected reference
      setSelectedPlan(prev => ({
        ...prev,
        ...updatedPayload
      }))
    } catch (err) {
      console.error('Error updating template:', err)
      toast.error(language === 'ar' ? 'فشل حفظ التعديلات.' : 'Failed to save template modifications.')
    } finally {
      setSavingPlan(false)
    }
  }

  // Delete Template handler
  const handleDeleteTemplate = async (planId) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه الخطة بالكامل؟' : 'Are you sure you want to delete this template permanently?')) return
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
            onClick={() => setShowCreateModal(true)}
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
                        onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(p.id) }}
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

        {/* Right Column: Visual Preview, Text Editor & Manual Assignment Trigger */}
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
                    <input 
                      type="text" 
                      value={editingTitle} 
                      onChange={(e) => setEditingTitle(e.target.value)} 
                      className="bg-transparent border-b border-transparent focus:border-[#E8FF00]/40 font-bebas text-2xl text-[#F5F5F5] tracking-wide uppercase outline-none w-full"
                    />
                    <input 
                      type="text" 
                      value={editingDescription} 
                      onChange={(e) => setEditingDescription(e.target.value)} 
                      className="bg-transparent border-b border-transparent focus:border-zinc-700 text-xs text-[#666666] outline-none w-full font-medium"
                      placeholder="Template description..."
                    />
                  </div>

                  {/* Manual Assignment Trigger */}
                  <Button
                    onClick={() => { setShowAssignModal(true); setAssignSearch('') }}
                    className="font-bebas text-xs py-2 px-4 uppercase tracking-wide bg-[#E8FF00] hover:bg-[#E8FF00]/90 text-black flex items-center gap-1.5 shrink-0 shadow-lg shadow-[#E8FF00]/10"
                  >
                    <Send size={12} />
                    {language === 'ar' ? 'تعيين لمشترك' : 'Assign to Subscriber'}
                  </Button>
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
                            {ex.sets} Sets x {ex.reps} Reps
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
                                <div key={fIdx} className="flex justify-between text-[10px] text-[#CCCCCC]">
                                  <span>• {food.name}</span>
                                  <span className="font-semibold text-[#888888]">{food.qty}</span>
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

              {/* Template Source Editor */}
              <div className="space-y-3 pt-4 border-t border-[#1F1F1F] text-left">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1">
                    <Edit3 size={12} />
                    <span>{language === 'ar' ? 'محرر بيانات القالب' : 'TEMPLATE SOURCE EDITOR'}</span>
                  </h4>
                  <Button
                    onClick={handleUpdateTemplate}
                    disabled={savingPlan}
                    className="font-bebas text-xs py-1 px-4 uppercase tracking-wide"
                  >
                    <Save size={12} className="mr-1.5" />
                    {savingPlan ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
                  </Button>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#E8FF00]/5 border border-[#E8FF00]/10">
                  <FileText size={10} className="text-[#E8FF00] shrink-0" />
                  <span className="text-[9px] text-[#888888] font-semibold">
                    {language === 'ar' ? 'اكتب بيانات التمارين أدناه — سيتم تحويلها تلقائياً إلى بطاقات مرئية أعلاه' : 'Type exercise or meal data below — it auto-renders as visual cards above'}
                  </span>
                </div>

                <textarea
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className="w-full h-36 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3 text-xs text-[#F5F5F5] focus:border-[#E8FF00]/40 outline-none resize-y"
                  placeholder={
                    selectedPlan.type === 'workout'
                      ? "Flat dumbbell press 3 6:8 1\nLat pull down 3 8:10 1"
                      : "MEAL 1: Breakfast (7:00 AM)\n• Oats — 70g"
                  }
                />
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
              {language === 'ar' ? 'إنشاء قالب برنامج جديد' : 'CREATE NEW SAVED TEMPLATE'}
            </h3>
            <p className="text-[11px] text-[#666666] font-bold uppercase tracking-wider mb-4">
              {language === 'ar' ? 'أضف قالب تمرين أو نظام غذائي مستقل بالكامل' : 'Create an independent blueprint catalog template'}
            </p>

            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-[10px] text-[#666666] font-bold uppercase mb-1.5">{language === 'ar' ? 'نوع الخطة' : 'Plan Type'}</label>
                <div className="flex border border-[#1F1F1F] bg-[#0A0A0A] p-1 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setNewType('workout')}
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
                        <div className="grid grid-cols-4 gap-2">
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
                              {['0','1','2','3','—'].map(r => <option key={r} value={r}>{r === '0' ? '0 (Failure)' : r === '—' ? 'N/A' : r}</option>)}
                            </select>
                          </div>
                          <div>
                            <span className="text-[8px] text-[#555] font-bold uppercase block mb-0.5">Rest</span>
                            <select value={ex.rest || '90s'} onChange={(e) => updateExercise(idx, 'rest', e.target.value)} className="w-full bg-[#111] border border-[#1F1F1F] rounded-lg py-1 px-2 text-[10px] text-[#F5F5F5] outline-none cursor-pointer">
                              {['30s','45s','60s','90s','120s','150s','180s'].map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
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
                    <div className="grid grid-cols-4 gap-2">
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
                            <div key={fIdx} className="flex items-center gap-2">
                              <input type="text" value={food.name} onChange={(e) => updateFood(mIdx, fIdx, 'name', e.target.value)} placeholder="Food item" className="flex-1 bg-transparent border-b border-[#1A1A1A] text-[10px] text-[#CCC] py-0.5 outline-none placeholder-[#444]" />
                              <input type="text" value={food.qty} onChange={(e) => updateFood(mIdx, fIdx, 'qty', e.target.value)} placeholder="Qty" className="w-16 bg-transparent border-b border-[#1A1A1A] text-[10px] text-[#888] py-0.5 outline-none placeholder-[#444]" />
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
                  disabled={creatingPlan}
                  className="w-full font-bebas uppercase tracking-wider py-3"
                >
                  {creatingPlan ? (language === 'ar' ? 'جاري الحفظ...' : 'Creating Template...') : (language === 'ar' ? 'إنشاء الخطة وتخزينها' : 'Create Template')}
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

    </div>
  )
}

export default ManagePlans;
