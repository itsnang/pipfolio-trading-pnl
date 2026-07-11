export function buildCalendarCells(month: string): (string | null)[] {
  const [yearStr, monStr] = month.split('-')
  const year = Number(yearStr)
  const mon = Number(monStr)
  const firstDay = new Date(year, mon - 1, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, mon, 0).getDate()
  const cells: (string | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(mon).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}
