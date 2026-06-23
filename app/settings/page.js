'use client'

import { useState, useEffect, useCallback } from 'react'
import { LogOut, User, CreditCard, Layers, RefreshCw } from 'lucide-react'
import { isLoggedIn, getStoredUser, clearAuthTokens } from '@/lib/tokenStore'
import { fetchUser, fetchSubscription, fetchPlans, DUMMY_PLANS, DUMMY_USER, DUMMY_SUBSCRIPTION } from '@/lib/adminData'
import LoginForm      from '@/components/settings/LoginForm'
import SubscriptionCard from '@/components/settings/SubscriptionCard'
import Spinner from '@/components/ui/Spinner'
import Button  from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'account',      label: 'Account',      icon: User        },
  { id: 'subscription', label: 'Subscription',  icon: CreditCard  },
]

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-[#f5f5f5] border-b border-[#262626] pb-2">{title}</h3>
      {children}
    </div>
  )
}

function UserCard({ user }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-[#161616] border border-[#262626] rounded-[10px]">
      <div className="w-12 h-12 rounded-full bg-[#1e1b4b] border border-[#4f46e5]/30 flex items-center justify-center text-lg font-bold text-[#818cf8] shrink-0">
        {user.name?.[0]?.toUpperCase() ?? 'U'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#f5f5f5] truncate">{user.name}</p>
        <p className="text-sm text-[#a3a3a3] truncate">{user.email}</p>
        {user.mobile && <p className="text-xs text-[#6b7280]">{user.mobile}</p>}
      </div>
      <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#1e1b4b] text-[#818cf8] text-xs font-medium border border-[#4f46e5]/30">
        {user.role}
      </span>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-[#262626] last:border-0">
      <span className="text-xs text-[#6b7280] w-28 shrink-0">{label}</span>
      <span className="text-sm text-[#f5f5f5] flex-1 truncate">{value ?? '—'}</span>
    </div>
  )
}

export default function SettingsPage() {
  const [tab,          setTab]          = useState('account')
  const [loggedIn,     setLoggedIn]     = useState(false)
  const [user,         setUser]         = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [plans,        setPlans]        = useState(DUMMY_PLANS)
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
      const [u, sub, pl] = await Promise.all([fetchUser(), fetchSubscription(), fetchPlans()])
      setUser(u)
      setSubscription(sub)
      setPlans(pl)
    } else {
      setUser(DUMMY_USER)
      setSubscription(DUMMY_SUBSCRIPTION)
      setPlans(DUMMY_PLANS)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

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

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#f5f5f5]">Settings</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">
            {loggedIn ? 'Manage your account and subscription' : 'Using demo data — log in to sync with admin panel'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" icon={<RefreshCw size={13} />} onClick={loadData} disabled={loading}>
            Refresh
          </Button>
          {loggedIn && (
            <Button size="sm" variant="ghost" icon={<LogOut size={13} />} onClick={handleLogout} className="text-[#ef4444] hover:bg-[#450a0a]">
              Sign out
            </Button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-[#111111] border border-[#262626] rounded-[10px] mb-6">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 rounded-[8px] text-sm font-medium transition-all',
                tab === t.id
                  ? 'bg-[#4f46e5] text-white'
                  : 'text-[#6b7280] hover:text-[#f5f5f5] hover:bg-[#1c1c1c]'
              )}
            >
              <Icon size={14} />
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

          {/* ── Account tab ── */}
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
                  <div className="bg-[#161616] border border-[#262626] rounded-[10px] px-4 py-2">
                    <InfoRow label="User ID"    value={user.id} />
                    <InfoRow label="Company"    value={user.company} />
                    <InfoRow label="Member since" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : null} />
                    <InfoRow label="Status"     value={user.is_active ? 'Active' : 'Inactive'} />
                  </div>
                </Section>
              )}

              <Section title="Admin API">
                <div className="flex flex-col gap-1 p-4 bg-[#161616] border border-[#262626] rounded-[10px]">
                  <InfoRow label="API URL"  value={apiBase || 'Not configured'} />
                  <InfoRow label="Status"   value={loggedIn ? 'Connected' : apiBase ? 'Not logged in' : 'Not configured'} />
                </div>
              </Section>
            </>
          )}

          {/* ── Subscription tab ── */}
          {tab === 'subscription' && (
            <Section title={loggedIn ? 'Your Subscription' : 'Plans (demo)'}>
              {!loggedIn && (
                <div className="text-xs text-[#6b7280] bg-[#111111] border border-[#262626] rounded-[8px] px-3 py-2 mb-2">
                  Log in on the Account tab to manage your subscription.
                </div>
              )}
              <SubscriptionCard
                subscription={subscription}
                plans={plans}
                onRefresh={loadData}
                toast={toast}
              />
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
