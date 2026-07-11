import 'server-only'
import { cache } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from './server'

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})

export async function requireSession() {
  const data = await getSession()
  if (!data?.session || !data.user) redirect('/login')
  return data
}
