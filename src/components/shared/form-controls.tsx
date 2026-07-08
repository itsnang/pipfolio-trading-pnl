import type React from 'react'
import { cn } from '@/lib/utils'

export function Field({
  label,
  children,
  error,
}: {
  label: React.ReactNode
  children: React.ReactNode
  error?: string | undefined
}) {
  return (
    <div className="mb-3.5">
      <label className="block text-foreground">
        <span className="block text-[12.5px] font-bold mb-1.5">{label}</span>
        {children}
      </label>
      {error && (
        <p className="mt-1 text-[11.5px] font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={cn(
        'relative w-[42px] h-[25px] rounded-full shrink-0 transition-colors',
        on ? 'bg-primary' : 'bg-input'
      )}
    >
      <span
        className="absolute top-[3px] w-[19px] h-[19px] rounded-full bg-white transition-all"
        style={{ left: on ? 20 : 3, boxShadow: '0 1px 3px rgba(0,0,0,.3)' }}
      />
    </button>
  )
}
