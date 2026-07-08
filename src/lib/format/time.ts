/**
 * Compact relative label from elapsed minutes — "Xm ago" under an hour,
 * otherwise "Xh ago" (rounded). For when the caller already knows the elapsed
 * minutes (e.g. a precomputed `placedAgoMinutes`).
 */
export function timeAgo(mins: number): string {
  if (mins < 60) return `${mins}m ago`
  return `${Math.round(mins / 60)}h ago`
}

/**
 * Relative label from an absolute timestamp (ms) — "just now", "Xm ago",
 * "Xh ago", or "Xd ago" (all floored). For event timestamps that should read
 * naturally across minutes to days.
 */
export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
