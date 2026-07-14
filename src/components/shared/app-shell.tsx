'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CalendarDays, LogOut, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/better-auth/client'
import { AppLogo } from './app-logo'

interface AppShellUser {
  name: string
  image: string | null
}

interface AppShellProps {
  children: React.ReactNode
  user: AppShellUser
}

function NavAvatar({ user, size }: { user: AppShellUser; size: number }) {
  const initial = user.name.charAt(0).toUpperCase()
  return (
    <div
      className="overflow-hidden rounded-full bg-clay/20"
      style={{ width: size, height: size }}
    >
      {user.image ? (
        <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-extrabold text-clay"
          style={{ fontSize: Math.round(size * 0.42) }}
        >
          {initial}
        </div>
      )}
    </div>
  )
}

const tabs = [
  { href: '/journal', label: 'Journal', icon: CalendarDays },
  { href: '/accounts', label: 'Accounts', icon: Wallet },
  { href: '/profile', label: 'Profile', icon: null },
] as const

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = () => {
    signOut({ fetchOptions: { onSuccess: () => router.push('/login') } })
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop/tablet sidebar */}
      <nav className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col items-center gap-1 border-r border-line bg-background py-5 md:flex">
        <AppLogo className="mb-6 h-9 w-9" />
        <div className="flex flex-1 flex-col items-center gap-1.5">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex w-16 flex-col items-center gap-1 rounded-xl py-2.5 text-[10px] font-semibold transition-colors',
                  active ? 'bg-clay/10 text-clay' : 'text-muted-foreground hover:bg-hair hover:text-foreground',
                )}
              >
                {Icon ? (
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                ) : (
                  <NavAvatar user={user} size={20} />
                )}
                {label}
              </Link>
            )
          })}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-16 flex-col items-center gap-1 rounded-xl py-2.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-hair hover:text-foreground"
        >
          <LogOut size={20} strokeWidth={1.8} />
          Sign out
        </button>
      </nav>

      <div className="flex min-h-screen flex-1 flex-col items-center md:pl-20">
        <main className="app-container flex-1">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="sticky bottom-0 z-30 w-full shrink-0 border-t border-line bg-background/95 backdrop-blur-sm md:hidden">
          <div className="flex pb-safe">
            {tabs.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                    active ? 'text-clay' : 'text-muted-foreground',
                  )}
                >
                  {Icon ? (
                    <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                  ) : (
                    <NavAvatar user={user} size={22} />
                  )}
                  {label}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
