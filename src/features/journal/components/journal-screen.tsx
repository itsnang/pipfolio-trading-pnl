'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { shiftMonth, formatMonthLabel } from '@/lib/format'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { UserAvatar } from '@/components/shared/user-avatar'
import { useMonthJournal } from '../hooks/use-month-journal'
import { MonthNav } from './month-nav'
import { MonthHero } from './month-hero'
import { MonthCalendar } from './month-calendar'
import { RecentDaysPanel } from './recent-days-panel'
import { TourTooltip } from '@/components/shared/tour-tooltip'
import type { AccountWithStatsLike } from '../types'

interface JournalScreenProps {
  accountId: string | null
  month: string
  selectedDate: string | null
  onMonthChange: (month: string) => void
  onDayPress: (date: string) => void
  accounts: AccountWithStatsLike[]
  user: { name: string; image: string | null }
}


const slideVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? '-100%' : '100%', opacity: 0 }),
}

export function JournalScreen({
  accountId,
  month,
  selectedDate,
  onMonthChange,
  onDayPress,
  accounts,
  user,
}: JournalScreenProps) {
  const [direction, setDirection] = useState(0)
  const effectiveAccountId = accountId ?? ''

  const { data } = useMonthJournal(effectiveAccountId, month)

  const emptyData = {
    month,
    accountId: effectiveAccountId,
    days: [],
    netPnl: 0,
    winCount: 0,
    lossCount: 0,
    tradeCount: 0,
    winRate: 0,
  }

  const journalData = data ?? emptyData
  const activeAccount = accounts.find((acc) => acc.id === effectiveAccountId)

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-8 pb-2">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <UserAvatar name={user.name} image={user.image} size={28} />
            <span className="text-sm font-semibold text-muted-foreground">
              Hi, {user.name.split(' ')[0]}
            </span>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex items-end justify-between gap-2">
          <div>
            <h1 className="text-xl font-extrabold">Journal</h1>
            <p className="text-xs text-muted-foreground">XAU/USD · {formatMonthLabel(month)}</p>
          </div>
          {activeAccount && (
            <Link
              href="/accounts"
              data-tour="account-chip"
              className="flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-2 text-xs font-semibold"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
              <span className="max-w-24 truncate">{activeAccount.name}</span>
              <ChevronRight size={13} className="text-muted-foreground" />
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start">
        <motion.div
          className="relative flex-1 overflow-hidden lg:min-w-0"
          onPanEnd={(_event, info) => {
            const isHorizontal = Math.abs(info.offset.x) > Math.abs(info.offset.y) * 1.5
            const isFastEnough = Math.abs(info.velocity.x) > 200 || Math.abs(info.offset.x) > 60
            if (!isHorizontal || !isFastEnough) return
            if (info.offset.x < 0) {
              setDirection(1)
              onMonthChange(shiftMonth(month, 1))
            } else {
              setDirection(-1)
              onMonthChange(shiftMonth(month, -1))
            }
          }}
        >
          <TourTooltip
            storageKey="pipfolio_journal_tour"
            steps={[
              { target: 'account-chip', title: 'Switch account', body: 'Tap here to change your active trading account.', tipPosition: 'below' },
              { target: 'month-nav', title: 'Navigate months', body: 'Tap the arrows or swipe left / right to browse months.', tipPosition: 'below' },
              { target: 'calendar', title: 'Log a trade', body: 'Tap any day to record your P&L, add notes, and attach a screenshot.', tipPosition: 'above' },
            ]}
          />

          <AnimatePresence custom={direction} mode="popLayout" initial={false}>
            <motion.div
              key={month}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.28 }}
            >
              {/* Month navigation */}
              <div data-tour="month-nav">
                <MonthNav
                  month={month}
                  onPrev={() => { setDirection(-1); onMonthChange(shiftMonth(month, -1)) }}
                  onNext={() => { setDirection(1); onMonthChange(shiftMonth(month, 1)) }}
                />
              </div>

              {/* Hero */}
              <MonthHero data={journalData} currentBalance={activeAccount?.currentBalance} />

              {/* Calendar */}
              <div data-tour="calendar">
                <MonthCalendar
                  month={month}
                  days={journalData.days}
                  selectedDate={selectedDate}
                  onDayPress={onDayPress}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Recent days — tablet/desktop only: stacked below the calendar at
            md, beside it at lg. Mobile already has per-day detail via the
            sheet. Starts level with MonthNav now that the header sits above
            the split, instead of level with the page title. */}
        <aside className="hidden px-5 md:mt-6 md:block lg:w-80 lg:shrink-0 lg:pl-0">
          <RecentDaysPanel days={journalData.days} selectedDate={selectedDate} onDayPress={onDayPress} />
        </aside>
      </div>
    </div>
  )
}
