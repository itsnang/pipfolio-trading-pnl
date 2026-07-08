import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ResetPasswordScreen } from '@/features/auth/components/reset-password-screen'

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Set a new password for your account.',
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordScreen />
    </Suspense>
  )
}
