export function formatDate(iso: string, month: 'short' | 'long' = 'short'): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month,
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateWithWeekday(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}
