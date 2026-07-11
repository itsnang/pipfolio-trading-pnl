'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { deleteTrade } from '../actions'
import { TradeItem } from './trade-item'
import { invalidateTradeQueries } from '../utils'
import type { Trade } from '../types'

export function TradeListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4.5 w-10 rounded-md" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="size-4 rounded-full" />
        </div>
      ))}
    </div>
  )
}

interface TradeListProps {
  trades: Trade[]
  accountId: string
  date: string
}

export function TradeList({ trades, accountId, date }: TradeListProps) {
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const result = await deleteTrade(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      await invalidateTradeQueries(queryClient, accountId, date)
      toast.success('Trade deleted')
    }
    setDeletingId(null)
  }

  if (trades.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No trades logged for this day.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {trades.map((t) => (
        <TradeItem
          key={t.id}
          trade={t}
          onDelete={handleDelete}
          isDeleting={deletingId === t.id}
        />
      ))}
    </div>
  )
}
