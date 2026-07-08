import type { Metadata } from 'next'
import { LoginScreen } from '@/features/auth/components/login-screen'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your account.',
}

export default function LoginPage() {
  return <LoginScreen />
}
