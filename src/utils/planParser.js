/**
 * Plan Parser Utility
 * Dynamically parses plain-text plans into structured objects if structured formats do not exist,
 * ensuring client-side graphical dashboard cards are always fully dynamic and populated.
 */

export function parseWorkoutPlan(plan) {
  // 1. Guard against falsy/null/undefined or literal "null"/"undefined" strings
  if (!plan || plan === 'null' || plan === 'undefined') return null

  // 2. Handle string primitive input (e.g., text plan or stringified JSON)
  if (typeof plan === 'string') {
    const trimmed = plan.trim()
    const SENTINEL_VALUES = ['NONE', 'NO PLAN', 'NO WORKOUT', 'NOT ASSIGNED']
    if (!trimmed || SENTINEL_VALUES.includes(trimmed.toUpperCase())) {
      return null
    }
    // Check if it's a JSON string
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        plan = JSON.parse(trimmed)
      } catch (e) {
        plan = { text: trimmed }
      }
    } else {
      plan = { text: trimmed }
    }
  }

  // 3. Handle object input
  if (typeof plan !== 'object') {
    return null
  }

  // If it already has structured exercises and title, return it as is
  if (plan.exercises && Array.isArray(plan.exercises) && plan.exercises.length > 0 && plan.title) {
    return {
      title: plan.title || 'CUSTOM WORKOUT PLAN',
      level: plan.level || 'beginner',
      duration: plan.duration || 'Ongoing',
      daysPerWeek: plan.daysPerWeek || 3,
      exercises: plan.exercises.map(ex => ({ ...ex, day: ex.day || 1 })),
      text: plan.text || ''
    }
  }

  // If there's no valid text to parse, return structured plan or null if no exercises exist either
  if (!plan.text || typeof plan.text !== 'string' || !plan.text.trim()) {
    if (plan.exercises && Array.isArray(plan.exercises) && plan.exercises.length > 0) {
      return {
        title: plan.title || 'CUSTOM WORKOUT PROGRAM',
        level: plan.level || 'beginner',
        duration: plan.duration || 'Ongoing',
        daysPerWeek: plan.daysPerWeek || 3,
        exercises: plan.exercises.map(ex => ({ ...ex, day: ex.day || 1 })),
        text: ''
      }
    }
    return null
  }

  const text = plan.text
  const lines = text.split('\n').map(l => l.trim())
  
  let title = plan.title || ''
  let level = plan.level || 'intermediate'
  let duration = plan.duration || '8 Weeks'
  let daysPerWeek = plan.daysPerWeek || 3
  let exercises = []

  // Parse Title
  const titleLine = lines.find(l => l.toUpperCase().includes('TRAINING PROGRAM:') || l.toUpperCase().includes('PLAN:'))
  if (titleLine) {
    const parts = titleLine.split(':')
    if (parts.length > 1) title = parts[1].trim()
  } else if (lines.length > 0 && lines[0].length > 0) {
    title = lines[0].replace(/^[#\s*=-]+/, '').trim()
  }

  // Parse Config (Level, Duration, Schedule)
  const configLine = lines.find(l => l.includes('Level:') || l.includes('Duration:') || l.includes('Schedule:'))
  if (configLine) {
    const levelMatch = configLine.match(/Level:\s*([A-Za-z0-9]+)/i)
    if (levelMatch) level = levelMatch[1].toLowerCase()
    
    const durationMatch = configLine.match(/Duration:\s*([^|]+)/i)
    if (durationMatch) duration = durationMatch[1].trim()
    
    const scheduleMatch = configLine.match(/Schedule:\s*(\d+)/i)
    if (scheduleMatch) daysPerWeek = Number(scheduleMatch[1])
  }

  // Parse Exercises
  let currentExercise = null
  let currentDay = 1
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    // Detect Day Headers like "DAY 1:" or "Day 2"
    const dayHeaderMatch = line.match(/^DAY\s*(\d+)[:\-]?/i)
    if (dayHeaderMatch) {
      currentDay = Number(dayHeaderMatch[1])
      continue
    }

    // Check if the line is a details line for the current exercise first!
    const isDetailsLine = currentExercise && (
      line.includes('Sets') || 
      line.includes('Reps') || 
      line.includes('Rest') || 
      line.includes('Intensity') || 
      line.includes('Difficulty') ||
      line.includes('RIR')
    )

    if (isDetailsLine) {
      const setsMatch = line.match(/(\d+)\s*Sets/i)
      if (setsMatch) currentExercise.sets = Number(setsMatch[1])
      
      const repsMatch = line.match(/x\s*([0-9\-\+\s]+)\s*Reps/i) || line.match(/([0-9\-\+\s]+)\s*Reps/i)
      if (repsMatch) currentExercise.reps = repsMatch[1].trim()
      
      const restMatch = line.match(/Rest:\s*([^\s|]+)/i)
      if (restMatch) currentExercise.rest = restMatch[1].trim()
      
      const intensityMatch = line.match(/Intensity:\s*([^|\n]+)/i) || line.match(/Difficulty:\s*([^|\n]+)/i) || line.match(/RIR:\s*([^|\n]+)/i)
      if (intensityMatch) {
        const val = intensityMatch[1].trim()
        currentExercise.difficulty = val
        if (val.toLowerCase().includes('rir')) {
          const rirVal = val.toLowerCase()
          let cleanRir = '—'
          if (rirVal.includes('0')) cleanRir = '0'
          else if (rirVal.includes('1')) cleanRir = '1'
          else if (rirVal.includes('2')) cleanRir = '2'
          else if (rirVal.includes('3')) cleanRir = '3'
          currentExercise.rir = cleanRir
          
          if (cleanRir === '0' || cleanRir === '1') {
            currentExercise.dotColor = 'bg-[#FF3A2D]'
            currentExercise.difficulty = 'Hard'
          } else if (cleanRir === '2' || cleanRir === '3') {
            currentExercise.dotColor = 'bg-[#FF8C00]'
            currentExercise.difficulty = 'Medium'
          } else {
            currentExercise.dotColor = 'bg-[#34D399]'
            currentExercise.difficulty = 'Easy'
          }
        } else {
          const diff = val.toLowerCase()
          currentExercise.dotColor = diff === 'easy' ? 'bg-[#34D399]' : diff === 'hard' ? 'bg-[#FF3A2D]' : 'bg-[#FF8C00]'
        }
      }
      continue
    }

    // Matches e.g. "1. Deadlift" or "• Lat Pulldown"
    const exerciseMatch = line.match(/^(\d+)\.\s*(.+)$/) || line.match(/^[•*-]\s*(.+)$/)
    
    // Space-separated fallback matches "Flat dumbbell press 3 6:8 1"
    const spaceMatch = line.match(/^([A-Za-z0-9\s\-\(\)\/,]+?)\s+(\d+)\s+([\d:]+(?:\s*(?:min|reps|sec))?)\s+(\S+.*)$/)

    if (exerciseMatch) {
      if (currentExercise) {
        exercises.push(currentExercise)
      }
      
      const name = (exerciseMatch[2] || exerciseMatch[1] || '').replace(/^[#\s*=-]+/, '').trim()
      if (name.toUpperCase().includes('EXERCISES IN PROGRAM') || name.toUpperCase().includes('DAILY NUTRITION') || name.toUpperCase().includes('NO EXERCISES')) {
        currentExercise = null
        continue
      }
      
      currentExercise = {
        id: 'parsed-ex-' + (exercises.length + 1),
        name: name,
        sets: 4,
        reps: '10',
        rest: '90s',
        rir: '—',
        difficulty: 'Medium',
        dotColor: 'bg-[#FF8C00]',
        guide: 'Maintain strict control over both eccentric and concentric phases.',
        tip: 'Keep your core engaged throughout.',
        day: currentDay
      }
    } else if (spaceMatch) {
      const name = spaceMatch[1].replace(/^[#\s*=-]+/, '').trim()
      const nameUpper = name.toUpperCase()
      
      // Ignore header titles or metadata
      if (
        nameUpper.includes('EXERCISE') ||
        nameUpper.includes('SET') ||
        nameUpper.includes('REP') ||
        nameUpper.includes('RIR') ||
        nameUpper.includes('NOTE') ||
        nameUpper.includes('CARDIO') ||
        nameUpper.includes('RESISTANCE') ||
        nameUpper.includes('WORKOUT') ||
        nameUpper.includes('PLAN') ||
        nameUpper.includes('LEVEL') ||
        nameUpper.includes('DURATION') ||
        nameUpper.includes('SCHEDULE')
      ) {
        continue
      }

      if (currentExercise) {
        exercises.push(currentExercise)
        currentExercise = null
      }

      const sets = Number(spaceMatch[2])
      const reps = spaceMatch[3].trim()
      const rir = spaceMatch[4].trim()
      let cleanRir = '—'
      const rVal = rir.toLowerCase()
      if (rVal.includes('0')) cleanRir = '0'
      else if (rVal.includes('1')) cleanRir = '1'
      else if (rVal.includes('2')) cleanRir = '2'
      else if (rVal.includes('3')) cleanRir = '3'

      exercises.push({
        id: 'parsed-ex-' + (exercises.length + 1),
        name: name,
        sets: sets,
        reps: reps,
        rest: '90s',
        rir: cleanRir,
        difficulty: cleanRir === '0' || cleanRir === '1' ? 'Hard' : cleanRir === '2' || cleanRir === '3' ? 'Medium' : 'Easy',
        dotColor: cleanRir === '0' || cleanRir === '1' ? 'bg-[#FF3A2D]' : cleanRir === '2' || cleanRir === '3' ? 'bg-[#FF8C00]' : 'bg-[#34D399]',
        guide: `RIR (Reps in Reserve): ${cleanRir}. Keep form stable.`,
        tip: `Maintain control and focus on the target muscles.`,
        day: currentDay
      })
    }
  }
  if (currentExercise) {
    exercises.push(currentExercise)
  }

  if (!title) {
    title = 'CUSTOM STRENGTH PLAN'
  }

  return {
    ...plan,
    title,
    level,
    duration,
    daysPerWeek,
    exercises
  }
}

export function parseNutritionPlan(plan) {
  // 1. Guard against falsy/null/undefined or literal "null"/"undefined" strings
  if (!plan || plan === 'null' || plan === 'undefined') return null

  // 2. Handle string primitive input (e.g., text plan or stringified JSON)
  if (typeof plan === 'string') {
    const trimmed = plan.trim()
    const SENTINEL_VALUES = ['NONE', 'NO PLAN', 'NO NUTRITION', 'NOT ASSIGNED']
    if (!trimmed || SENTINEL_VALUES.includes(trimmed.toUpperCase())) {
      return null
    }
    // Check if it's a JSON string
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        plan = JSON.parse(trimmed)
      } catch (e) {
        plan = { text: trimmed }
      }
    } else {
      plan = { text: trimmed }
    }
  }

  // 3. Handle object input
  if (typeof plan !== 'object') {
    return null
  }

  // If it already has structured macros and meals, return as is
  if (plan.calories && plan.macros && plan.meals && Array.isArray(plan.meals) && plan.meals.length > 0) {
    return {
      calories: plan.calories,
      macros: plan.macros,
      meals: plan.meals,
      text: plan.text || ''
    }
  }

  // If there's no valid text to parse, return a default placeholder structure or null if no meals exist either
  if (!plan.text || typeof plan.text !== 'string' || !plan.text.trim()) {
    if (plan.meals && Array.isArray(plan.meals) && plan.meals.length > 0) {
      return {
        calories: plan.calories || 2000,
        macros: plan.macros || { protein: 150, carbs: 200, fat: 60 },
        meals: plan.meals,
        text: ''
      }
    }
    return null
  }

  const text = plan.text
  const lines = text.split('\n').map(l => l.trim())

  let calories = plan.calories || 2200
  let macros = plan.macros || { protein: 160, carbs: 220, fat: 65 }
  let meals = []

  // Parse Target Metrics (Calories & Macros)
  const targetsLine = lines.find(l => l.toUpperCase().includes('CALORIES:') || l.toUpperCase().includes('MACROS:') || l.toUpperCase().includes('TARGETS:'))
  if (targetsLine) {
    const calMatch = targetsLine.match(/Calories:\s*(\d+)/i)
    if (calMatch) calories = Number(calMatch[1])

    const protMatch = targetsLine.match(/Protein:\s*(\d+)/i)
    if (protMatch) macros.protein = Number(protMatch[1])

    const carbMatch = targetsLine.match(/Carbs:\s*(\d+)/i)
    if (carbMatch) macros.carbs = Number(carbMatch[1])

    const fatMatch = targetsLine.match(/Fat:\s*(\d+)/i)
    if (fatMatch) macros.fat = Number(fatMatch[1])
  }

  // Parse Meals
  let currentMeal = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    const mealMatch = line.match(/MEAL\s*(\d+):\s*([^(]+)(?:\(([^)]+)\))?/i) || line.match(/^🍴\s*MEAL\s*(\d+):\s*([^(]+)(?:\(([^)]+)\))?/i)
    if (mealMatch) {
      if (currentMeal) {
        meals.push(currentMeal)
      }
      
      const name = mealMatch[2].trim()
      const time = mealMatch[3] ? mealMatch[3].trim() : 'Anytime'
      
      currentMeal = {
        id: 'parsed-meal-' + (meals.length + 1),
        name: name,
        time: time,
        foods: []
      }
    } else if (currentMeal) {
      const foodMatch = line.match(/^[•*-\s]+\s*(.+)\s*—\s*(.+)$/) || line.match(/^[•*-\s]+\s*(.+)\s*-\s*(.+)$/) || line.match(/^[•*-\s]+\s*(.+)$/)
      if (foodMatch) {
        const name = foodMatch[1].trim()
        const qty = foodMatch[2] ? foodMatch[2].trim() : '1 portion'
        
        if (name.toUpperCase().includes('DAILY NUTRITION') || name.toUpperCase().includes('CALORIES')) {
          continue
        }
        
        currentMeal.foods.push({ name, qty })
      }
    }
  }
  
  if (currentMeal) {
    meals.push(currentMeal)
  }

  return {
    ...plan,
    calories,
    macros,
    meals
  }
}
