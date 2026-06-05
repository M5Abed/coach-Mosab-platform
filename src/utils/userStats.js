/**
 * User Training Stats Persistence Utility
 * Persists training progress dates inside localStorage keyed by user.id
 */

/**
 * Returns a local YYYY-MM-DD string for the given Date (defaults to now).
 * This avoids UTC offset issues where a workout at 11pm local time
 * would be logged as the next day in UTC.
 */
function toLocalDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Parses a YYYY-MM-DD string as a LOCAL midnight date (not UTC).
 * new Date("2026-06-05") parses as UTC midnight, which shifts the day
 * in non-UTC timezones. This helper avoids that.
 */
function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

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
  const sortedDates = [...new Set(dates)].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))

  // 1. Calculate Streak
  let streak = 0
  if (sortedDates.length > 0) {
    const todayStr = toLocalDateStr()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = toLocalDateStr(yesterday)

    // Verify if streak is active (completed today or yesterday)
    let currentCheckDate = null
    if (sortedDates.includes(todayStr)) {
      currentCheckDate = todayStr
    } else if (sortedDates.includes(yesterdayStr)) {
      currentCheckDate = yesterdayStr
    }

    if (currentCheckDate) {
      streak = 1
      let expectedDate = parseLocalDate(currentCheckDate)
      
      while (true) {
        expectedDate.setDate(expectedDate.getDate() - 1)
        const expectedStr = toLocalDateStr(expectedDate)
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

  const mondayStr = toLocalDateStr(monday)
  const sundayStr = toLocalDateStr(sunday)

  const thisWeekCompleted = sortedDates.filter(dStr => {
    return dStr >= mondayStr && dStr <= sundayStr
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

  const todayStr = toLocalDateStr()
  if (!dates.includes(todayStr)) {
    dates.push(todayStr)
    localStorage.setItem(datesKey, JSON.stringify(dates))
  }
  return getUserStats(userId)
}
