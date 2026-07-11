import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { requireSession } from '@/lib/better-auth/session'
import { getQueryClient } from '@/lib/query-client.server'
import { accountsQueryOptions } from '@/features/accounts/utils'
import { AppShell } from '@/components/shared/app-shell'
import { OnboardingGate } from './onboarding-gate'
import { PrefetchController } from './prefetch-controller'
import { RouteLoading } from './route-loading'

async function SessionGate({ children }: { children: ReactNode }) {
  await requireSession()
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(accountsQueryOptions())
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
      <OnboardingGate />
      <PrefetchController />
    </HydrationBoundary>
  )
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <Suspense fallback={<RouteLoading />}>
        <SessionGate>{children}</SessionGate>
      </Suspense>
    </AppShell>
  )
}
