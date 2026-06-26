'use client'

import { useState, useEffect, useCallback } from 'react'
import { LogOut, User, CreditCard, RefreshCw, Wifi, Palette } from 'lucide-react'
import { isLoggedIn, clearAuthTokens } from '@/lib/tokenStore'
import { fetchUser, fetchSubscription, DUMMY_USER, DUMMY_SUBSCRIPTION } from '@/lib/adminData'
import { useTheme } from '@/context/ThemeContext'
import LoginForm        from '@/components/settings/LoginForm'
import SubscriptionCard from '@/components/settings/SubscriptionCard'
import Spinner from '@/components/ui/Spinner'
import Button  from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'account',      label: 'Account',      icon: User       },
  { id: 'subscription', label: 'Subscription',  icon: CreditCard },
  { id: 'theme',        label: 'Theme',         icon: Palette    },
]

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold text-[var(--lt-text-primary)] border-b border-[var(--lt-divider)] pb-2.5">{title}</h3>
      {children}
    </div>
  )
}

function UserCard({ user }) {
  return (
    <div className="flex items-center gap-4 p-5 bg-[var(--lt-card)] border border-[var(--lt-divider)] rounded-[12px]">
      <div className="w-14 h-14 rounded-full bg-[var(--lt-accent-muted)] border-2 border-[var(--lt-accent)]/30 flex items-center justify-center text-xl font-bold text-[var(--lt-accent-light)] shrink-0">
        {user.name?.[0]?.toUpperCase() ?? 'U'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-[var(--lt-text-primary)] truncate">{user.name}</p>
          <span className="px-2 py-0.5 rounded-full bg-[var(--lt-accent-muted)] text-[var(--lt-accent-light)] text-[9px] font-bold border border-[var(--lt-accent)]/30 uppercase">
            {user.role}
          </span>
        </div>
        <p className="text-sm text-[var(--lt-text-muted)] mt-0.5 truncate">{user.email}</p>
        {user.mobile && <p className="text-xs text-[var(--lt-text-subtle)] mt-0.5">{user.mobile}</p>}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--lt-divider)] last:border-0">
      <span className="text-xs text-[var(--lt-text-subtle)] w-28 shrink-0">{label}</span>
      <span className="text-sm text-[var(--lt-text-primary)] flex-1 truncate font-medium">{value ?? '—'}</span>
    </div>
  )
}

export default function ConnectedSettings() {
  const { theme } = useTheme()
  const [tab,          setTab]          = useState('account')
  const [loggedIn,     setLoggedIn]     = useState(false)
  const [user,         setUser]         = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [toasts,       setToasts]       = useState([])

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    const li = isLoggedIn()
    setLoggedIn(li)
    if (li) {
      const [u, sub] = await Promise.all([fetchUser(), fetchSubscription()])
      setUser(u)
      setSubscription(sub)
    } else {
      setUser(DUMMY_USER)
      setSubscription(DUMMY_SUBSCRIPTION)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const onSuccess = () => loadData()
    window.addEventListener('auth:success', onSuccess)
    return () => window.removeEventListener('auth:success', onSuccess)
  }, [loadData])

  function handleLogout() {
    clearAuthTokens()
    setLoggedIn(false)
    setUser(DUMMY_USER)
    setSubscription(DUMMY_SUBSCRIPTION)
    toast('Logged out', 'info')
  }

  const apiBase = process.env.NEXT_PUBLIC_ADMIN_API_URL

  return (
    <div className="h-full overflow-y-auto">
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-[22px] font-bold text-[var(--lt-text-primary)] tracking-tight">Settings</h1>
            <span className={cn(
              'flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full',
              loggedIn
                ? 'text-[#10b981] bg-[#064e3b]/50 border border-[#10b981]/25'
                : 'text-[var(--lt-text-subtle)] bg-[var(--lt-card-hover)] border border-[var(--lt-divider-light)]'
            )}>
              <Wifi size={8} />
              {loggedIn ? 'Connected' : 'Not signed in'}
            </span>
          </div>
          <p className="text-sm text-[var(--lt-text-subtle)]">
            {loggedIn ? 'Manage your account and subscription' : 'Sign in to sync with admin panel'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" icon={<RefreshCw size={12} />} onClick={loadData} disabled={loading}>
            Refresh
          </Button>
          {loggedIn && (
            <Button size="sm" variant="ghost" icon={<LogOut size={12} />} onClick={handleLogout} className="text-[#ef4444] hover:bg-[#2a0a0a]">
              Sign out
            </Button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-[var(--lt-bg-base)] border border-[var(--lt-divider)] rounded-[12px] mb-7">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[9px] text-xs font-semibold transition-all',
                tab === t.id
                  ? 'bg-[var(--lt-accent)] text-white shadow-sm'
                  : 'text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-muted)] hover:bg-[var(--lt-card)]'
              )}
            >
              <Icon size={13} />
              {t.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* Account */}
          {tab === 'account' && (
            <>
              {!loggedIn && (
                <Section title="Sign in to Admin Panel">
                  <LoginForm onSuccess={(u) => { setUser(u); setLoggedIn(true); loadData() }} />
                </Section>
              )}

              {loggedIn && user && (
                <Section title="Profile">
                  <UserCard user={user} />
                  <div className="bg-[var(--lt-card)] border border-[var(--lt-divider)] rounded-[12px] px-4 py-1">
                    <InfoRow label="User ID"      value={user.id} />
                    <InfoRow label="Company"      value={user.company} />
                    <InfoRow label="Member since" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : null} />
                    <InfoRow label="Status"       value={user.is_active ? 'Active' : 'Inactive'} />
                  </div>
                </Section>
              )}

              <Section title="Admin API">
                <div className="bg-[var(--lt-card)] border border-[var(--lt-divider)] rounded-[12px] px-4 py-1">
                  <InfoRow label="API URL" value={apiBase || 'Not configured'} />
                  <InfoRow label="Status"  value={loggedIn ? 'Connected' : apiBase ? 'Not signed in' : 'Not configured'} />
                </div>
              </Section>
            </>
          )}

          {/* Subscription */}
          {tab === 'subscription' && (
            <Section title="Your Subscription">
              {!loggedIn && (
                <p className="text-xs text-[var(--lt-text-subtle)] bg-[var(--lt-bg-base)] border border-[var(--lt-divider)] rounded-[8px] px-3 py-2 mb-1">
                  Sign in on the Account tab to view your subscription.
                </p>
              )}
              <SubscriptionCard subscription={subscription} />
            </Section>
          )}

          {/* Theme */}
          {tab === 'theme' && (
            <Section title="Theme">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-2.5 p-3 bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/20 rounded-[10px]">
                  <Wifi size={13} className="text-[var(--lt-accent-light)] mt-0.5 shrink-0" />
                  <p className="text-xs text-[var(--lt-text-muted)] leading-relaxed">
                    Theme is synced from the admin panel. Font family, font scale, accent colors and
                    dark / light mode are all controlled by the admin theme settings.
                  </p>
                </div>

                {theme && (
                  <div className="bg-[var(--lt-card)] border border-[var(--lt-divider)] rounded-[12px] divide-y divide-[var(--lt-divider)]">
                    {[
                      { label: 'Mode',        value: theme.mode       || 'dark'  },
                      { label: 'Font family',  value: theme.fontFamily || 'Inter' },
                      { label: 'Font scale',   value: `${((theme.fontScale ?? 1) * 100).toFixed(0)}%` },
                      { label: 'Accent',       value: theme[theme.mode || 'dark']?.accent || '—', isColor: true },
                    ].map(({ label, value, isColor }) => (
                      <div key={label} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="text-xs text-[var(--lt-text-subtle)] w-28 shrink-0">{label}</span>
                        <div className="flex items-center gap-2">
                          {isColor && (
                            <span
                              className="inline-block w-3.5 h-3.5 rounded-full border border-[#ffffff15]"
                              style={{ backgroundColor: value }}
                            />
                          )}
                          <span className="text-sm text-[var(--lt-text-primary)] font-medium capitalize">{value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-[var(--lt-text-subtle)] leading-relaxed">
                  To change the theme, update it in the admin panel → Theme Settings.
                  Changes are cached for 10 minutes.
                </p>
              </div>
            </Section>
          )}

        </div>
      )}

      {/* Toast stack */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-2.5 rounded-[8px] text-sm font-medium shadow-xl pointer-events-auto animate-slideUp ${
              t.type === 'success' ? 'bg-[#064e3b] text-[#10b981] border border-[#10b981]/30' :
              t.type === 'error'   ? 'bg-[#450a0a] text-[#ef4444] border border-[#ef4444]/30' :
              'bg-[var(--lt-accent-muted)] text-[var(--lt-accent-light)] border border-[var(--lt-accent)]/30'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
    </div>
  )
}
