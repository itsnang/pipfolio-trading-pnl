'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { requestPasswordReset } from '../actions'
import { forgotPasswordSchema, type ForgotPasswordInput } from '../types'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

export function ForgotPasswordScreen() {
  const [sent, setSent] = useState(false)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (values: ForgotPasswordInput) => {
    const result = await requestPasswordReset(values)
    if (result.error) {
      toast.error(result.error)
      return
    }
    setSent(true)
  }

  return (
    <div className="h-svh flex flex-col items-center justify-center px-4">
      {/* Card */}
      <div className="w-full max-w-sm rounded-3xl bg-card px-7 py-8 shadow-lg">
        {sent ? (
          /* Success state */
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-primary/10">
              <MailCheck size={22} className="text-primary" />
            </div>
            <h1 className="text-2xl leading-tight mb-2 text-foreground">
              Check your email
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We sent a reset link to{' '}
              <span className="text-foreground">{form.getValues('email')}</span>.
              Check your inbox and follow the instructions.
            </p>
          </div>
        ) : (
          /* Form state */
          <>
            <h1 className="text-[28px] leading-tight mb-1 text-foreground">
              Forgot password?
            </h1>
            <p className="text-sm mb-7 text-muted-foreground">
              Enter your email and we&apos;ll send a reset link
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          className="h-11 rounded-xl text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-2xl text-sm font-semibold tracking-wide transition-opacity hover:opacity-90 disabled:opacity-60 mt-2 flex items-center justify-center gap-2 bg-primary text-primary-foreground"
                >
                  {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                  Send reset link
                </button>
              </form>
            </Form>
          </>
        )}
      </div>

      {/* Back to sign in */}
      <Link
        href="/login"
        className="flex items-center gap-1.5 text-sm mt-6 text-muted-foreground transition-opacity hover:opacity-70"
      >
        <ArrowLeft size={13} />
        Back to sign in
      </Link>
    </div>
  )
}
