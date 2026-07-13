import 'server-only'
import { resend } from '@/lib/email/client'
import { env } from '@/env'

export async function sendResetPasswordEmail({ to, url }: { to: string; url: string }) {
  // resend.emails.send() returns an { error } object on failure rather than
  // throwing — surface it explicitly, otherwise a failed send looks identical
  // to a successful one to both better-auth and the caller.
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: 'Reset your Pipfolio password',
    html: `<p>Someone requested a password reset for your Pipfolio account.</p><p><a href="${url}">Reset your password</a></p><p>If you didn't request this, you can ignore this email.</p>`,
  })
  if (error) throw new Error(`Failed to send reset password email: ${error.message}`)
}
