'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ApiError, apiFetch } from '@/lib/api/server'
import { USER_COOKIE } from '../cookies'
import { clearSession, persistSession } from './session-store'
import type { SessionData } from './session-store'
import type {
  AuthUser,
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../types'

const NETWORK_ERROR = 'Unable to reach the server. Please try again.'
const GENERIC_ERROR = 'Something went wrong. Please try again.'

/** Map a thrown `apiFetch` error to a user-facing message. `ApiError` carries
 *  the API's own message; anything else is a transport failure. */
function errorMessage(e: unknown, fallback = GENERIC_ERROR): string {
  if (e instanceof ApiError) return e.message || fallback
  return NETWORK_ERROR
}

export async function login(input: LoginInput): Promise<{ error?: string }> {
  let data: SessionData
  try {
    data = await apiFetch<SessionData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 400)) {
      return { error: e.message || 'Invalid email or password' }
    }
    return { error: errorMessage(e) }
  }
  await persistSession(data)
  redirect('/dashboard')
}

export async function register(input: RegisterInput): Promise<{ error?: string }> {
  const { name, email, password } = input
  let data: SessionData
  try {
    data = await apiFetch<SessionData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  await persistSession(data)
  redirect('/dashboard')
}

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<{ error?: string }> {
  try {
    await apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify(input) })
    return {}
  } catch (e) {
    return { error: errorMessage(e) }
  }
}

export async function resetPassword(
  input: ResetPasswordInput,
  token: string,
): Promise<{ error?: string }> {
  try {
    await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: input.password }),
    })
    return {}
  } catch (e) {
    return { error: errorMessage(e) }
  }
}

export async function logout(): Promise<void> {
  await clearSession()
  redirect('/login')
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(USER_COOKIE)?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}
