'use client'

import { UserCircle, Users, Calendar, Hash, Building } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROLE_STYLES = {
  admin:  { dot: 'bg-[#818cf8]', badge: 'text-[#818cf8] bg-[#1e1b4b] border-[#4f46e5]/30' },
  user: { dot: 'bg-[#34d399]', badge: 'text-[#34d399] bg-[#064e3b] border-[#10b981]/30' },
}

function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#1a1a1a] last:border-0">
      <Icon size={13} className="text-[#6b7280] shrink-0" />
      <span className="text-xs text-[#6b7280] w-24 shrink-0">{label}</span>
      <span className="text-xs text-[#f5f5f5] truncate font-medium">{value}</span>
    </div>
  )
}

export default function ProfilePanel({ user, onGoToUsers }) {
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-[#161616] border border-[#262626] flex items-center justify-center">
            <UserCircle size={36} className="text-[#2a2a2a]" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1c1c1c] border border-[#333333] flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-[#6b7280]" />
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#a3a3a3]">No active user</p>
          <p className="text-xs text-[#6b7280] mt-1.5 max-w-xs leading-relaxed">
            Create a local user and activate them to set up your profile.
          </p>
        </div>
        <button
          onClick={onGoToUsers}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1e1b4b] border border-[#4f46e5]/40 text-[#818cf8] text-sm font-medium rounded-[10px] hover:bg-[#4f46e5] hover:text-white hover:border-[#4f46e5] transition-all"
        >
          <Users size={14} />
          Manage Users
        </button>
      </div>
    )
  }

  const role   = user.role ?? 'user'
  const styles = ROLE_STYLES[role] ?? ROLE_STYLES.user

  return (
    <div className="flex flex-col gap-4">
      {/* Avatar card */}
      <div className="relative flex items-center gap-5 p-5 bg-[#161616] border border-[#262626] rounded-[12px] overflow-hidden">
        {/* Subtle glow */}
        <div
          className="absolute -top-8 -left-8 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none"
          style={{ backgroundColor: ROLE_STYLES[role]?.dot.replace('bg-', '') ?? '#818cf8' }}
        />

        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-full bg-[#1e1b4b] border-2 border-[#4f46e5]/40 flex items-center justify-center text-2xl font-bold text-[#818cf8]">
            {user.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <span className={cn('absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#161616]', styles.dot)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base font-bold text-[#f5f5f5] truncate">{user.name}</h2>
            <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider', styles.badge)}>
              {role}
            </span>
          </div>
          <p className="text-sm text-[#a3a3a3] mt-0.5 truncate">{user.email}</p>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 text-[10px] font-semibold text-[#10b981] bg-[#064e3b] border border-[#10b981]/30 px-2.5 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
          Active
        </div>
      </div>

      {/* Meta grid */}
      <div className="p-4 bg-[#161616] border border-[#262626] rounded-[12px]">
        <MetaRow icon={Hash}      label="User ID"      value={user.id} />
        <MetaRow icon={Building}  label="Role"         value={role.charAt(0).toUpperCase() + role.slice(1)} />
        <MetaRow icon={Calendar}  label="Created"      value={new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
      </div>
    </div>
  )
}
