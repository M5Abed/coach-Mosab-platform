import React, { useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { toast } from '../../store/toastStore'
import { estimateFoodCalories } from '../../lib/groqCalories'
import { Plus, Trash2, Save, Apple, ClipboardList, RefreshCw, PlusCircle, Sparkles, Loader2, Flame, Beef, Wheat, Droplets } from 'lucide-react'

export function DietBuilder() {
  const [clientsList, setClientsList] = useState([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [loadingClients, setLoadingClients] = useState(true)

  const [calories, setCalories] = useState(0)
  const [protein, setProtein] = useState(0)
  const [carbs, setCarbs] = useState(0)
  const [fat, setFat] = useState(0)

  const [meals, setMeals] = useState([
    {
      id: 1,
      name: 'Breakfast',
      time: '7:30 AM',
      foods: [
        { name: 'Whole Eggs (Boiled)', qty: '3 large', calories: 0, protein: 0, carbs: 0, fat: 0 },
        { name: 'Oats (Raw)', qty: '60g', calories: 0, protein: 0, carbs: 0, fat: 0 }
      ]
    },
    {
      id: 2,
      name: '2nd Meal',
      time: '12:00 PM',
      foods: [
        { name: 'Grilled Chicken Breast', qty: '150g', calories: 0, protein: 0, carbs: 0, fat: 0 },
        { name: 'White Rice (Cooked)', qty: '130g', calories: 0, protein: 0, carbs: 0, fat: 0 }
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

  // AI calculation state
  const [isCalculating, setIsCalculating] = useState(false)
  const [hasCalculated, setHasCalculated] = useState(false)

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
    setHasCalculated(false)
    toast.success('New meal schedule added!')
  }

  const handleRemoveMeal = (mealId) => {
    setMeals(prev => prev.filter(m => m.id !== mealId))
    if (activeMealId === mealId && meals.length > 1) {
      setActiveMealId(meals.filter(m => m.id !== mealId)[0].id)
    }
    setHasCalculated(false)
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
          foods: [...m.foods, { name: foodName, qty: foodQty, calories: 0, protein: 0, carbs: 0, fat: 0 }]
        }
      }
      return m
    }))

    setFoodName('')
    setFoodQty('')
    setHasCalculated(false)
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
    setHasCalculated(false)
  }

  // ⚡ AI Calorie Calculation
  const handleCalculateCalories = async () => {
    // Collect all foods from all meals
    const allFoods = meals.flatMap(m => m.foods)
    if (allFoods.length === 0) {
      toast.error('Please add food items to your meals first.')
      return
    }

    setIsCalculating(true)
    try {
      const result = await estimateFoodCalories(allFoods)

      // Map estimated values back to meals
      let foodIdx = 0
      const updatedMeals = meals.map(meal => ({
        ...meal,
        foods: meal.foods.map(food => {
          const estimated = result.foods[foodIdx] || {}
          foodIdx++
          return {
            ...food,
            calories: estimated.calories || 0,
            protein: estimated.protein || 0,
            carbs: estimated.carbs || 0,
            fat: estimated.fat || 0
          }
        })
      }))

      setMeals(updatedMeals)
      setCalories(result.totals.calories)
      setProtein(result.totals.protein)
      setCarbs(result.totals.carbs)
      setFat(result.totals.fat)
      setHasCalculated(true)
      toast.success(`✅ AI estimated nutrition for ${allFoods.length} food items!`)
    } catch (err) {
      console.error('AI estimation error:', err)
      toast.error('AI calculation failed: ' + err.message)
    } finally {
      setIsCalculating(false)
    }
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
          const kcalStr = f.calories ? ` [${f.calories} kcal]` : ''
          formattedText += `   • ${f.name} — ${f.qty}${kcalStr}\n`
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

  // Calculate per-meal calorie subtotal for display
  const getMealCalories = (meal) => {
    return meal.foods.reduce((sum, f) => sum + (f.calories || 0), 0)
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
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleCalculateCalories} 
            disabled={isCalculating}
            variant="outline"
            className="font-bebas uppercase tracking-wider text-sm py-2 px-5 border-[#A78BFA]/40 text-[#A78BFA] hover:bg-[#A78BFA]/10 hover:border-[#A78BFA] transition-all duration-300 relative overflow-hidden group"
          >
            {isCalculating ? (
              <>
                <Loader2 size={16} className="mr-1.5 animate-spin" /> Calculating...
              </>
            ) : (
              <>
                <Sparkles size={16} className="mr-1.5 group-hover:animate-pulse" /> Calculate Calories with AI
              </>
            )}
          </Button>
          <Button onClick={handleSave} className="font-bebas uppercase tracking-wider text-sm py-2 px-6">
            <Save size={16} className="mr-1.5" /> Save Diet Plan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Macros configuration & Meal cards list */}
        <div className="lg:col-span-8 space-y-6">
          {/* Target Macros card */}
          <Card className="space-y-4 relative overflow-hidden">
            {hasCalculated && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#A78BFA]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            )}
            <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-2">
              <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide">TARGET CALORIES & MACROS</h3>
              {hasCalculated && (
                <Badge variant="accent" className="text-[10px] font-bold uppercase py-0.5 px-2 bg-[#A78BFA]/15 text-[#A78BFA] border-[#A78BFA]/25">
                  <Sparkles size={10} className="mr-1" /> AI Estimated
                </Badge>
              )}
            </div>
            
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
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
                  <Flame size={11} className="text-[#E8FF00]" /> Calories (kcal)
                </label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className={`w-full bg-[#161616] border rounded-lg py-2.5 px-3 text-sm text-[#F5F5F5] outline-none transition-colors ${
                    hasCalculated ? 'border-[#A78BFA]/30 bg-[#A78BFA]/5' : 'border-[#1F1F1F]'
                  }`}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
                  <Beef size={11} className="text-[#FF3A2D]" /> Protein (g)
                </label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className={`w-full bg-[#161616] border rounded-lg py-2.5 px-3 text-sm text-[#F5F5F5] outline-none transition-colors ${
                    hasCalculated ? 'border-[#A78BFA]/30 bg-[#A78BFA]/5' : 'border-[#1F1F1F]'
                  }`}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
                  <Wheat size={11} className="text-[#4DA6FF]" /> Carbs (g)
                </label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className={`w-full bg-[#161616] border rounded-lg py-2.5 px-3 text-sm text-[#F5F5F5] outline-none transition-colors ${
                    hasCalculated ? 'border-[#A78BFA]/30 bg-[#A78BFA]/5' : 'border-[#1F1F1F]'
                  }`}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
                  <Droplets size={11} className="text-[#34D399]" /> Fat (g)
                </label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className={`w-full bg-[#161616] border rounded-lg py-2.5 px-3 text-sm text-[#F5F5F5] outline-none transition-colors ${
                    hasCalculated ? 'border-[#A78BFA]/30 bg-[#A78BFA]/5' : 'border-[#1F1F1F]'
                  }`}
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
                    {hasCalculated && getMealCalories(meal) > 0 && (
                      <Badge variant="default" className="text-[9px] font-bold py-0 px-1.5 bg-[#E8FF00]/10 text-[#E8FF00] border-[#E8FF00]/20">
                        {getMealCalories(meal)} kcal
                      </Badge>
                    )}
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
                      <div key={fIdx} className="flex justify-between items-center text-xs p-2.5 bg-[#0A0A0A]/80 rounded border border-[#1F1F1F] group/food hover:border-[#2F2F2F] transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[#F5F5F5] font-bold">{food.name}</span>
                            <span className="text-[#666666]">({food.qty})</span>
                          </div>
                          {food.calories > 0 && (
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-[10px] font-bold text-[#E8FF00] bg-[#E8FF00]/8 px-1.5 py-0.5 rounded">
                                {food.calories} kcal
                              </span>
                              <span className="text-[9px] font-bold text-[#FF3A2D]">P: {food.protein}g</span>
                              <span className="text-[9px] font-bold text-[#4DA6FF]">C: {food.carbs}g</span>
                              <span className="text-[9px] font-bold text-[#34D399]">F: {food.fat}g</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteFood(meal.id, fIdx)}
                          className="text-[#666666] hover:text-[#FF3A2D] cursor-pointer outline-none opacity-0 group-hover/food:opacity-100 transition-opacity"
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
          {/* AI Calculate Card */}
          <Card className="space-y-4 border-[#A78BFA]/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#A78BFA]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="border-b border-[#1F1F1F] pb-2">
              <h3 className="font-bebas text-xl text-[#A78BFA] tracking-wide uppercase flex items-center gap-2">
                <Sparkles size={18} /> AI NUTRITION ANALYZER
              </h3>
              <p className="text-[10px] text-[#666666] font-semibold uppercase tracking-wider mt-0.5">
                Powered by Groq AI — Estimates calories & macros for all items
              </p>
            </div>

            <div className="space-y-3">
              <div className="bg-[#0A0A0A] rounded-lg border border-[#1F1F1F] p-3 space-y-1.5">
                <span className="text-[9px] text-[#888888] font-bold uppercase tracking-widest block">Food Items Queued</span>
                <span className="font-bebas text-2xl text-[#F5F5F5]">
                  {meals.reduce((sum, m) => sum + m.foods.length, 0)}
                </span>
                <span className="text-[10px] text-[#666666] font-semibold block">
                  across {meals.length} meal{meals.length !== 1 ? 's' : ''}
                </span>
              </div>

              <Button 
                onClick={handleCalculateCalories}
                disabled={isCalculating || meals.reduce((sum, m) => sum + m.foods.length, 0) === 0}
                className="w-full font-bebas uppercase tracking-wider text-sm py-3 bg-gradient-to-r from-[#A78BFA] to-[#7C3AED] hover:from-[#B79CFF] hover:to-[#8B5CF6] text-white border-0 shadow-lg shadow-[#A78BFA]/15 hover:shadow-[#A78BFA]/30 transition-all duration-300"
              >
                {isCalculating ? (
                  <>
                    <Loader2 size={16} className="mr-1.5 animate-spin" /> Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="mr-1.5" /> Calculate All Calories
                  </>
                )}
              </Button>

              {hasCalculated && (
                <div className="bg-[#34D399]/5 border border-[#34D399]/15 rounded-lg p-2.5 text-center">
                  <span className="text-[10px] text-[#34D399] font-bold uppercase tracking-wider">
                    ✅ Estimation Complete — Values auto-populated
                  </span>
                </div>
              )}
            </div>
          </Card>

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
