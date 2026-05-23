export function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

export function getFirstDayOfCurrentMonth() {
  const today = new Date()

  return new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10)
}