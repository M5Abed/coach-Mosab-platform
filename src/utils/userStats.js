/**
 * User Training Stats Persistence Utility
 * Persists training progress dates inside localStorage keyed by user.id
 */

export function getUserStats(userId) {
  if (!userId) {
    return { streak: 0, completedDaysThisWeek: 0, completedDates: [] }
  }

  const datesKey = `coach_mosab_completed_dates_${userId}`
  const saved = localStorage.getItem(datesKey)
  let dates = []
  try {
    dates = saved ? JSON.parse(saved) : []
  } catch (e) {
    dates = []
  }



  // Sort unique dates descending
  const sortedDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a))

  // 1. Calculate Streak
  let streak = 0
  if (sortedDates.length > 0) {
    const todayStr = new Date().toISOString().split('T')[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    // Verify if streak is active (completed today or yesterday)
    let currentCheckDate = null
    if (sortedDates.includes(todayStr)) {
      currentCheckDate = todayStr
    } else if (sortedDates.includes(yesterdayStr)) {
      currentCheckDate = yesterdayStr
    }

    if (currentCheckDate) {
      streak = 1
      let expectedDate = new Date(currentCheckDate)
      
      while (true) {
        expectedDate.setDate(expectedDate.getDate() - 1)
        const expectedStr = expectedDate.toISOString().split('T')[0]
        if (sortedDates.includes(expectedStr)) {
          streak++
        } else {
          break
        }
      }
    }
  }

  // 2. Calculate Completed Days in the current calendar week (Monday to Sunday)
  const today = new Date()
  const currentDay = today.getDay() // Sunday = 0, Monday = 1...
  
  // Calculate Monday of this week
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const thisWeekCompleted = sortedDates.filter(dStr => {
    const d = new Date(dStr)
    return d >= monday && d <= sunday
  })

  return {
    streak,
    completedDaysThisWeek: thisWeekCompleted.length,
    completedDates: sortedDates
  }
}

export function logWorkoutCompletion(userId) {
  if (!userId) return null

  const datesKey = `coach_mosab_completed_dates_${userId}`
  const saved = localStorage.getItem(datesKey)
  let dates = []
  try {
    dates = saved ? JSON.parse(saved) : []
  } catch (e) {
    dates = []
  }

  const todayStr = new Date().toISOString().split('T')[0]
  if (!dates.includes(todayStr)) {
    dates.push(todayStr)
    localStorage.setItem(datesKey, JSON.stringify(dates))
  }
  return getUserStats(userId)
}
