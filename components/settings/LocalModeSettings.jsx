'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, Users, Palette, Crown, WifiOff, CheckCircle, Building2 } from 'lucide-react'
import {
  getUsers, getActiveUserId, getActiveUser,
  getLocalSubscription, getCompanies,
} from '@/lib/localStore'
import ProfilePanel     from './local/ProfilePanel'
import UsersPanel       from './local/UsersPanel'
import ThemePanel       from './local/ThemePanel'
import CompanyPanel     from './local/CompanyPanel'
import SubscriptionCard from './SubscriptionCard'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'profile',      label: 'Profile',      icon: User      },
  { id: 'company',      label: 'Company',      icon: Building2 },
  { id: 'users',        label: 'Users',         icon: Users     },
  { id: 'theme',        label: 'Theme',         icon: Palette   },
  // { id: 'subscription', label: 'Subscription',  icon: Crown     },
]

function Section({ title, action, children }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[var(--lt-divider)] pb-2.5">
        <h3 className="text-sm font-bold text-[var(--lt-text-primary)]">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

export default function LocalModeSettings() {
  const [tab,          setTab]      = useState('profile')
  const [users,        setUsers]    = useState([])
  const [companies,    setCompanies] = useState([])
  const [activeUserId, setAUID]     = useState(null)
  const [activeUser,   setAU]       = useState(null)

  const sub = getLocalSubscription()

  const refresh = useCallback(() => {
    setUsers(getUsers())
    setCompanies(getCompanies())
    setAUID(getActiveUserId())
    setAU(getActiveUser())
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return (
    <div className="h-full overflow-y-auto">
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-[22px] font-bold text-[var(--lt-text-primary)] tracking-tight">Settings</h1>
            <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase text-[#f59e0b] bg-[#1a1100] border border-[#f59e0b]/25 px-2.5 py-1 rounded-full">
              <WifiOff size={8} />
              Local Mode
            </span>
          </div>
          <p className="text-sm text-[var(--lt-text-subtle)]">
            Offline · No admin API · Data stored in browser
          </p>
        </div>

        {/* Active user pill */}
        {activeUser && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/30 rounded-full shrink-0">
            <div className="w-5 h-5 rounded-full bg-[var(--lt-accent)] flex items-center justify-center text-[9px] font-bold text-white">
              {activeUser.name[0].toUpperCase()}
            </div>
            <span className="text-xs font-medium text-[var(--lt-accent-light)] truncate max-w-[120px]">
              {activeUser.name}
            </span>
            <CheckCircle size={11} className="text-[#10b981] shrink-0" />
          </div>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 p-1 bg-[var(--lt-bg-base)] border border-[var(--lt-divider)] rounded-[12px] mb-7">
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[9px] text-xs font-semibold transition-all',
                active
                  ? 'bg-[var(--lt-accent)] text-white shadow-sm'
                  : 'text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-muted)] hover:bg-[var(--lt-card)]'
              )}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Tab content ── */}
      <div className="flex flex-col gap-6">

        {/* Profile */}
        {tab === 'profile' && (
          <Section title="Active Profile">
            <ProfilePanel
              user={activeUser}
              onGoToUsers={() => setTab('users')}
            />
          </Section>
        )}

        {/* Company CRUD */}
        {tab === 'company' && (
          <Section title="Local Companies">
            <CompanyPanel
              companies={companies}
              onRefresh={refresh}
            />
          </Section>
        )}

        {/* Users CRUD */}
        {tab === 'users' && (
          <Section title="Local Users">
            <UsersPanel
              users={users}
              companies={companies}
              activeUserId={activeUserId}
              onRefresh={refresh}
            />
          </Section>
        )}

        {/* Theme */}
        {tab === 'theme' && (
          <Section title="Theme">
            <ThemePanel />
          </Section>
        )}

        {/* Subscription */}
        {tab === 'subscription' && (
          <Section title="Subscription">
            <div className="flex flex-col gap-3">
              {/* Subscription features */}
              <div className="p-4 bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/25 rounded-[12px]">
                <div className="flex items-center gap-2 mb-3">
                  <Crown size={14} className="text-[var(--lt-accent-light)]" />
                  <span className="text-sm font-bold text-[var(--lt-accent-light)]">Pro Plan</span>
                  <span className="ml-auto text-[10px] font-bold text-[#10b981] bg-[#064e3b] border border-[#10b981]/30 px-2 py-0.5 rounded-full">
                    1-Year Local
                  </span>
                </div>
                <ul className="grid grid-cols-2 gap-1.5">
                  {[
                    '50 GB storage',
                    'Unlimited uploads',
                    'Bulk URL export',
                    'Priority support',
                    'API access',
                    'Local JSON users',
                  ].map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-[var(--lt-text-muted)]">
                      <CheckCircle size={11} className="text-[#10b981] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Status card */}
              <SubscriptionCard subscription={sub} />

              {/* Local note */}
              <div className="flex items-start gap-2.5 p-3 bg-[var(--lt-bg-base)] border border-[var(--lt-divider)] rounded-[10px]">
                <WifiOff size={12} className="text-[var(--lt-text-subtle)] mt-0.5 shrink-0" />
                <p className="text-[10px] text-[var(--lt-text-subtle)] leading-relaxed">
                  You're in <span className="text-[var(--lt-text-subtle)]">Local Mode</span>. This Pro plan is a local default
                  valid for 1 year from today. Connect to the admin API to manage real subscriptions.
                </p>
              </div>
            </div>
          </Section>
        )}

      </div>
    </div>
    </div>
  )
}
