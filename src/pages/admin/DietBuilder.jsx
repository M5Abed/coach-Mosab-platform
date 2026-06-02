import React, { useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { toast } from '../../store/toastStore'
import { Plus, Trash2, Save, Apple, ClipboardList, RefreshCw, PlusCircle } from 'lucide-react'

export function DietBuilder() {
  const [clientsList, setClientsList] = useState([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [loadingClients, setLoadingClients] = useState(true)

  const [calories, setCalories] = useState(2400)
  const [protein, setProtein] = useState(180)
  const [carbs, setCarbs] = useState(250)
  const [fat, setFat] = useState(70)

  const [meals, setMeals] = useState([
    {
      id: 1,
      name: 'Breakfast',
      time: '7:30 AM',
      foods: [
        { name: 'Whole Eggs (Boiled)', qty: '3 large' },
        { name: 'Oats (Raw)', qty: '60g' }
      ]
    },
    {
      id: 2,
      name: '2nd Meal',
      time: '12:00 PM',
      foods: [
        { name: 'Grilled Chicken Breast', qty: '150g' },
        { name: 'White Rice (Cooked)', qty: '130g' }
      ]
    }
  ])

  // New food items state
  const [activeMealId, setActiveMealId] = useState(1)
  const [foodName, setFoodName] = useState('')
  const [foodQty, setFoodQty] = useState('')

  // Time and Meal title states for creating a new meal
  const [newMealName, setNewMealName] = useState('')
  const [newMealTime, setNewMealTime] = useState('')

  useEffect(() => {
    async function fetchClients() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('role', 'subscriber')
        if (error) throw error
        if (data) {
          setClientsList(data)
          if (data.length > 0) {
            setSelectedClientId(data[0].id)
          }
        }
      } catch (err) {
        toast.error('Failed to load subscribers: ' + err.message)
      } finally {
        setLoadingClients(false)
      }
    }
    fetchClients()
  }, [])

  const handleAddMeal = (e) => {
    e.preventDefault()
    if (!newMealName || !newMealTime) {
      toast.error('Please enter meal name and time.')
      return
    }

    const nextId = meals.length > 0 ? Math.max(...meals.map(m => m.id)) + 1 : 1
    const newMealObj = {
      id: nextId,
      name: newMealName,
      time: newMealTime,
      foods: []
    }

    setMeals([...meals, newMealObj])
    setActiveMealId(nextId)
    setNewMealName('')
    setNewMealTime('')
    toast.success('New meal schedule added!')
  }

  const handleRemoveMeal = (mealId) => {
    setMeals(prev => prev.filter(m => m.id !== mealId))
    if (activeMealId === mealId && meals.length > 1) {
      setActiveMealId(meals.filter(m => m.id !== mealId)[0].id)
    }
    toast.success('Meal schedule removed.')
  }

  const handleAddFood = (e) => {
    e.preventDefault()
    if (!foodName || !foodQty) {
      toast.error('Please enter food name and quantity.')
      return
    }

    setMeals(prev => prev.map(m => {
      if (m.id === activeMealId) {
        return {
          ...m,
          foods: [...m.foods, { name: foodName, qty: foodQty }]
        }
      }
      return m
    }))

    setFoodName('')
    setFoodQty('')
    toast.success('Food added to meal!')
  }

  const handleDeleteFood = (mealId, foodIdx) => {
    setMeals(prev => prev.map(m => {
      if (m.id === mealId) {
        return {
          ...m,
          foods: m.foods.filter((_, idx) => idx !== foodIdx)
        }
      }
      return m
    }))
  }

  const handleSave = async () => {
    if (!selectedClientId) {
      toast.error('Please select a client to assign this plan.')
      return
    }

    // Format target metrics and meals beautifully
    let formattedText = `DAILY NUTRITION TARGETS:\n🔥 Calories: ${calories} kcal | 🥩 Protein: ${protein}g | 🌾 Carbs: ${carbs}g | 🥑 Fat: ${fat}g\n`
    
    meals.forEach((m, idx) => {
      formattedText += `\n🍴 MEAL ${idx + 1}: ${m.name.toUpperCase()} (${m.time})\n`
      if (m.foods.length === 0) {
        formattedText += `   • No food items added yet.\n`
      } else {
        m.foods.forEach(f => {
          formattedText += `   • ${f.name} — ${f.qty}\n`
        })
      }
    })

    try {
      const nutritionPlanData = {
        text: formattedText,
        calories: Number(calories),
        macros: { protein: Number(protein), carbs: Number(carbs), fat: Number(fat) },
        meals: meals
      }

      const { error } = await supabase
        .from('profiles')
        .update({ nutrition_plan: nutritionPlanData })
        .eq('id', selectedClientId)

      if (error) throw error

      const clientName = clientsList.find(c => c.id === selectedClientId)?.full_name || 'Client'
      toast.success(`Diet plan successfully built and assigned to ${clientName}!`)
    } catch (err) {
      toast.error('Failed to save diet plan: ' + err.message)
    }
  }

  return (
    <div className="space-y-6 font-dmsans select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <h1 className="font-bebas text-4xl md:text-5xl text-[#F5F5F5] uppercase tracking-wide">
            DIET SHEET BUILDER
          </h1>
          <p className="text-sm text-[#666666] font-semibold uppercase tracking-wider">
            Configure calories, macronutrient thresholds & customize meal items.
          </p>
        </div>
        <Button onClick={handleSave} className="font-bebas uppercase tracking-wider text-sm py-2 px-6">
          <Save size={16} className="mr-1.5" /> Save Diet Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Macros configuration & Meal cards list */}
        <div className="lg:col-span-8 space-y-6">
          {/* Target Macros card */}
          <Card className="space-y-4">
            <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide border-b border-[#1F1F1F] pb-2">TARGET CALORIES & MACROS</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Target Client</label>
                {loadingClients ? (
                  <div className="flex items-center gap-2 text-xs text-[#666666] py-2.5">
                    <RefreshCw size={12} className="animate-spin" /> Loading...
                  </div>
                ) : (
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-3 text-sm text-[#F5F5F5] outline-none cursor-pointer"
                  >
                    {clientsList.length === 0 ? (
                      <option value="">No active subscribers</option>
                    ) : (
                      clientsList.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.full_name || c.email}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Calories (kcal)</label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-3 text-sm text-[#F5F5F5] outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Protein (g)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-3 text-sm text-[#F5F5F5] outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Carbs (g)</label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-3 text-sm text-[#F5F5F5] outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Fat (g)</label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-3 text-sm text-[#F5F5F5] outline-none"
                  required
                />
              </div>
            </div>
          </Card>

          {/* Meals list */}
          <div className="space-y-4">
            <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide">MEAL SCHEDULES</h3>
            
            {meals.map((meal) => (
              <Card key={meal.id} className={`p-4 space-y-3.5 border transition-all ${activeMealId === meal.id ? 'border-[#4DA6FF]' : 'border-[#1F1F1F]'}`}>
                <div className="flex justify-between items-center border-b border-[#1F1F1F] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bebas text-lg text-[#F5F5F5] tracking-wide">{meal.name}</span>
                    <span className="text-xs text-[#666666] font-semibold">({meal.time})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setActiveMealId(meal.id)}
                      className={`font-bebas text-xs tracking-wider uppercase py-1 ${activeMealId === meal.id ? 'bg-[#4DA6FF]/10 border-[#4DA6FF] text-[#4DA6FF]' : ''}`}
                    >
                      Selected
                    </Button>
                    <button
                      onClick={() => handleRemoveMeal(meal.id)}
                      className="p-1.5 rounded hover:bg-[#FF3A2D]/10 text-[#666666] hover:text-[#FF3A2D] cursor-pointer outline-none transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {meal.foods.length === 0 ? (
                    <p className="text-xs text-[#666666] italic">No foods added to this meal schedule yet.</p>
                  ) : (
                    meal.foods.map((food, fIdx) => (
                      <div key={fIdx} className="flex justify-between items-center text-xs p-2.5 bg-[#0A0A0A]/80 rounded border border-[#1F1F1F]">
                        <div>
                          <span className="text-[#F5F5F5] font-bold">{food.name}</span>
                          <span className="text-[#666666] ml-2">({food.qty})</span>
                        </div>
                        <button
                          onClick={() => handleDeleteFood(meal.id, fIdx)}
                          className="text-[#666666] hover:text-[#FF3A2D] cursor-pointer outline-none"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Side: Quick Add Actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Add food to selected meal form */}
          <Card className="space-y-4">
            <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide border-b border-[#1F1F1F] pb-2 uppercase">
              ADD ITEM TO: {meals.find(m => m.id === activeMealId)?.name || 'NONE'}
            </h3>

            <form onSubmit={handleAddFood} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Food Name / Description</label>
                <div className="relative">
                  <Apple className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" size={16} />
                  <input
                    type="text"
                    placeholder="e.g. Skinless Chicken Breast"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 pl-10 pr-4 text-sm text-[#F5F5F5] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Quantity / Portion</label>
                <div className="relative">
                  <ClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" size={16} />
                  <input
                    type="text"
                    placeholder="e.g. 150g or 3 large"
                    value={foodQty}
                    onChange={(e) => setFoodQty(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 pl-10 pr-4 text-sm text-[#F5F5F5] outline-none"
                    required
                  />
                </div>
              </div>

              <Button type="submit" variant="outline" className="w-full font-bebas uppercase tracking-wider text-sm py-2.5" disabled={meals.length === 0}>
                <Plus size={16} className="mr-1" /> Add food item
              </Button>
            </form>
          </Card>

          {/* Add a whole new meal card */}
          <Card className="space-y-4">
            <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide border-b border-[#1F1F1F] pb-2 uppercase">
              CREATE MEAL SCHEDULE
            </h3>

            <form onSubmit={handleAddMeal} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Meal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pre-Workout Shake"
                  value={newMealName}
                  onChange={(e) => setNewMealName(e.target.value)}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Target Time</label>
                <input
                  type="text"
                  placeholder="e.g. 4:00 PM"
                  value={newMealTime}
                  onChange={(e) => setNewMealTime(e.target.value)}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none"
                  required
                />
              </div>

              <Button type="submit" className="w-full font-bebas uppercase tracking-wider text-sm py-2.5">
                <PlusCircle size={16} className="mr-1" /> Create Schedule
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DietBuilder
