'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useMounted } from '@/hooks/use-mounted'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()
  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-[38px] h-[38px] rounded-lg grid place-items-center bg-muted text-foreground"
    >
      {isDark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  )
}
