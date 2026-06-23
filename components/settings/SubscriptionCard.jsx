'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Crown, Zap, Building2, Check } from 'lucide-react'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { createSubscription, cancelSubscription } from '@/lib/adminData'
import { cn } from '@/lib/utils'

const STATUS_UI = {
  active:    { color: 'text-[#10b981]', bg: 'bg-[#064e3b]', border: 'border-[#10b981]/30', icon: CheckCircle,    label: 'Active'   },
  inactive:  { color: 'text-[#6b7280]', bg: 'bg-[#1c1c1c]', border: 'border-[#333333]',    icon: XCircle,        label: 'Inactive' },
  past_due:  { color: 'text-[#f59e0b]', bg: 'bg-[#451a03]', border: 'border-[#f59e0b]/30', icon: AlertTriangle,  label: 'Past Due' },
  cancelled: { color: 'text-[#ef4444]', bg: 'bg-[#450a0a]', border: 'border-[#ef4444]/30', icon: XCircle,        label: 'Cancelled'},
  trialing:  { color: 'text-[#818cf8]', bg: 'bg-[#1e1b4b]', border: 'border-[#4f46e5]/30', icon: CheckCircle,    label: 'Trial'   },
}

const PLAN_ICONS = { plan_free: Zap, plan_pro: Crown, plan_business: Building2 }

function PlanCard({ plan, current, onSelect, loading }) {
  const Icon      = PLAN_ICONS[plan.id] ?? Zap
  const isCurrent = current?.planId === plan.id && current?.status === 'active'

  return (
    <div className={cn(
      'relative flex flex-col gap-3 p-4 rounded-[10px] border transition-all',
      isCurrent
        ? 'bg-[#1e1b4b] border-[#4f46e5]/60'
        : 'bg-[#161616] border-[#262626] hover:border-[#333333]',
      plan.popular && !isCurrent && 'border-[#4f46e5]/30'
    )}>
      {plan.popular && !isCurrent && (
        <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-[#4f46e5] text-white text-[10px] font-bold rounded-full">
          POPULAR
        </span>
      )}

      <div className="flex items-center gap-2">
        <div className={cn('w-7 h-7 rounded-[6px] flex items-center justify-center', isCurrent ? 'bg-[#4f46e5]/30' : 'bg-[#1c1c1c]')}>
          <Icon size={14} className={isCurrent ? 'text-[#818cf8]' : 'text-[#6b7280]'} />
        </div>
        <span className="font-semibold text-sm text-[#f5f5f5]">{plan.name}</span>
        {isCurrent && <span className="ml-auto text-[10px] font-bold text-[#818cf8]">CURRENT</span>}
      </div>

      <div className="flex items-baseline gap-1">
        {plan.price === 0 ? (
          <span className="text-xl font-bold text-[#f5f5f5]">Free</span>
        ) : (
          <>
            <span className="text-xs text-[#6b7280]">₹</span>
            <span className="text-xl font-bold text-[#f5f5f5]">{plan.price.toLocaleString('en-IN')}</span>
            <span className="text-xs text-[#6b7280]">/{plan.interval}</span>
          </>
        )}
      </div>

      <ul className="flex flex-col gap-1.5">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-[#a3a3a3]">
            <Check size={11} className="text-[#10b981] mt-0.5 shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      {!isCurrent && (
        <Button
          size="sm"
          variant={plan.popular ? 'primary' : 'secondary'}
          disabled={loading}
          onClick={() => onSelect(plan)}
          className="mt-auto"
        >
          {loading ? <Spinner size="xs" /> : plan.price === 0 ? 'Use Free Plan' : 'Upgrade'}
        </Button>
      )}
    </div>
  )
}

export default function SubscriptionCard({ subscription, plans, onRefresh, toast }) {
  const [busy, setBusy] = useState(false)

  const ui = STATUS_UI[subscription?.status] ?? STATUS_UI.inactive
  const StatusIcon = ui.icon

  async function handleSelectPlan(plan) {
    setBusy(true)
    try {
      const result = await createSubscription(plan.id)
      if (result.paymentLink) {
        window.open(result.paymentLink, '_blank')
        toast?.('Redirecting to payment page…', 'info')
      } else {
        toast?.(`Switched to ${plan.name} plan`, 'success')
      }
      onRefresh?.()
    } catch (err) {
      toast?.(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleCancel() {
    if (!confirm('Cancel at end of current billing period?')) return
    setBusy(true)
    try {
      await cancelSubscription(true)
      toast?.('Subscription will cancel at period end', 'info')
      onRefresh?.()
    } catch (err) {
      toast?.(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Current status */}
      <div className={cn('flex items-start gap-3 p-4 rounded-[10px] border', ui.bg, ui.border)}>
        <StatusIcon size={16} className={cn(ui.color, 'mt-0.5 shrink-0')} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-semibold', ui.color)}>
              {ui.label}
              {subscription?.plan ? ` — ${subscription.plan}` : ''}
            </span>
          </div>
          {subscription?.currentPeriodEnd && (
            <p className="text-xs text-[#6b7280] mt-0.5">
              {subscription.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} on{' '}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
          {!subscription?.razorpaySubscriptionId && subscription?.status !== 'active' && (
            <p className="text-xs text-[#6b7280] mt-0.5">No active subscription</p>
          )}
        </div>

        {subscription?.status === 'active' && !subscription?.cancelAtPeriodEnd && (
          <Button size="xs" variant="ghost" onClick={handleCancel} disabled={busy} className="shrink-0 text-[#ef4444] hover:bg-[#450a0a]">
            Cancel
          </Button>
        )}
      </div>

      {/* Plans grid */}
      <div>
        <p className="text-xs text-[#6b7280] font-medium mb-3 uppercase tracking-wider">Available Plans</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              current={subscription}
              onSelect={handleSelectPlan}
              loading={busy}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
