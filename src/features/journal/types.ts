export interface AccountWithStatsLike {
  id: string
  name: string
}

export interface DayStats {
  date: string
  totalPnl: number
  tradeCount: number
  winCount: number
  lossCount: number
}

export interface MonthJournalData {
  month: string
  accountId: string
  days: DayStats[]
  netPnl: number
  winCount: number
  lossCount: number
  tradeCount: number
  winRate: number
}
