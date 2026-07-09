import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { toast } from '../../store/toastStore'
import { parseWorkoutPlan, parseNutritionPlan } from '../../utils/planParser'
import { Eye, Edit3, Trash2, Search, Plus, Save, Dumbbell, Apple, AlertTriangle, RefreshCw, FileText, ChevronDown, ChevronUp, ArrowLeftRight, X, GripVertical } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'


const activityLabels = {
  desk: 'Desk / Low Activity',
  physical: 'Physical / High Activity',
  shifts: 'Shifts / Variable Schedule',
}

const trainingDurationLabels = {
  '<3m': 'Less than 3 Months',
  '3-6m': '3 - 6 Months',
  '6-12m': '6 Months - 1 Year',
  '>1y': 'More than 1 Year',
}

const workoutDaysLabels = {
  '1-2': '1 - 2 Days/Week',
  '3-5': '3 - 5 Days/Week',
  '5-7': '5 - 7 Days/Week',
}

const sleepHoursLabels = {
  '<5': 'Less than 5 Hours',
  '5-7': '5 - 7 Hours',
  '>7': 'More than 7 Hours',
}

const stressLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

const stepsLabels = {
  '<5000': 'Less than 5,000 steps',
  '5000-10000': '5,000 - 10,000 steps',
  '>10000': 'More than 10,000 steps',
}

const eatOutLabels = {
  yes: 'Yes',
  no: 'No',
  sometimes: 'Sometimes',
}

const waterLabels = {
  '1-2': '1 - 2 Liters',
  '2-4': '2 - 4 Liters',
  '>4': 'More than 4 Liters',
}

const primaryGoalLabels = {
  shredding: 'Fat Loss (Shredding)',
  bulking: 'Muscle Gain (Bulking)',
  recomp: 'Body Recomposition',
  health: 'Health Improvement',
}

const timelineLabels = {
  '3m': '3 Months',
  '6m': '6 Months',
  '1y': '1 Year',
  indefinite: 'Indefinite / No target date',
}

const budgetLabels = {
  '1000-2000': '1,000 - 2,000 EGP',
  '2000-3000': '2,000 - 3,000 EGP',
  '3000-4000': '3,000 - 4,000 EGP',
  '4000+': '4,000+ EGP',
}

const prepHomeLabels = {
  home: 'Prepare at home',
  ready: 'Rely on ready/takeout meals',
  both: 'Both',
}

const failureReasonsLabels = {
  hunger: 'Hunger',
  boredom: 'Boredom',
  time: 'Time constraints',
  cost: 'Cost',
}

// Plan helper parsers for the GUI editor
const generateUniqueId = () => `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const loadWorkoutPlanForEditing = (workoutPlanRaw) => {
  const parsed = parseWorkoutPlan(workoutPlanRaw)
  if (!parsed) {
    return {
      title: 'Custom Workout Plan',
      trainingDays: 3,
      days: [
        { label: 'Day 1', exercises: [{ id: generateUniqueId(), name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s' }] },
        { label: 'Day 2', exercises: [{ id: generateUniqueId(), name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s' }] },
        { label: 'Day 3', exercises: [{ id: generateUniqueId(), name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s' }] },
      ]
    }
  }

  // If there's already a structured 'days' array, use it
  if (parsed.days && Array.isArray(parsed.days) && parsed.days.length > 0) {
    return {
      title: parsed.title || 'Custom Workout Plan',
      trainingDays: parsed.days.length,
      days: parsed.days.map((d, dIdx) => ({
        label: d.label || 'Day',
        exercises: d.exercises?.map((ex, exIdx) => ({
          id: ex.id || `ex-${Date.now()}-${dIdx}-${exIdx}-${Math.random().toString(36).substr(2, 5)}`,
          name: ex.name || '',
          sets: ex.sets || 3,
          reps: ex.reps || '8:10',
          rir: ex.rir ? String(ex.rir).replace(/\D/g, '') : '1', // extract digits safely
          rest: ex.rest || '90s'
        })) || []
      }))
    }
  }

  // Otherwise, group exercises from parsed.exercises
  const exercises = parsed.exercises || []
  const maxDay = Math.max(1, ...exercises.map(ex => Number(ex.day || 1)))
  const days = Array.from({ length: maxDay }, (_, i) => {
    const dayNum = i + 1
    const dayExercises = exercises
      .filter(ex => Number(ex.day || 1) === dayNum)
      .map((ex, exIdx) => ({
        id: ex.id || `ex-${Date.now()}-${dayNum}-${exIdx}-${Math.random().toString(36).substr(2, 5)}`,
        name: ex.name || '',
        sets: ex.sets || 3,
        reps: ex.reps || '8:10',
        rir: ex.rir ? String(ex.rir).replace(/\D/g, '') : '1',
        rest: ex.rest || '90s'
      }))

    return {
      label: `Day ${dayNum}`,
      exercises: dayExercises.length > 0 ? dayExercises : [{ id: generateUniqueId(), name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s' }]
    }
  })

  return {
    title: parsed.title || 'Custom Workout Plan',
    trainingDays: days.length,
    days
  }
}

const loadNutritionPlanForEditing = (nutritionPlanRaw) => {
  const parsed = parseNutritionPlan(nutritionPlanRaw)
  if (!parsed) {
    return {
      calories: 2200,
      macros: { protein: 160, carbs: 220, fat: 65 },
      meals: [{ name: 'Breakfast', time: '7:00 AM', foods: [{ name: '', qty: '' }] }]
    }
  }

  const meals = parsed.meals?.map(m => ({
    name: m.name || '',
    time: m.time || 'Anytime',
    foods: m.foods?.map(f => ({
      name: f.name || '',
      qty: f.qty || ''
    })) || [{ name: '', qty: '' }]
  })) || [{ name: 'Breakfast', time: '7:00 AM', foods: [{ name: '', qty: '' }] }]

  return {
    calories: parsed.calories || 2200,
    macros: {
      protein: parsed.macros?.protein || 160,
      carbs: parsed.macros?.carbs || 220,
      fat: parsed.macros?.fat || 65
    },
    meals
  }
}

function SortableExerciseRow({ ex, index, onUpdate, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: ex.id })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
    position: 'relative'
  } : {
    position: 'relative'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-3.5 space-y-2.5 relative group"
    >
      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-3 right-3 text-[#444] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer z-10"
      >
        <Trash2 size={14} />
      </button>

      <div className="flex gap-2 items-center">
        {/* Grip Handler */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-[#555] hover:text-[#E8FF00] p-1 rounded hover:bg-[#161616] flex items-center justify-center transition-colors touch-none"
        >
          <GripVertical size={14} />
        </div>
        <span className="font-bebas text-sm text-[#E8FF00] w-5 select-none">#{index + 1}</span>
        <input
          type="text"
          value={ex.name}
          onChange={(e) => onUpdate(index, 'name', e.target.value)}
          placeholder="Exercise Name (e.g., Bench Press)"
          className="flex-1 bg-transparent border-b border-[#1F1F1F] focus:border-[#E8FF00]/40 text-xs text-[#F5F5F5] outline-none py-0.5"
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="space-y-1">
          <span className="block text-[8px] text-[#555] uppercase font-bold">Sets</span>
          <select
            value={ex.sets}
            onChange={(e) => onUpdate(index, 'sets', Number(e.target.value))}
            className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg px-2 py-1 text-xs text-[#F5F5F5] outline-none"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <span className="block text-[8px] text-[#555] uppercase font-bold">Reps</span>
          <input
            type="text"
            value={ex.reps}
            onChange={(e) => onUpdate(index, 'reps', e.target.value)}
            placeholder="8:10 or 12"
            className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg px-2 py-1 text-xs text-[#F5F5F5] outline-none"
          />
        </div>
        <div className="space-y-1">
          <span className="block text-[8px] text-[#555] uppercase font-bold">RIR</span>
          <select
            value={ex.rir}
            onChange={(e) => onUpdate(index, 'rir', e.target.value)}
            className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg px-2 py-1 text-xs text-[#F5F5F5] outline-none"
          >
            {['0', '1', '2', '3', '—'].map(v => <option key={v} value={v}>{v === '—' ? '—' : `${v} RIR`}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <span className="block text-[8px] text-[#555] uppercase font-bold">Rest</span>
          <select
            value={ex.rest}
            onChange={(e) => onUpdate(index, 'rest', e.target.value)}
            className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg px-2 py-1 text-xs text-[#F5F5F5] outline-none"
          >
            {['30s', '45s', '60s', '90s', '120s', '150s', '180s'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

export function ManageClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  // Plan editing states
  const [workoutPlanText, setWorkoutPlanText] = useState('')
  const [nutritionPlanText, setNutritionPlanText] = useState('')
  const [savingPlans, setSavingPlans] = useState(false)

  // Premium GUI Plan Editor Modal states
  const [showEditPlanModal, setShowEditPlanModal] = useState(false)
  const [editPlanTab, setEditPlanTab] = useState('workout') // 'workout' | 'nutrition'
  const [editWorkoutTitle, setEditWorkoutTitle] = useState('')
  const [editTrainingDays, setEditTrainingDays] = useState(3)
  const [editActiveDay, setEditActiveDay] = useState(0)
  const [editDays, setEditDays] = useState([
    { label: 'Day 1', exercises: [{ id: 'init-1', name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s' }] },
    { label: 'Day 2', exercises: [{ id: 'init-2', name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s' }] },
    { label: 'Day 3', exercises: [{ id: 'init-3', name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s' }] },
  ])
  const [editCalories, setEditCalories] = useState(2200)
  const [editProtein, setEditProtein] = useState(160)
  const [editCarbs, setEditCarbs] = useState(220)
  const [editFat, setEditFat] = useState(65)
  const [editMeals, setEditMeals] = useState([{ name: 'Breakfast', time: '7:00 AM', foods: [{ name: '', qty: '' }] }])
  const [swapSourceDayIdx, setSwapSourceDayIdx] = useState(null)

  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editLevel, setEditLevel] = useState('beginner')
  const [editStatus, setEditStatus] = useState('inactive')
  const [savingProfile, setSavingProfile] = useState(false)
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false)

  // Delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { id, name } | null

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'subscriber')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (err) {
      console.error('Error fetching clients:', err)
      toast.error('Failed to load client directory.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const handleSelectClient = (client) => {
    setSelectedClient(client)
    setIsEditingProfile(false)
    setIsQuestionnaireOpen(false)
    
    // Extract plans if they exist as JSONB strings/objects
    const workoutPlan = client.workout_plan
    const nutritionPlan = client.nutrition_plan

    setWorkoutPlanText(workoutPlan?.text || workoutPlan?.markdown || '')
    setNutritionPlanText(nutritionPlan?.text || nutritionPlan?.markdown || '')

    // Set profile edit values
    setEditName(client.full_name || '')
    setEditPhone(client.phone || '')
    setEditLevel(client.fitness_level || 'beginner')
    setEditStatus(client.subscription_status || 'inactive')
  }

  const handleQuickApprove = async (client) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'active' })
        .eq('id', client.id)

      if (error) throw error

      toast.success(`✅ Approved ${client.full_name}'s subscription!`)
      
      // Update local state
      setClients(prev => prev.map(c => 
        c.id === client.id 
          ? { ...c, subscription_status: 'active' }
          : c
      ))
      setSelectedClient(prev => ({ ...prev, subscription_status: 'active' }))
    } catch (err) {
      toast.error('Approval failed: ' + err.message)
    }
  }

  const handleQuickReject = async (client) => {
    const reason = window.prompt("Enter rejection reason (optional):", "Blurred Screenshot")
    if (reason === null) return // cancelled
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'rejected', rejection_reason: reason })
        .eq('id', client.id)

      if (error) throw error

      toast.success(`❌ Rejected subscription request.`)
      
      // Update local state
      setClients(prev => prev.map(c => 
        c.id === client.id 
          ? { ...c, subscription_status: 'rejected', rejection_reason: reason }
          : c
      ))
      setSelectedClient(prev => ({ ...prev, subscription_status: 'rejected', rejection_reason: reason }))
    } catch (err) {
      toast.error('Rejection failed: ' + err.message)
    }
  }

  // Premium GUI Plan Editor handlers
  const handleOpenEditPlanModal = () => {
    if (!selectedClient) return
    
    // Load workout plan
    const loadedWorkout = loadWorkoutPlanForEditing(selectedClient.workout_plan)
    setEditWorkoutTitle(loadedWorkout.title)
    setEditDays(loadedWorkout.days)
    setEditTrainingDays(loadedWorkout.days.length)
    setEditActiveDay(0)
    setSwapSourceDayIdx(null)

    // Load nutrition plan
    const loadedNutrition = loadNutritionPlanForEditing(selectedClient.nutrition_plan)
    setEditCalories(loadedNutrition.calories)
    setEditProtein(loadedNutrition.macros.protein)
    setEditCarbs(loadedNutrition.macros.carbs)
    setEditFat(loadedNutrition.macros.fat)
    setEditMeals(loadedNutrition.meals)

    setEditPlanTab('workout')
    setShowEditPlanModal(true)
  }

  const handleEditTrainingDaysChange = (count) => {
    const n = Number(count)
    setEditTrainingDays(n)
    setEditDays(prev => {
      if (n > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: n - prev.length }, (_, i) => ({
            label: `Day ${prev.length + i + 1}`,
            exercises: [{ id: generateUniqueId(), name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s' }]
          }))
        ]
      }
      return prev.slice(0, n)
    })
    if (editActiveDay >= n) setEditActiveDay(n - 1)
  }

  const addEditExercise = () => setEditDays(prev => prev.map((d, i) => i === editActiveDay ? { ...d, exercises: [...d.exercises, { id: generateUniqueId(), name: '', sets: 3, reps: '8:10', rir: '1', rest: '90s' }] } : d))
  const removeEditExercise = (idx) => setEditDays(prev => prev.map((d, i) => i === editActiveDay ? { ...d, exercises: d.exercises.filter((_, ei) => ei !== idx) } : d))
  const updateEditExercise = (idx, field, value) => setEditDays(prev => prev.map((d, i) => i === editActiveDay ? { ...d, exercises: d.exercises.map((ex, ei) => ei === idx ? { ...ex, [field]: value } : ex) } : d))
  const updateEditDayLabel = (dayIdx, label) => setEditDays(prev => prev.map((d, i) => i === dayIdx ? { ...d, label } : d))

  // DND-Kit configuration for exercise sorting
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 50,
        distance: 8,
      },
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setEditDays(prev => prev.map((day, idx) => {
      if (idx !== editActiveDay) return day
      const oldIndex = day.exercises.findIndex(ex => ex.id === active.id)
      const newIndex = day.exercises.findIndex(ex => ex.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return day
      return {
        ...day,
        exercises: arrayMove(day.exercises, oldIndex, newIndex)
      }
    }))
  }

  const handleDayTabClick = (idx) => {
    if (swapSourceDayIdx !== null) {
      if (swapSourceDayIdx === idx) {
        setSwapSourceDayIdx(null)
      } else {
        setEditDays(prev => {
          const updated = [...prev]
          const temp = updated[swapSourceDayIdx]
          updated[swapSourceDayIdx] = updated[idx]
          updated[idx] = temp
          return updated
        })
        toast.success(`Swapped ${editDays[swapSourceDayIdx]?.label || `Day ${swapSourceDayIdx + 1}`} with ${editDays[idx]?.label || `Day ${idx + 1}`}!`)
        setSwapSourceDayIdx(null)
        setEditActiveDay(idx)
      }
    } else {
      setEditActiveDay(idx)
    }
  }

  const addEditMeal = () => setEditMeals(prev => [...prev, { name: '', time: '', foods: [{ name: '', qty: '' }] }])
  const removeEditMeal = (idx) => setEditMeals(prev => prev.filter((_, i) => i !== idx))
  const updateEditMeal = (idx, field, value) => setEditMeals(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m))
  const addEditFood = (mealIdx) => setEditMeals(prev => prev.map((m, i) => i === mealIdx ? { ...m, foods: [...m.foods, { name: '', qty: '' }] } : m))
  const removeEditFood = (mealIdx, foodIdx) => setEditMeals(prev => prev.map((m, i) => i === mealIdx ? { ...m, foods: m.foods.filter((_, fi) => fi !== foodIdx) } : m))
  const updateEditFood = (mealIdx, foodIdx, field, value) => setEditMeals(prev => prev.map((m, i) => i === mealIdx ? { ...m, foods: m.foods.map((f, fi) => fi === foodIdx ? { ...f, [field]: value } : f) } : m))

  const handleSaveEditPlans = async () => {
    if (!selectedClient) return
    setSavingPlans(true)
    try {
      // 1. Build structured workout plan
      const daysData = editDays.map((day, di) => {
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

      const allExercises = daysData.flatMap((d, di) => 
        d.exercises.map(ex => ({ ...ex, day: di + 1 }))
      )

      const workoutText = daysData.map(d => `# ${d.label}:\n${d.exercises.map(ex => `${ex.name} ${ex.sets} ${ex.reps}`).join('\n')}`).join('\n\n')

      const workoutPlanPayload = {
        title: editWorkoutTitle || 'Custom Workout Plan',
        days: daysData,
        exercises: allExercises,
        level: selectedClient.workout_plan?.level || 'intermediate',
        duration: selectedClient.workout_plan?.duration || 'Ongoing',
        daysPerWeek: editDays.length,
        text: workoutText
      }

      // 2. Build structured nutrition plan
      const mealsData = editMeals.filter(m => m.name.trim()).map((m, i) => ({
        id: 'meal-' + (i + 1),
        name: m.name.trim(),
        time: m.time || 'Anytime',
        foods: m.foods.filter(f => f.name.trim()).map(f => ({ name: f.name.trim(), qty: f.qty || '1 portion' }))
      }))

      const nutritionText = `Calories: ${editCalories} kcal | Protein: ${editProtein}g | Carbs: ${editCarbs}g | Fat: ${editFat}g\n\n` +
        mealsData.map((m, i) => `MEAL ${i+1}: ${m.name} (${m.time})\n${m.foods.map(f => `• ${f.name} — ${f.qty}`).join('\n')}`).join('\n\n')

      const nutritionPlanPayload = {
        calories: editCalories,
        macros: { protein: editProtein, carbs: editCarbs, fat: editFat },
        meals: mealsData,
        text: nutritionText
      }

      // Update in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          workout_plan: workoutPlanPayload,
          nutrition_plan: nutritionPlanPayload
        })
        .eq('id', selectedClient.id)

      if (error) throw error

      toast.success(`Successfully saved customized plans for ${selectedClient.full_name}!`)

      // Update local state
      setClients(prev => prev.map(c => 
        c.id === selectedClient.id 
          ? { ...c, workout_plan: workoutPlanPayload, nutrition_plan: nutritionPlanPayload }
          : c
      ))

      setSelectedClient(prev => ({
        ...prev,
        workout_plan: workoutPlanPayload,
        nutrition_plan: nutritionPlanPayload
      }))

      setWorkoutPlanText(workoutText)
      setNutritionPlanText(nutritionText)
      setShowEditPlanModal(false)
    } catch (err) {
      console.error('Error saving edited plans:', err)
      toast.error('Failed to save workout/diet plans.')
    } finally {
      setSavingPlans(false)
    }
  }


  const handleSaveProfile = async () => {
    if (!selectedClient) return
    setSavingProfile(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editName,
          phone: editPhone,
          fitness_level: editLevel,
          subscription_status: editStatus
        })
        .eq('id', selectedClient.id)

      if (error) throw error

      toast.success('Client profile updated successfully!')
      
      // Update local state
      setClients(prev => prev.map(c => 
        c.id === selectedClient.id 
          ? { ...c, full_name: editName, phone: editPhone, fitness_level: editLevel, subscription_status: editStatus }
          : c
      ))

      setSelectedClient(prev => ({
        ...prev,
        full_name: editName,
        phone: editPhone,
        fitness_level: editLevel,
        subscription_status: editStatus
      }))
      
      setIsEditingProfile(false)
    } catch (err) {
      console.error('Error updating profile:', err)
      toast.error('Failed to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleDeleteClient = (id, name) => {
    // Show custom confirmation modal instead of window.confirm
    setDeleteConfirm({ id, name })
  }

  const confirmDeleteClient = async () => {
    if (!deleteConfirm) return
    const { id, name } = deleteConfirm
    setDeleteConfirm(null)

    try {
      // Get the current session token to authenticate the edge function call
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Call the edge function which uses the service role key to fully delete the auth user
      const res = await fetch(
        'https://aykiykjhuamibjyfypeo.supabase.co/functions/v1/delete-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId: id }),
        }
      )

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to delete user')

      toast.success(`Client ${name} has been removed.`)
      setClients(prev => prev.filter(c => c.id !== id))
      if (selectedClient?.id === id) {
        setSelectedClient(null)
      }
    } catch (err) {
      console.error('Error deleting client:', err)
      toast.error(err.message || 'Failed to remove client.')
    }
  }

  const filteredClients = clients.filter(c => {
    const matchesSearch = (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || '').includes(searchTerm)

    if (!matchesSearch) return false

    if (statusFilter === 'pending') return c.subscription_status === 'pending'
    if (statusFilter === 'active') return c.subscription_status === 'active'
    if (statusFilter === 'rejected') return c.subscription_status === 'rejected'
    return true
  })

  return (
    <div className="space-y-6 font-dmsans select-none relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bebas text-4xl md:text-5xl text-[#F5F5F5] uppercase tracking-wide">
            CLIENT DIRECTORY
          </h1>
          <p className="text-sm text-[#666666] font-semibold uppercase tracking-wider">
            Monitor real active subscribers, design custom workout plans & configure client diets.
          </p>
        </div>
        <button
          onClick={fetchClients}
          className="p-2.5 rounded-lg border border-[#1F1F1F] bg-[#111111] text-[#666666] hover:text-[#E8FF00] hover:border-[#E8FF00]/30 transition-colors cursor-pointer outline-none align-middle"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Search and Filter Row */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" size={18} />
          <input
            type="text"
            placeholder="Search real clients by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111111] border border-[#1F1F1F] rounded-xl py-3 pl-11 pr-4 text-sm text-[#F5F5F5] placeholder-[#666666] focus:border-[#E8FF00]/40 outline-none transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer outline-none ${
              statusFilter === 'all' ? 'bg-[#E8FF00] text-[#0A0A0A]' : 'bg-[#111111] border border-[#1F1F1F] text-[#666666] hover:text-[#F5F5F5]'
            }`}
          >
            All ({clients.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer outline-none flex items-center gap-1.5 ${
              statusFilter === 'pending' ? 'bg-[#FF8C00] text-black' : 'bg-[#111111] border border-[#1F1F1F] text-[#FF8C00]/80 hover:text-[#FF8C00]'
            }`}
          >
            Pending ({clients.filter(c => c.subscription_status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer outline-none flex items-center gap-1.5 ${
              statusFilter === 'active' ? 'bg-[#00E676] text-black' : 'bg-[#111111] border border-[#1F1F1F] text-[#00E676]/80 hover:text-[#00E676]'
            }`}
          >
            Active ({clients.filter(c => c.subscription_status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer outline-none flex items-center gap-1.5 ${
              statusFilter === 'rejected' ? 'bg-[#FF3A2D] text-[#F5F5F5]' : 'bg-[#111111] border border-[#1F1F1F] text-[#FF3A2D]/80 hover:text-[#FF3A2D]'
            }`}
          >
            Rejected ({clients.filter(c => c.subscription_status === 'rejected').length})
          </button>
        </div>
      </div>

      {/* Main Grid: List + Detail Drawer Side-by-Side if selected */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Client Rows list */}
        <div className={`space-y-3 ${selectedClient ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          {loading ? (
            <div className="text-center py-12 text-sm text-[#666666] font-bold uppercase animate-pulse">
              Syncing client directory with database...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12 text-sm text-[#666666] font-bold uppercase">
              No subscriber accounts found.
            </div>
          ) : (
            filteredClients.map((client) => (
              <Card 
                key={client.id}
                onClick={() => handleSelectClient(client)}
                className={`p-4 cursor-pointer hover:border-[#E8FF00]/30 transition-all ${
                  selectedClient?.id === client.id ? 'border-[#E8FF00] shadow-[0_0_10px_rgba(232,255,0,0.03)]' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide">{client.full_name || 'Fitness Member'}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#666666] font-bold uppercase">
                      <span>{client.phone || 'NO PHONE'}</span>
                      <span>•</span>
                      <span>{client.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-none border-[#1F1F1F] pt-2.5 sm:pt-0">
                    <Badge variant={client.fitness_level}>{client.fitness_level}</Badge>
                    <Badge variant={client.subscription_status}>{client.subscription_status}</Badge>
                    
                    {client.subscription_status === 'pending' && (
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleQuickApprove(client)}
                          className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-[#E8FF00] text-black hover:bg-[#d4eb00] transition-colors cursor-pointer outline-none"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleQuickReject(client)}
                          className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-[#FF3A2D] text-[#FF3A2D] hover:bg-[#FF3A2D]/10 transition-colors cursor-pointer outline-none"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    <button className="p-1 rounded hover:bg-[#1C1C1C] text-[#666666] hover:text-[#E8FF00] transition-colors cursor-pointer outline-none">
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Right Side: Detail Panel & Plan Editors */}
        {selectedClient && (
          <div className="lg:col-span-6 space-y-6">
            {/* 1. Client Card Record */}
            <div className="bg-[#111111] border border-[#E8FF00]/20 rounded-xl p-6 space-y-6 shadow-2xl relative">
              <button 
                onClick={() => setSelectedClient(null)}
                className="absolute top-4 right-4 text-xs font-bold text-[#666666] hover:text-[#F5F5F5] uppercase tracking-wider outline-none cursor-pointer"
              >
                Close [X]
              </button>

              <div className="space-y-1 border-b border-[#1F1F1F] pb-4">
                <span className="text-[10px] text-[#E8FF00] font-bold uppercase tracking-wider block">CLIENT RECORD</span>
                <h2 className="font-bebas text-3xl text-[#F5F5F5] tracking-wide uppercase">{selectedClient.full_name || 'Fitness Member'}</h2>
                <span className="text-xs text-[#666666] font-semibold">{selectedClient.email}</span>
              </div>

              {selectedClient.subscription_status === 'pending' && (
                <div className="bg-[#FF8C00]/10 border border-[#FF8C00]/25 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[#FF8C00] font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle size={16} />
                    <span>Pending Subscription Review</span>
                  </div>
                  <p className="text-[11px] text-[#A0A0A0] font-medium leading-relaxed">
                    This client has submitted a payment confirmation and is waiting to be approved or rejected.
                  </p>
                  
                  {selectedClient.payment_screenshot_url && (
                    <div className="border border-[#1F1F1F] rounded-lg overflow-hidden bg-black/40 p-2.5 flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold text-[#666666] uppercase">Payment Slip:</span>
                      <a 
                        href={selectedClient.payment_screenshot_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[10px] font-bold text-[#E8FF00] hover:underline uppercase flex items-center gap-1 cursor-pointer outline-none"
                      >
                        View Screenshot <Eye size={12} />
                      </a>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button 
                      onClick={() => handleQuickApprove(selectedClient)}
                      variant="primary"
                      className="flex-1 font-bebas uppercase tracking-wider text-xs py-2 bg-[#E8FF00] text-black hover:bg-[#d4eb00]"
                    >
                      Approve Client
                    </Button>
                    <Button 
                      onClick={() => handleQuickReject(selectedClient)}
                      variant="outline"
                      className="flex-1 font-bebas uppercase tracking-wider text-xs py-2 text-[#FF3A2D] hover:bg-[#FF3A2D]/10 hover:border-[#FF3A2D]/20"
                    >
                      Reject Request
                    </Button>
                  </div>
                </div>
              )}

              {!isEditingProfile ? (
                <>
                  <div className="grid grid-cols-2 gap-4 text-xs font-bold text-[#666666]">
                    <div>
                      <span className="block uppercase text-[10px]">Experience Level</span>
                      <span className="text-[#F5F5F5] mt-1 block capitalize">{selectedClient.fitness_level}</span>
                    </div>
                    <div>
                      <span className="block uppercase text-[10px]">Subscription Plan</span>
                      <span className="text-[#F5F5F5] mt-1 block">
                        {selectedClient.plan_duration ? `${selectedClient.plan_duration} Months` : 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="block uppercase text-[10px]">Enroll Date</span>
                      <span className="text-[#F5F5F5] mt-1 block">
                        {selectedClient.updated_at ? new Date(selectedClient.updated_at).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="block uppercase text-[10px]">Phone Number</span>
                      <span className="text-[#F5F5F5] mt-1 block">{selectedClient.phone || '—'}</span>
                    </div>
                  </div>

                  <div className="border-t border-[#1F1F1F] pt-4 flex gap-3">
                    <Button 
                      onClick={() => setIsEditingProfile(true)}
                      variant="primary" 
                      className="flex-1 font-bebas uppercase tracking-wider text-xs py-2"
                    >
                      <Edit3 size={14} className="mr-1.5" /> Edit Profile
                    </Button>
                    <Button 
                      onClick={() => handleDeleteClient(selectedClient.id, selectedClient.full_name)}
                      variant="outline" 
                      className="font-bebas uppercase tracking-wider text-xs py-2 text-[#FF3A2D] hover:bg-[#FF3A2D]/10 hover:border-[#FF3A2D]/20"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#666666] uppercase">Full Name</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#666666] uppercase">Phone</label>
                    <input 
                      type="text" 
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#666666] uppercase">Fitness Level</label>
                      <select 
                        value={editLevel}
                        onChange={(e) => setEditLevel(e.target.value)}
                        className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none cursor-pointer"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#666666] uppercase">Subscription Status</label>
                      <select 
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none cursor-pointer"
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      onClick={handleSaveProfile} 
                      disabled={savingProfile}
                      className="flex-1 font-bebas text-xs uppercase py-2"
                    >
                      {savingProfile ? 'Saving...' : 'Save Profile'}
                    </Button>
                    <Button 
                      onClick={() => setIsEditingProfile(false)} 
                      variant="outline"
                      className="font-bebas text-xs uppercase py-2"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 1.5. Intake Questionnaire Card */}
            {selectedClient.questionnaire && (
              <Card className="p-0 overflow-hidden border border-[#E8FF00]/10">
                <button
                  onClick={() => setIsQuestionnaireOpen(!isQuestionnaireOpen)}
                  className="w-full flex items-center justify-between p-4 bg-[#111111] hover:bg-[#161616] transition-colors outline-none cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[#E8FF00] uppercase tracking-wider">
                    <FileText size={16} />
                    <span>Intake Questionnaire / استمارة المتابعة</span>
                  </div>
                  {isQuestionnaireOpen ? <ChevronUp size={16} className="text-[#666666]" /> : <ChevronDown size={16} className="text-[#666666]" />}
                </button>

                {isQuestionnaireOpen && (
                  <div className="p-5 border-t border-[#1F1F1F] bg-[#111111] space-y-6 max-h-[500px] overflow-y-auto text-xs text-[#999999] leading-relaxed">
                    
                    {/* General & Health */}
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold text-[#E8FF00] uppercase tracking-wider border-b border-[#1F1F1F] pb-1">
                        1. General & Health Info
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Age</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">{selectedClient.questionnaire.age} yrs</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Height</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">{selectedClient.questionnaire.height} cm</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Weight</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">{selectedClient.questionnaire.weight} kg</span>
                        </div>
                        <div className="col-span-2 sm:col-span-3">
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Daily Activity</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">
                            {activityLabels[selectedClient.questionnaire.activity] || selectedClient.questionnaire.activity || '—'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-[#161616]">
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Chronic Diseases</span>
                          <span className={`font-semibold mt-0.5 block ${selectedClient.questionnaire.health?.has_chronic ? 'text-[#FF3A2D]' : 'text-[#F5F5F5]'}`}>
                            {selectedClient.questionnaire.health?.has_chronic 
                              ? `Yes: ${selectedClient.questionnaire.health.chronic_details}` 
                              : 'No'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Food Allergies</span>
                          <span className={`font-semibold mt-0.5 block ${selectedClient.questionnaire.health?.has_allergies ? 'text-[#FF3A2D]' : 'text-[#F5F5F5]'}`}>
                            {selectedClient.questionnaire.health?.has_allergies 
                              ? `Yes: ${selectedClient.questionnaire.health.allergies_details}` 
                              : 'No'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Digestive Issues</span>
                          <span className={`font-semibold mt-0.5 block ${selectedClient.questionnaire.health?.has_digestion ? 'text-[#FF8C00]' : 'text-[#F5F5F5]'}`}>
                            {selectedClient.questionnaire.health?.has_digestion 
                              ? `Yes: ${selectedClient.questionnaire.health.digestion_details}` 
                              : 'No'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Regular Medications</span>
                          <span className={`font-semibold mt-0.5 block ${selectedClient.questionnaire.health?.has_meds ? 'text-[#FF3A2D]' : 'text-[#F5F5F5]'}`}>
                            {selectedClient.questionnaire.health?.has_meds 
                              ? `Yes: ${selectedClient.questionnaire.health.meds_details}` 
                              : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fitness & Lifestyle */}
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold text-[#E8FF00] uppercase tracking-wider border-b border-[#1F1F1F] pb-1">
                        2. Fitness & Lifestyle
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Training Experience</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">
                            {trainingDurationLabels[selectedClient.questionnaire.fitness_history?.training_duration] || selectedClient.questionnaire.fitness_history?.training_duration || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Workouts per Week</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">
                            {workoutDaysLabels[selectedClient.questionnaire.fitness_history?.workout_days] || selectedClient.questionnaire.fitness_history?.workout_days || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Sleep Duration</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">
                            {sleepHoursLabels[selectedClient.questionnaire.lifestyle?.sleep_hours] || selectedClient.questionnaire.lifestyle?.sleep_hours || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Sleep Schedule</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">
                            {selectedClient.questionnaire.lifestyle?.sleep_schedule || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Stress Level</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">
                            {stressLabels[selectedClient.questionnaire.lifestyle?.stress_level] || selectedClient.questionnaire.lifestyle?.stress_level || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Daily Steps</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">
                            {stepsLabels[selectedClient.questionnaire.lifestyle?.daily_steps] || selectedClient.questionnaire.lifestyle?.daily_steps || '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Nutrition & Supplements */}
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold text-[#E8FF00] uppercase tracking-wider border-b border-[#1F1F1F] pb-1">
                        3. Eating Habits & Supplements
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Meals per Day</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">
                            {selectedClient.questionnaire.eating_habits?.meals_per_day || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Unskippable Meals</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">
                            {selectedClient.questionnaire.eating_habits?.unskippable_meals || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Eating Out Frequency</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">
                            {eatOutLabels[selectedClient.questionnaire.eating_habits?.eat_out] || selectedClient.questionnaire.eating_habits?.eat_out || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Daily Water Intake</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">
                            {waterLabels[selectedClient.questionnaire.eating_habits?.water_intake] || selectedClient.questionnaire.eating_habits?.water_intake || '—'}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Favorite Foods</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">
                            {selectedClient.questionnaire.eating_habits?.favorite_foods || '—'}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Disliked Foods</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">
                            {selectedClient.questionnaire.eating_habits?.disliked_foods || '—'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-[#161616]">
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Uses Supplements</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">
                            {selectedClient.questionnaire.supplements?.use_supplements 
                              ? `Yes: ${selectedClient.questionnaire.supplements.supplements_details}` 
                              : 'No'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Supplement Side Effects</span>
                          <span className={`font-semibold mt-0.5 block ${selectedClient.questionnaire.supplements?.has_side_effects ? 'text-[#FF8C00]' : 'text-[#F5F5F5]'}`}>
                            {selectedClient.questionnaire.supplements?.has_side_effects 
                              ? `Yes: ${selectedClient.questionnaire.supplements.side_effects_details}` 
                              : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Goals & Budget */}
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold text-[#E8FF00] uppercase tracking-wider border-b border-[#1F1F1F] pb-1">
                        4. Goals & Budget
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Primary Goal</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">
                            {primaryGoalLabels[selectedClient.questionnaire.goals?.primary_goal] || selectedClient.questionnaire.goals?.primary_goal || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Target Timeline</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">
                            {timelineLabels[selectedClient.questionnaire.goals?.timeline] || selectedClient.questionnaire.goals?.timeline || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Monthly Food Budget</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">
                            {budgetLabels[selectedClient.questionnaire.capabilities?.monthly_budget] || selectedClient.questionnaire.capabilities?.monthly_budget || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Meal Prep Preference</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">
                            {prepHomeLabels[selectedClient.questionnaire.capabilities?.prepare_meals] || selectedClient.questionnaire.capabilities?.prepare_meals || '—'}
                          </span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-[#161616]">
                          <span className="block text-[10px] text-[#555] uppercase font-bold">Did Diet Before?</span>
                          <span className="text-[#F5F5F5] font-semibold mt-0.5 block">
                            {selectedClient.questionnaire.diet_history?.did_diet_before 
                              ? `Yes` 
                              : 'No'}
                          </span>
                          {selectedClient.questionnaire.diet_history?.did_diet_before && (
                            <div className="mt-2 space-y-1.5 pl-3 border-l border-[#1F1F1F]">
                              <div>
                                <span className="block text-[9px] text-[#555] uppercase font-bold">Most Successful Diet</span>
                                <span className="text-[#F5F5F5]">{selectedClient.questionnaire.diet_history.successful_diet || '—'}</span>
                              </div>
                              <div>
                                <span className="block text-[9px] text-[#555] uppercase font-bold">Failure Reasons</span>
                                <span className="text-[#F5F5F5]">
                                  {selectedClient.questionnaire.diet_history.failure_reasons?.map(r => failureReasonsLabels[r] || r).join(', ') || '—'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </Card>
            )}

            {/* 2. Custom Workout & Diet Plans Injector */}
            <Card className="space-y-4 bg-[#111] border border-[#1F1F1F] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8FF00]/1 rounded-full blur-3xl pointer-events-none" />
              <div className="flex justify-between items-center border-b border-[#1F1F1F] pb-2">
                <div>
                  <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide uppercase">Customized Plans</h3>
                  <span className="text-[9px] text-[#666666] font-semibold uppercase tracking-wider block">
                    These plans override standard templates in their client portal
                  </span>
                </div>
                <Button 
                  onClick={handleOpenEditPlanModal} 
                  className="font-bebas uppercase tracking-wider text-xs py-1.5 px-4 bg-[#E8FF00] hover:bg-[#E8FF00]/90 text-black flex items-center gap-1"
                >
                  <Edit3 size={14} /> Edit Plans
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Workout Plan Summary */}
                <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-3.5 space-y-3 relative group">
                  <div className="flex items-center gap-2 border-b border-[#1F1F1F] pb-2">
                    <div className="w-7 h-7 rounded-lg bg-[#E8FF00]/10 flex items-center justify-center text-[#E8FF00]">
                      <Dumbbell size={14} />
                    </div>
                    <div>
                      <h4 className="font-bebas text-sm text-[#F5F5F5] tracking-wide uppercase">
                        {selectedClient.workout_plan?.title || 'Workout Plan'}
                      </h4>
                      <span className="text-[8px] text-[#666] font-bold uppercase tracking-wider block">
                        {selectedClient.workout_plan?.daysPerWeek || selectedClient.workout_plan?.days?.length || 0} training days
                      </span>
                    </div>
                  </div>
                  {/* Workout preview list */}
                  {selectedClient.workout_plan ? (() => {
                    const wp = parseWorkoutPlan(selectedClient.workout_plan)
                    if (!wp || !wp.exercises?.length) return (
                      <span className="text-[10px] text-[#444] font-medium block py-4 text-center">No active workout plan assigned.</span>
                    )
                    return (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {wp.exercises.slice(0, 4).map((ex, i) => (
                          <div key={i} className="flex items-center justify-between px-2.5 py-1.5 rounded bg-[#111] border border-[#1C1C1C]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ex.dotColor || 'bg-[#E8FF00]'}`} />
                              <span className="text-[10px] text-[#EAEAEA] font-semibold truncate max-w-[130px]">{ex.name}</span>
                            </div>
                            <span className="text-[8px] font-bold text-[#555] uppercase shrink-0">D{ex.day || 1} • {ex.sets}×{ex.reps}</span>
                          </div>
                        ))}
                        {wp.exercises.length > 4 && (
                          <span className="text-[8px] text-[#666] font-bold block pt-1">+{wp.exercises.length - 4} more exercises...</span>
                        )}
                      </div>
                    )
                  })() : (
                    <span className="text-[10px] text-[#444] font-medium block py-4 text-center">No active workout plan assigned.</span>
                  )}
                </div>

                {/* Nutrition Plan Summary */}
                <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-3.5 space-y-3 relative group">
                  <div className="flex items-center gap-2 border-b border-[#1F1F1F] pb-2">
                    <div className="w-7 h-7 rounded-lg bg-[#4DA6FF]/10 flex items-center justify-center text-[#4DA6FF]">
                      <Apple size={14} />
                    </div>
                    <div>
                      <h4 className="font-bebas text-sm text-[#F5F5F5] tracking-wide uppercase">Daily Nutrition</h4>
                      <span className="text-[8px] text-[#666] font-bold uppercase tracking-wider block">
                        {selectedClient.nutrition_plan?.meals?.length || 0} scheduled meals
                      </span>
                    </div>
                  </div>
                  {/* Nutrition details */}
                  {selectedClient.nutrition_plan ? (() => {
                    const np = parseNutritionPlan(selectedClient.nutrition_plan)
                    if (!np) return (
                      <span className="text-[10px] text-[#444] font-medium block py-4 text-center">No active nutrition plan assigned.</span>
                    )
                    return (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-4 gap-1 text-center font-bold text-[8px] uppercase">
                          <div className="bg-[#1C1C1C]/40 py-1.5 rounded border border-[#1F1F1F] text-[#F5F5F5]">
                            <span className="block text-[7px] text-[#555]">KCAL</span>
                            {np.calories || 2200}
                          </div>
                          <div className="bg-[#FF3A2D]/10 py-1.5 rounded border border-[#FF3A2D]/10 text-[#FF3A2D]">
                            <span className="block text-[7px] text-[#555]">PRO</span>
                            {np.macros?.protein || 0}g
                          </div>
                          <div className="bg-[#4DA6FF]/10 py-1.5 rounded border border-[#4DA6FF]/10 text-[#4DA6FF]">
                            <span className="block text-[7px] text-[#555]">CARB</span>
                            {np.macros?.carbs || 0}g
                          </div>
                          <div className="bg-[#34D399]/10 py-1.5 rounded border border-[#34D399]/10 text-[#34D399]">
                            <span className="block text-[7px] text-[#555]">FAT</span>
                            {np.macros?.fat || 0}g
                          </div>
                        </div>
                        <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
                          {np.meals?.slice(0, 2).map((meal, i) => (
                            <div key={i} className="px-2 py-1 rounded bg-[#111] border border-[#1C1C1C] flex justify-between items-center">
                              <span className="text-[9px] text-[#4DA6FF] font-bold uppercase truncate max-w-[120px]">{meal.name}</span>
                              <span className="text-[8px] text-[#666] font-semibold">{meal.time}</span>
                            </div>
                          ))}
                          {np.meals?.length > 2 && (
                            <span className="text-[8px] text-[#666] font-bold block pt-0.5">+{np.meals.length - 2} more meals...</span>
                          )}
                        </div>
                      </div>
                    )
                  })() : (
                    <span className="text-[10px] text-[#444] font-medium block py-4 text-center">No active nutrition plan assigned.</span>
                  )}
                </div>
              </div>
            </Card>

            {/* Visual Plan Editor Modal */}
            <Modal
              isOpen={showEditPlanModal}
              onClose={() => setShowEditPlanModal(false)}
              title={`Customize Plans for ${selectedClient?.full_name || 'Client'}`}
              size="xl"
            >
              <div className="flex flex-col h-[75vh]">
                {/* Modal Tab Switchers */}
                <div className="flex border-b border-[#1F1F1F] mb-4 shrink-0">
                  <button
                    onClick={() => setEditPlanTab('workout')}
                    className={`flex-1 py-3 text-center font-bebas text-lg tracking-wider transition-all border-b-2 uppercase ${
                      editPlanTab === 'workout'
                        ? 'border-[#E8FF00] text-[#E8FF00] bg-[#E8FF00]/5'
                        : 'border-transparent text-[#666] hover:text-[#F5F5F5]'
                    }`}
                  >
                    Workout Plan Builder
                  </button>
                  <button
                    onClick={() => setEditPlanTab('nutrition')}
                    className={`flex-1 py-3 text-center font-bebas text-lg tracking-wider transition-all border-b-2 uppercase ${
                      editPlanTab === 'nutrition'
                        ? 'border-[#4DA6FF] text-[#4DA6FF] bg-[#4DA6FF]/5'
                        : 'border-transparent text-[#666] hover:text-[#F5F5F5]'
                    }`}
                  >
                    Diet & Nutrition Builder
                  </button>
                </div>

                {/* Modal Editor Body */}
                <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1">
                  {editPlanTab === 'workout' ? (
                    <div className="space-y-4">
                      {/* Plan Title & Frequency */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0A0A0A] p-4 border border-[#1F1F1F] rounded-xl">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-[#555] uppercase font-bold tracking-wider">Plan Title</label>
                          <input
                            type="text"
                            value={editWorkoutTitle}
                            onChange={(e) => setEditWorkoutTitle(e.target.value)}
                            placeholder="Custom Workout Plan"
                            className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg px-3 py-2 text-xs text-[#F5F5F5] outline-none focus:border-[#E8FF00]/40"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-[#555] uppercase font-bold tracking-wider">Training Frequency</label>
                          <select
                            value={editTrainingDays}
                            onChange={(e) => handleEditTrainingDaysChange(e.target.value)}
                            className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg px-3 py-2 text-xs text-[#F5F5F5] outline-none focus:border-[#E8FF00]/40"
                          >
                            {[1, 2, 3, 4, 5, 6, 7].map(n => (
                              <option key={n} value={n}>{n} {n === 1 ? 'Day' : 'Days'} per Week</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Day Tab Selectors with Day Swapping Option */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#555] uppercase font-bold tracking-wider">Workout Days</span>
                          {swapSourceDayIdx !== null && (
                            <span className="text-[10px] text-[#FF8C00] font-bold uppercase animate-pulse">
                              Click another day to swap with {editDays[swapSourceDayIdx]?.label || `Day ${swapSourceDayIdx + 1}`}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 items-center bg-[#0A0A0A] p-1.5 border border-[#1F1F1F] rounded-xl">
                          {editDays.map((day, di) => {
                            const isSource = swapSourceDayIdx === di;
                            const isActive = editActiveDay === di;
                            return (
                              <button
                                key={di}
                                type="button"
                                onClick={() => handleDayTabClick(di)}
                                className={`px-3 py-1.5 rounded-lg font-bebas text-xs tracking-wide uppercase transition-all shrink-0 relative ${
                                  isSource
                                    ? 'bg-[#FF8C00] text-black border border-transparent shadow-[0_0_12px_rgba(255,140,0,0.3)] animate-pulse'
                                    : swapSourceDayIdx !== null
                                    ? 'bg-[#161616] border border-[#FF8C00]/30 text-[#FF8C00] hover:bg-[#FF8C00]/10'
                                    : isActive
                                    ? 'bg-[#E8FF00] text-black border border-transparent'
                                    : 'bg-[#111] border border-[#1F1F1F] text-[#666] hover:text-[#E8FF00] hover:border-[#E8FF00]/40'
                                }`}
                              >
                                {day.label || `Day ${di + 1}`}
                                {swapSourceDayIdx !== null && !isSource && (
                                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8C00] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF8C00]"></span>
                                  </span>
                                )}
                              </button>
                            )
                          })}
                          
                          <button
                            type="button"
                            onClick={() => {
                              if (swapSourceDayIdx !== null) {
                                setSwapSourceDayIdx(null)
                              } else {
                                setSwapSourceDayIdx(editActiveDay)
                              }
                            }}
                            className={`ml-auto flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                              swapSourceDayIdx !== null
                                ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'
                                : 'bg-[#E8FF00]/10 border-[#E8FF00]/20 text-[#E8FF00] hover:bg-[#E8FF00]/20'
                            }`}
                          >
                            <ArrowLeftRight size={12} />
                            {swapSourceDayIdx !== null ? 'Cancel Swap' : 'Swap Days'}
                          </button>
                        </div>
                      </div>

                      {/* Day Editor Block */}
                      {editDays[editActiveDay] && (
                        <div className="space-y-4">
                          {/* Day label input */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#555] uppercase font-bold">Label:</span>
                            <input
                              type="text"
                              value={editDays[editActiveDay].label}
                              onChange={(e) => updateEditDayLabel(editActiveDay, e.target.value)}
                              placeholder="Day 1 (e.g. Upper Body)"
                              className="bg-transparent border-b border-[#1F1F1F] focus:border-[#E8FF00]/40 text-xs font-bold text-[#E8FF00] uppercase outline-none py-0.5 px-1 max-w-[200px]"
                            />
                          </div>

                          {/* Exercises list */}
                          <div className="space-y-2.5 max-h-[36vh] overflow-y-auto pr-1">
                            {editDays[editActiveDay].exercises.length === 0 ? (
                              <div className="text-center py-6 text-xs text-[#555] uppercase font-bold">No exercises added yet.</div>
                            ) : (
                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                              >
                                <SortableContext
                                  items={editDays[editActiveDay].exercises.map(ex => ex.id)}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {editDays[editActiveDay].exercises.map((ex, ei) => (
                                    <SortableExerciseRow
                                      key={ex.id}
                                      ex={ex}
                                      index={ei}
                                      onUpdate={updateEditExercise}
                                      onRemove={removeEditExercise}
                                    />
                                  ))}
                                </SortableContext>
                              </DndContext>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={addEditExercise}
                            className="w-full py-2 bg-[#161616] hover:bg-[#1A1A1A] text-xs text-[#E8FF00] font-bold uppercase tracking-wider rounded-xl border border-dashed border-[#1F1F1F] hover:border-[#E8FF00]/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Plus size={12} /> Add Exercise
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Calories & Macros Header */}
                      <div className="grid grid-cols-4 gap-2 bg-[#0A0A0A] p-4 border border-[#1F1F1F] rounded-xl text-center">
                        <div className="space-y-1">
                          <span className="block text-[8px] text-[#555] uppercase font-bold">CALORIES</span>
                          <input
                            type="number"
                            value={editCalories}
                            onChange={(e) => setEditCalories(Number(e.target.value))}
                            className="w-full text-center bg-[#161616] border border-[#1F1F1F] focus:border-[#4DA6FF]/40 rounded-lg px-2 py-1.5 text-xs text-[#F5F5F5] outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="block text-[8px] text-[#FF3A2D] uppercase font-bold">PROTEIN (G)</span>
                          <input
                            type="number"
                            value={editProtein}
                            onChange={(e) => setEditProtein(Number(e.target.value))}
                            className="w-full text-center bg-[#161616] border border-[#1F1F1F] focus:border-red-500/40 rounded-lg px-2 py-1.5 text-xs text-[#FF3A2D] outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="block text-[8px] text-[#4DA6FF] uppercase font-bold">CARBS (G)</span>
                          <input
                            type="number"
                            value={editCarbs}
                            onChange={(e) => setEditCarbs(Number(e.target.value))}
                            className="w-full text-center bg-[#161616] border border-[#1F1F1F] focus:border-[#4DA6FF]/40 rounded-lg px-2 py-1.5 text-xs text-[#4DA6FF] outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="block text-[8px] text-[#34D399] uppercase font-bold">FAT (G)</span>
                          <input
                            type="number"
                            value={editFat}
                            onChange={(e) => setEditFat(Number(e.target.value))}
                            className="w-full text-center bg-[#161616] border border-[#1F1F1F] focus:border-emerald-500/40 rounded-lg px-2 py-1.5 text-xs text-[#34D399] outline-none"
                          />
                        </div>
                      </div>

                      {/* Meals List */}
                      <div className="space-y-3.5 max-h-[46vh] overflow-y-auto pr-1">
                        {editMeals.map((meal, mi) => (
                          <div key={mi} className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-3.5 space-y-2.5 relative group">
                            {/* Delete Meal */}
                            <button
                              type="button"
                              onClick={() => removeEditMeal(mi)}
                              className="absolute top-3 right-3 text-[#444] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>

                            {/* Meal Header (Name & Time) */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <span className="block text-[8px] text-[#555] uppercase font-bold">Meal Name</span>
                                <input
                                  type="text"
                                  value={meal.name}
                                  onChange={(e) => updateEditMeal(mi, 'name', e.target.value)}
                                  placeholder="Meal 1: Breakfast"
                                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg px-2 py-1 text-xs text-[#F5F5F5] outline-none focus:border-[#4DA6FF]/40"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="block text-[8px] text-[#555] uppercase font-bold">Time</span>
                                <input
                                  type="text"
                                  value={meal.time}
                                  onChange={(e) => updateEditMeal(mi, 'time', e.target.value)}
                                  placeholder="7:00 AM"
                                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg px-2 py-1 text-xs text-[#F5F5F5] outline-none focus:border-[#4DA6FF]/40"
                                />
                              </div>
                            </div>

                            {/* Foods Sublist */}
                            <div className="space-y-2">
                              <span className="block text-[8px] text-[#555] uppercase font-bold">Foods & Quantities</span>
                              <div className="space-y-1.5 pl-2 border-l border-[#1F1F1F]">
                                {meal.foods.map((food, fi) => (
                                  <div key={fi} className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      value={food.name}
                                      onChange={(e) => updateEditFood(mi, fi, 'name', e.target.value)}
                                      placeholder="Food Item (e.g. Oatmeal)"
                                      className="flex-1 bg-transparent border-b border-[#1F1F1F] focus:border-[#4DA6FF]/40 text-xs text-[#F5F5F5] outline-none py-0.5"
                                    />
                                    <input
                                      type="text"
                                      value={food.qty}
                                      onChange={(e) => updateEditFood(mi, fi, 'qty', e.target.value)}
                                      placeholder="Quantity (e.g. 70g)"
                                      className="w-24 bg-transparent border-b border-[#1F1F1F] focus:border-[#4DA6FF]/40 text-xs text-[#888] outline-none py-0.5"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeEditFood(mi, fi)}
                                      className="text-[#444] hover:text-red-500 transition-colors"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => addEditFood(mi)}
                                  className="text-[9px] text-[#4DA6FF] hover:underline font-semibold flex items-center gap-0.5 pt-1 bg-transparent border-none cursor-pointer outline-none"
                                >
                                  <Plus size={10} /> Add food item
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={addEditMeal}
                          className="w-full py-2 bg-[#161616] hover:bg-[#1A1A1A] text-xs text-[#4DA6FF] font-bold uppercase tracking-wider rounded-xl border border-dashed border-[#1F1F1F] hover:border-[#4DA6FF]/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus size={12} /> Add Meal
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer Controls */}
                <div className="flex gap-3 border-t border-[#1F1F1F] pt-4 mt-auto shrink-0">
                  <Button
                    type="button"
                    onClick={() => setShowEditPlanModal(false)}
                    className="flex-1 font-bebas uppercase tracking-wider text-xs py-2 bg-transparent hover:bg-[#161616] text-[#666] hover:text-[#F5F5F5] border border-[#1F1F1F]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveEditPlans}
                    disabled={savingPlans}
                    className={`flex-1 font-bebas uppercase tracking-wider text-xs py-2 ${
                      editPlanTab === 'workout'
                        ? 'bg-[#E8FF00] hover:bg-[#E8FF00]/90 text-black shadow-[0_0_12px_rgba(232,255,0,0.15)]'
                        : 'bg-[#4DA6FF] hover:bg-[#4DA6FF]/90 text-black shadow-[0_0_12px_rgba(77,166,255,0.15)]'
                    }`}
                  >
                    {savingPlans ? 'Saving...' : 'Save Customized Plans'}
                  </Button>
                </div>
              </div>
            </Modal>
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
                  Remove Client
                </h3>
                <p className="text-sm text-[#888] leading-relaxed">
                  Are you sure you want to permanently remove{' '}
                  <span className="text-[#F5F5F5] font-semibold">{deleteConfirm.name}</span>?
                  <br />
                  <span className="text-xs text-[#FF3A2D]/80">This action cannot be undone.</span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#2a2a2a] text-sm font-bold text-[#888] hover:text-[#F5F5F5] hover:border-[#444] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteClient}
                  className="flex-1 py-2.5 rounded-xl bg-[#FF3A2D] hover:bg-[#e02d21] text-white text-sm font-bold transition-all cursor-pointer shadow-[0_0_16px_rgba(255,58,45,0.25)]"
                >
                  Yes, Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageClients
