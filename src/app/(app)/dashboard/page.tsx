import { getCurrentUser, logout } from '@/features/auth/actions'
import { PageShell } from '@/components/shared/page-shell'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  return (
    <PageShell
      heading="Dashboard"
      description={user ? `Signed in as ${user.email}` : 'You are signed in.'}
    >
      <form action={logout}>
        <Button type="submit" variant="outline">
          Log out
        </Button>
      </form>
    </PageShell>
  )
}
