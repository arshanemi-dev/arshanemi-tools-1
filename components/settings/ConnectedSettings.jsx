'use client'

import { useState, useEffect, useCallback } from 'react'
import { LogOut, User, CreditCard, RefreshCw, Wifi } from 'lucide-react'
import { isLoggedIn, clearAuthTokens } from '@/lib/tokenStore'
import { fetchUser, fetchSubscription, DUMMY_USER, DUMMY_SUBSCRIPTION } from '@/lib/adminData'
import LoginForm        from '@/components/settings/LoginForm'
import SubscriptionCard from '@/components/settings/SubscriptionCard'
import Spinner from '@/components/ui/Spinner'
import Button  from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'account',      label: 'Account',      icon: User       },
  { id: 'subscription', label: 'Subscription',  icon: CreditCard },
]

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold text-[#f5f5f5] border-b border-[#1a1a1a] pb-2.5">{title}</h3>
      {children}
    </div>
  )
}

function UserCard({ user }) {
  return (
    <div className="flex items-center gap-4 p-5 bg-[#161616] border border-[#1e1e1e] rounded-[12px]">
      <div className="w-14 h-14 rounded-full bg-[#1e1b4b] border-2 border-[#4f46e5]/30 flex items-center justify-center text-xl font-bold text-[#818cf8] shrink-0">
        {user.name?.[0]?.toUpperCase() ?? 'U'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-[#f5f5f5] truncate">{user.name}</p>
          <span className="px-2 py-0.5 rounded-full bg-[#1e1b4b] text-[#818cf8] text-[9px] font-bold border border-[#4f46e5]/30 uppercase">
            {user.role}
          </span>
        </div>
        <p className="text-sm text-[#a3a3a3] mt-0.5 truncate">{user.email}</p>
        {user.mobile && <p className="text-xs text-[#6b7280] mt-0.5">{user.mobile}</p>}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#1a1a1a] last:border-0">
      <span className="text-xs text-[#6b7280] w-28 shrink-0">{label}</span>
      <span className="text-sm text-[#f5f5f5] flex-1 truncate font-medium">{value ?? '—'}</span>
    </div>
  )
}

export default function ConnectedSettings() {
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
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-[22px] font-bold text-[#f5f5f5] tracking-tight">Settings</h1>
            <span className={cn(
              'flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full',
              loggedIn
                ? 'text-[#10b981] bg-[#064e3b]/50 border border-[#10b981]/25'
                : 'text-[#6b7280] bg-[#1c1c1c] border border-[#333333]'
            )}>
              <Wifi size={8} />
              {loggedIn ? 'Connected' : 'Not signed in'}
            </span>
          </div>
          <p className="text-sm text-[#4a4a4a]">
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
      <div className="flex gap-1 p-1 bg-[#0f0f0f] border border-[#1a1a1a] rounded-[12px] mb-7">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[9px] text-xs font-semibold transition-all',
                tab === t.id
                  ? 'bg-[#4f46e5] text-white shadow-sm'
                  : 'text-[#4a4a4a] hover:text-[#a3a3a3] hover:bg-[#161616]'
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
                  <div className="bg-[#161616] border border-[#1e1e1e] rounded-[12px] px-4 py-1">
                    <InfoRow label="User ID"      value={user.id} />
                    <InfoRow label="Company"      value={user.company} />
                    <InfoRow label="Member since" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : null} />
                    <InfoRow label="Status"       value={user.is_active ? 'Active' : 'Inactive'} />
                  </div>
                </Section>
              )}

              <Section title="Admin API">
                <div className="bg-[#161616] border border-[#1e1e1e] rounded-[12px] px-4 py-1">
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
                <p className="text-xs text-[#6b7280] bg-[#0f0f0f] border border-[#1a1a1a] rounded-[8px] px-3 py-2 mb-1">
                  Sign in on the Account tab to view your subscription.
                </p>
              )}
              <SubscriptionCard subscription={subscription} />
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
              'bg-[#1e1b4b] text-[#818cf8] border border-[#4f46e5]/30'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
