'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, Users, Palette, Crown, WifiOff, CheckCircle, Building2 } from 'lucide-react'
import {
  getUsers, getActiveUserId, getActiveUser,
  getTheme, getLocalSubscription, getCompanies,
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
  { id: 'subscription', label: 'Subscription',  icon: Crown     },
]

function Section({ title, action, children }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-2.5">
        <h3 className="text-sm font-bold text-[#f5f5f5]">{title}</h3>
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
  const [theme,        setTheme]    = useState(null)

  const sub = getLocalSubscription()

  const refresh = useCallback(() => {
    setUsers(getUsers())
    setCompanies(getCompanies())
    setAUID(getActiveUserId())
    setAU(getActiveUser())
    setTheme(getTheme())
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-[22px] font-bold text-[#f5f5f5] tracking-tight">Settings</h1>
            <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase text-[#f59e0b] bg-[#1a1100] border border-[#f59e0b]/25 px-2.5 py-1 rounded-full">
              <WifiOff size={8} />
              Local Mode
            </span>
          </div>
          <p className="text-sm text-[#4a4a4a]">
            Offline · No admin API · Data stored in browser
          </p>
        </div>

        {/* Active user pill */}
        {activeUser && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#0f0f1a] border border-[#4f46e5]/30 rounded-full shrink-0">
            <div className="w-5 h-5 rounded-full bg-[#4f46e5] flex items-center justify-center text-[9px] font-bold text-white">
              {activeUser.name[0].toUpperCase()}
            </div>
            <span className="text-xs font-medium text-[#818cf8] truncate max-w-[120px]">
              {activeUser.name}
            </span>
            <CheckCircle size={11} className="text-[#10b981] shrink-0" />
          </div>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 p-1 bg-[#0f0f0f] border border-[#1a1a1a] rounded-[12px] mb-7">
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
                  ? 'bg-[#4f46e5] text-white shadow-sm'
                  : 'text-[#4a4a4a] hover:text-[#a3a3a3] hover:bg-[#161616]'
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
            <ThemePanel
              theme={theme}
              onThemeChange={t => setTheme(t)}
            />
          </Section>
        )}

        {/* Subscription */}
        {tab === 'subscription' && (
          <Section title="Subscription">
            <div className="flex flex-col gap-3">
              {/* Subscription features */}
              <div className="p-4 bg-[#0f0f1a] border border-[#4f46e5]/25 rounded-[12px]">
                <div className="flex items-center gap-2 mb-3">
                  <Crown size={14} className="text-[#818cf8]" />
                  <span className="text-sm font-bold text-[#818cf8]">Pro Plan</span>
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
                    <li key={f} className="flex items-center gap-2 text-xs text-[#a3a3a3]">
                      <CheckCircle size={11} className="text-[#10b981] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Status card */}
              <SubscriptionCard subscription={sub} />

              {/* Local note */}
              <div className="flex items-start gap-2.5 p-3 bg-[#0f0f0f] border border-[#1a1a1a] rounded-[10px]">
                <WifiOff size={12} className="text-[#4a4a4a] mt-0.5 shrink-0" />
                <p className="text-[10px] text-[#4a4a4a] leading-relaxed">
                  You're in <span className="text-[#6b7280]">Local Mode</span>. This Pro plan is a local default
                  valid for 1 year from today. Connect to the admin API to manage real subscriptions.
                </p>
              </div>
            </div>
          </Section>
        )}

      </div>
    </div>
  )
}
