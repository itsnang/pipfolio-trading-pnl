'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { resetPassword } from '../actions'
import { resetPasswordSchema, type ResetPasswordInput } from '../types'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

export function ResetPasswordScreen() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const token = useSearchParams().get('token') ?? ''

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (values: ResetPasswordInput) => {
    if (!token) {
      toast.error('Invalid or missing reset link.')
      return
    }
    const result = await resetPassword(values, token)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Password updated. You can now sign in.')
  }

  return (
    <div className="h-svh flex flex-col items-center justify-center px-4">
      {/* Card */}
      <div className="w-full max-w-sm rounded-3xl bg-card px-7 py-8 shadow-lg">
        <h1 className="text-[28px] leading-tight mb-1 text-foreground">
          New password
        </h1>
        <p className="text-sm mb-7 text-muted-foreground">
          Choose a strong password for your account
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* New password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                    New password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="h-11 rounded-xl text-sm pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-opacity hover:opacity-70"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Confirm password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                    Confirm password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="h-11 rounded-xl text-sm pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-opacity hover:opacity-70"
                      >
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-2xl text-sm font-semibold tracking-wide transition-opacity hover:opacity-90 disabled:opacity-60 mt-2 flex items-center justify-center gap-2 bg-primary text-primary-foreground"
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              Update password
            </button>
          </form>
        </Form>
      </div>

      {/* Back to sign in */}
      <p className="text-sm mt-6 text-muted-foreground">
        Remember your password?{' '}
        <Link
          href="/login"
          className="text-primary transition-opacity hover:opacity-70"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
