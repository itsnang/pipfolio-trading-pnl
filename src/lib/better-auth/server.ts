import 'server-only'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { db, schema } from '@/lib/db'
import { env } from '@/env'

const vercelTrustedOrigins = [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
  .filter((host): host is string => !!host)
  .map((host) => `https://${host}`)

const SESSION_COOKIE_CACHE_MAX_AGE_SECONDS = 60

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
  }),
  emailAndPassword: { enabled: true },
  session: { cookieCache: { enabled: true, maxAge: SESSION_COOKIE_CACHE_MAX_AGE_SECONDS } },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: vercelTrustedOrigins.length > 0 ? vercelTrustedOrigins : undefined,
  plugins: [nextCookies()],
})

export type Auth = typeof auth
