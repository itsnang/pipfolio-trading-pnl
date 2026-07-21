'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { deposit } from '@/lib/db/schema/deposit.table'
import { tradingAccount } from '@/lib/db/schema/trading-account.table'
import { withAuthAction } from '@/lib/better-auth/middleware'
import type { WithdrawInput } from '../schemas'

export const addWithdrawal = withAuthAction(
  async (
    { user },
    accountId: string,
    input: WithdrawInput,
  ): Promise<{ error?: string }> => {
    try {
      const [account] = await db
        .select({ id: tradingAccount.id })
        .from(tradingAccount)
        .where(and(eq(tradingAccount.id, accountId), eq(tradingAccount.userId, user.id)))
      if (!account) return { error: 'Account not found' }

      // Store as negative amount so balance formula (startingBalance + totalPnl + totalDeposits)
      // naturally decreases when a withdrawal is recorded.
      const negativeAmount = (-parseFloat(input.amount)).toFixed(2)

      await db.insert(deposit).values({
        id: crypto.randomUUID(),
        userId: user.id,
        accountId,
        amount: negativeAmount,
        note: input.note?.trim() || null,
      })
      revalidatePath('/accounts')
      revalidatePath('/journal')
      return {}
    } catch {
      return { error: 'Failed to record withdrawal' }
    }
  },
)
