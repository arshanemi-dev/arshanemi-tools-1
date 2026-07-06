'use client'

import { useState, useEffect } from 'react'
import {
  User, Mail, Shield, Calendar, Crown, Palette,
  CheckCircle, XCircle, Clock, AlertTriangle,
  Moon, Sun, Type, Sliders,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getStoredUser } from '@/lib/tokenStore'
import { fetchSubscription, DUMMY_SUBSCRIPTION } from '@/lib/adminData'
import { useTheme } from '@/context/ThemeContext'

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active:    { label: 'Active',    icon: CheckCircle,    cls: 'text-[#10b981] bg-[#064e3b] border-[#10b981]/30' },
  inactive:  { label: 'Inactive',  icon: XCircle,        cls: 'text-[var(--lt-text-subtle)] bg-[var(--lt-card)] border-[var(--lt-divider)]' },
  past_due:  { label: 'Past Due',  icon: AlertTriangle,  cls: 'text-[#f59e0b] bg-[#451a03] border-[#f59e0b]/30' },
  cancelled: { label: 'Cancelled', icon: XCircle,        cls: 'text-[#ef4444] bg-[#450a0a] border-[#ef4444]/30' },
  trialing:  { label: 'Trial',     icon: Clock,          cls: 'text-[var(--lt-accent-light)] bg-[var(--lt-accent-muted)] border-[var(--lt-accent)]/30' },
}

function StatusBadge({ status }) {
  const cfg  = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive
  const Icon = cfg.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider', cfg.cls)}>
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-[var(--lt-divider)] pb-2.5">
        <Icon size={15} className="text-[var(--lt-accent)]" />
        <h3 className="text-sm font-bold text-[var(--lt-text-primary)]">{title}</h3>
      </div>
      {children}
    </div>
  )
}

// ── Meta row ──────────────────────────────────────────────────────────────────

function MetaRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--lt-divider)] last:border-0">
      <Icon size={13} className="text-[var(--lt-text-subtle)] shrink-0" />
      <span className="text-xs text-[var(--lt-text-subtle)] w-28 shrink-0">{label}</span>
      <span className="text-xs text-[var(--lt-text-primary)] font-medium flex-1">{children}</span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ConnectedSettings() {
  const { theme } = useTheme()
  const [authUser,     setAuthUser]     = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [subLoading,   setSubLoading]   = useState(true)
  const [subError,     setSubError]     = useState('')

  useEffect(() => {
    setAuthUser(getStoredUser())

    fetchSubscription()
      .then(data => {
        if (!data || data === DUMMY_SUBSCRIPTION) {
          setSubError('Could not load subscription')
        } else {
          setSubscription(data)
        }
      })
      .catch(() => setSubError('Could not load subscription'))
      .finally(() => setSubLoading(false))
  }, [])

  const roleLabel = authUser?.role
    ? authUser.role.charAt(0).toUpperCase() + authUser.role.slice(1)
    : '—'

  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  const currentMode   = theme?.mode ?? 'dark'
  const currentColors = theme?.[currentMode] ?? {}

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Page title */}
        <div>
          <h1 className="text-[22px] font-bold text-[var(--lt-text-primary)] tracking-tight">Settings</h1>
          <p className="text-sm text-[var(--lt-text-subtle)] mt-1">Connected mode — managed by admin panel</p>
        </div>

        {/* ── Current User ── */}
        <Section title="Current User" icon={User}>
          {!authUser ? (
            <p className="text-xs text-[var(--lt-text-subtle)] italic">No user data available.</p>
          ) : (
            <div className="bg-[var(--lt-card)] border border-[var(--lt-divider)] rounded-[12px] overflow-hidden">
              {/* Avatar bar */}
              <div className="flex items-center gap-4 p-4 bg-[var(--lt-accent-muted)] border-b border-[var(--lt-divider)]">
                <div className="w-12 h-12 rounded-full bg-[var(--lt-accent)] flex items-center justify-center text-lg font-bold text-white shrink-0">
                  {(authUser.name?.[0] ?? authUser.email?.[0] ?? '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--lt-text-primary)] truncate">{authUser.name || '—'}</p>
                  <p className="text-xs text-[var(--lt-text-muted)] truncate mt-0.5">{authUser.email || '—'}</p>
                </div>
                <span className={cn(
                  'px-2 py-1 rounded-full text-[9px] font-bold border uppercase tracking-wider shrink-0',
                  authUser.role === 'admin'
                    ? 'text-[var(--lt-accent-light)] bg-[var(--lt-accent-muted)] border-[var(--lt-accent)]/30'
                    : 'text-[#10b981] bg-[#064e3b] border-[#10b981]/30'
                )}>
                  {authUser.role ?? 'user'}
                </span>
              </div>

              {/* Meta rows */}
              <div className="px-4">
                <MetaRow icon={Mail}   label="Email">{authUser.email || '—'}</MetaRow>
                <MetaRow icon={Shield} label="Role">{roleLabel}</MetaRow>
                {authUser.id && (
                  <MetaRow icon={User} label="User ID">
                    <span className="font-mono text-[var(--lt-text-subtle)]">{authUser.id}</span>
                  </MetaRow>
                )}
              </div>
            </div>
          )}
        </Section>

        {/* ── Current Plan ── */}
        <Section title="Current Plan" icon={Crown}>
          {subLoading ? (
            <div className="flex items-center gap-2 py-6 text-xs text-[var(--lt-text-subtle)]">
              <div className="w-3.5 h-3.5 border-2 border-[var(--lt-divider-light)] border-t-[var(--lt-accent)] rounded-full animate-spin" />
              Loading plan…
            </div>
          ) : subError ? (
            <p className="text-xs text-[#ef4444] bg-[#450a0a] border border-[#ef4444]/30 rounded-[8px] px-3 py-2.5">
              {subError}
            </p>
          ) : !subscription ? (
            <p className="text-xs text-[var(--lt-text-subtle)] italic">No subscription data.</p>
          ) : (
            <div className="bg-[var(--lt-card)] border border-[var(--lt-divider)] rounded-[12px] overflow-hidden">
              {/* Plan header */}
              <div className="flex items-center justify-between p-4 bg-[var(--lt-accent-muted)] border-b border-[var(--lt-divider)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[8px] bg-[var(--lt-accent)]/20 border border-[var(--lt-accent)]/30 flex items-center justify-center">
                    <Crown size={16} className="text-[var(--lt-accent-light)]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--lt-text-primary)]">
                      {subscription.plan ?? 'Free'}
                    </p>
                    {subscription.planDetails?.price != null && (
                      <p className="text-xs text-[var(--lt-text-subtle)] mt-0.5">
                        ₹{subscription.planDetails.price} / {subscription.planDetails.interval ?? 'month'}
                      </p>
                    )}
                  </div>
                </div>
                <StatusBadge status={subscription.status ?? 'inactive'} />
              </div>

              {/* Plan details */}
              <div className="px-4">
                {periodEnd && (
                  <MetaRow icon={Calendar} label="Renews on">{periodEnd}</MetaRow>
                )}
                {subscription.cancelAtPeriodEnd && (
                  <MetaRow icon={AlertTriangle} label="Notice">
                    <span className="text-[#f59e0b]">Cancels at period end</span>
                  </MetaRow>
                )}
                {subscription.planDetails?.features?.length > 0 && (
                  <div className="py-3 flex flex-col gap-2">
                    {subscription.planDetails.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-[var(--lt-text-muted)]">
                        <CheckCircle size={11} className="text-[#10b981] shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Section>

        {/* ── Theme & Appearance ── */}
        <Section title="Theme & Appearance" icon={Palette}>
          <div className="bg-[var(--lt-card)] border border-[var(--lt-divider)] rounded-[12px] px-4">

            {/* Color mode */}
            <div className="flex items-center gap-3 py-3 border-b border-[var(--lt-divider)]">
              {currentMode === 'dark'
                ? <Moon size={13} className="text-[var(--lt-text-subtle)] shrink-0" />
                : <Sun  size={13} className="text-[var(--lt-text-subtle)] shrink-0" />}
              <span className="text-xs text-[var(--lt-text-subtle)] w-28 shrink-0">Color Mode</span>
              <span className="text-xs font-medium text-[var(--lt-text-primary)] capitalize">
                {currentMode}
              </span>
            </div>

            {/* Accent color */}
            <div className="flex items-center gap-3 py-3 border-b border-[var(--lt-divider)]">
              <div
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{ backgroundColor: currentColors.accent ?? 'var(--lt-accent)' }}
              />
              <span className="text-xs text-[var(--lt-text-subtle)] w-28 shrink-0">Accent Colour</span>
              <span className="text-xs font-medium text-[var(--lt-text-primary)] font-mono">
                {currentColors.accent ?? '—'}
              </span>
            </div>

            {/* Font family */}
            <div className="flex items-center gap-3 py-3 border-b border-[var(--lt-divider)]">
              <Type size={13} className="text-[var(--lt-text-subtle)] shrink-0" />
              <span className="text-xs text-[var(--lt-text-subtle)] w-28 shrink-0">Font Family</span>
              <span
                className="text-xs font-medium text-[var(--lt-text-primary)]"
                style={{ fontFamily: theme?.fontFamily && theme.fontFamily !== 'System' ? `'${theme.fontFamily}', sans-serif` : 'inherit' }}
              >
                {theme?.fontFamily ?? 'System'}
              </span>
            </div>

            {/* Font scale */}
            <div className="flex items-center gap-3 py-3">
              <Sliders size={13} className="text-[var(--lt-text-subtle)] shrink-0" />
              <span className="text-xs text-[var(--lt-text-subtle)] w-28 shrink-0">Font Scale</span>
              <span className="text-xs font-medium text-[var(--lt-text-primary)]">
                {((theme?.fontScale ?? 1) * 100).toFixed(0)}%
              </span>
            </div>

          </div>
        </Section>

      </div>
    </div>
  )
}
