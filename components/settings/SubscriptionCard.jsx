'use client'

import { CheckCircle, XCircle, AlertTriangle, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_UI = {
  active:    { color: 'text-[#10b981]', bg: 'bg-[#064e3b]', border: 'border-[#10b981]/30', icon: CheckCircle,   label: 'Active'    },
  inactive:  { color: 'text-[var(--lt-text-subtle)]', bg: 'bg-[var(--lt-card-hover)]', border: 'border-[var(--lt-divider-light)]',   icon: XCircle,       label: 'Inactive'  },
  past_due:  { color: 'text-[#f59e0b]', bg: 'bg-[#451a03]', border: 'border-[#f59e0b]/30', icon: AlertTriangle, label: 'Past Due'  },
  cancelled: { color: 'text-[#ef4444]', bg: 'bg-[#450a0a]', border: 'border-[#ef4444]/30', icon: XCircle,       label: 'Cancelled' },
  trialing:  { color: 'text-[var(--lt-accent-light)]', bg: 'bg-[var(--lt-accent-muted)]', border: 'border-[var(--lt-accent)]/30', icon: CheckCircle,   label: 'Trial'     },
}

export default function SubscriptionCard({ subscription }) {
  const ui = STATUS_UI[subscription?.status] ?? STATUS_UI.inactive
  const StatusIcon = ui.icon

  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-[10px] border', ui.bg, ui.border)}>
      <StatusIcon size={16} className={cn(ui.color, 'mt-0.5 shrink-0')} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-sm font-semibold', ui.color)}>
            {ui.label}
            {subscription?.plan ? ` — ${subscription.plan}` : ''}
          </span>
          {subscription?.planId && (
            <span className="flex items-center gap-1 text-[10px] text-[var(--lt-accent-light)] bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/30 px-2 py-0.5 rounded-full ml-auto shrink-0">
              <Crown size={9} />
              {subscription.planId}
            </span>
          )}
        </div>

        {subscription?.currentPeriodEnd && (
          <p className="text-xs text-[var(--lt-text-subtle)] mt-1">
            {subscription.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} on{' '}
            {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        )}

        {!subscription?.plan && subscription?.status !== 'active' && (
          <p className="text-xs text-[var(--lt-text-subtle)] mt-1">No active subscription</p>
        )}
      </div>
    </div>
  )
}
