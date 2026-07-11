import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/env'
import * as schema from './schema'

export type Db = ReturnType<typeof drizzle<typeof schema>>

export const db = drizzle(
  postgres(env.DATABASE_URL, {
    max: 20,
    prepare: false,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  }),
  { schema },
)
