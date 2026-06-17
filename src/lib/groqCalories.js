import { supabase } from './supabase'

/**
 * Calls the Supabase Edge Function 'calculate-calories' to estimate
 * nutritional values for a list of food items using the Groq AI API.
 *
 * The Groq API key is stored securely server-side as a Supabase secret.
 *
 * @param {Array<{name: string, qty: string}>} foods - Array of food items
 * @returns {Promise<{foods: Array<{name: string, qty: string, calories: number, protein: number, carbs: number, fat: number}>, totals: {calories: number, protein: number, carbs: number, fat: number}}>}
 */
export async function estimateFoodCalories(foods) {
  if (!foods || foods.length === 0) {
    throw new Error('No food items provided.')
  }

  // Clean the food list to only send name and qty
  const cleanFoods = foods.map(f => ({
    name: String(f.name || '').trim(),
    qty: String(f.qty || '').trim()
  })).filter(f => f.name)

  if (cleanFoods.length === 0) {
    throw new Error('No valid food items to analyze.')
  }

  const { data, error } = await supabase.functions.invoke('calculate-calories', {
    body: { foods: cleanFoods }
  })

  if (error) {
    console.error('Edge function error:', error)
    throw new Error(error.message || 'Failed to connect to calorie estimation service.')
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  if (!data?.foods || !Array.isArray(data.foods)) {
    throw new Error('Received invalid response from calorie estimation service.')
  }

  return {
    foods: data.foods,
    totals: data.totals || {
      calories: data.foods.reduce((sum, f) => sum + (f.calories || 0), 0),
      protein: data.foods.reduce((sum, f) => sum + (f.protein || 0), 0),
      carbs: data.foods.reduce((sum, f) => sum + (f.carbs || 0), 0),
      fat: data.foods.reduce((sum, f) => sum + (f.fat || 0), 0)
    }
  }
}
