'use client'

import { BottomSheet } from '@/components/shared/bottom-sheet'
import { WithdrawForm } from './withdraw-form'

interface WithdrawSheetProps {
  accountId: string
  open: boolean
  onClose: () => void
}

export function WithdrawSheet({ accountId, open, onClose }: WithdrawSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Record Withdrawal">
      <div className="px-5 py-5">
        <WithdrawForm accountId={accountId} onSuccess={onClose} />
      </div>
    </BottomSheet>
  )
}
