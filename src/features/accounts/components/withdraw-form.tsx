'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { queryKeys } from '@/lib/query-keys'
import { withdrawSchema, type WithdrawInput } from '../schemas'
import { addWithdrawal } from '../actions'

interface WithdrawFormProps {
  accountId: string
  onSuccess?: () => void
}

export function WithdrawForm({ accountId, onSuccess }: WithdrawFormProps) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WithdrawInput>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { amount: '', note: '' },
  })

  const onSubmit = async (values: WithdrawInput) => {
    const result = await addWithdrawal(accountId, values)
    if (result.error) {
      toast.error(result.error)
      return
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.accounts() })
    toast.success('Withdrawal recorded')
    reset()
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wd-amount">Amount ($)</Label>
        <Input
          id="wd-amount"
          placeholder="e.g. 1000"
          inputMode="decimal"
          {...register('amount')}
        />
        {errors.amount && (
          <p className="text-xs text-red">{errors.amount.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wd-note">Note (optional)</Label>
        <Input
          id="wd-note"
          placeholder="e.g. Profit pull"
          {...register('note')}
        />
        {errors.note && (
          <p className="text-xs text-red">{errors.note.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-1 w-full active:scale-[0.98]">
        {isSubmitting ? 'Saving…' : 'Record withdrawal'}
      </Button>
    </form>
  )
}
