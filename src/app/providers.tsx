'use client'

import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { NavigationProgress } from '@/components/shared/navigation-progress'
import { Toaster } from '@/components/ui/sonner'
import { makeQueryClient } from '@/lib/query-client'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient())

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        {children}
        <NavigationProgress />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
