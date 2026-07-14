import type { ReactNode } from 'react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { requireSession } from '@/lib/better-auth/session'
import { getQueryClient } from '@/lib/query-client'
import { accountsQueryOptions } from '@/features/accounts/utils'
import { AppShell } from '@/components/shared/app-shell'
import { OnboardingGate } from './onboarding-gate'
import { PrefetchController } from './prefetch-controller'
import { AccountSelectionSync } from './account-selection-sync'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user } = await requireSession()
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(accountsQueryOptions())

  return (
    <AppShell user={{ name: user.name, image: user.image ?? null }}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        {children}
        <AccountSelectionSync />
        <OnboardingGate />
        <PrefetchController />
      </HydrationBoundary>
    </AppShell>
  )
}
