import { queryOptions } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getAccountsWithStats } from '../actions'

export function accountsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.accounts(),
    queryFn: () => getAccountsWithStats(),
  })
}
