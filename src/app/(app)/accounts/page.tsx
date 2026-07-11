import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query-client.server'
import { accountsQueryOptions } from '@/features/accounts/utils'
import { AccountsScreen } from '@/features/accounts/components/accounts-screen'

export default async function AccountsPage() {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(accountsQueryOptions())
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AccountsScreen />
    </HydrationBoundary>
  )
}
