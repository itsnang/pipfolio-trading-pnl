'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toMonthKey } from '@/lib/format'
import { useSelectedAccountStore } from '@/features/accounts/store/accounts.store'
import { monthJournalQueryOptions } from '@/features/journal/utils'

export function PrefetchController() {
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const selectedAccountId = useSelectedAccountStore((s) => s.selectedAccountId)

  useEffect(() => {
    if (!selectedAccountId || pathname.startsWith('/journal')) return
    const month = toMonthKey(new Date())
    queryClient.prefetchQuery(monthJournalQueryOptions(selectedAccountId, month))
  }, [selectedAccountId, pathname, queryClient])

  return null
}
