'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Layers, Settings, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

const IS_CONNECT = process.env.NEXT_PUBLIC_IS_CONNECT === 'true'
const ADMIN_URL  = process.env.NEXT_PUBLIC_ADMIN_URL  || ''

const BASE_NAV = [
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Header() {
  const pathname = usePathname()

  const nav = IS_CONNECT && ADMIN_URL
    ? [...BASE_NAV, { href: ADMIN_URL, label: 'Admin', icon: LayoutDashboard, external: true }]
    : BASE_NAV

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center border-b border-[var(--lt-divider)] bg-[var(--lt-bg-base)]/90 backdrop-blur-md px-4">
      <div className="flex items-center gap-3 flex-1">
        <Link href="/files" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-[8px] bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/40 flex items-center justify-center text-[var(--lt-accent-light)]">
            <Layers size={16} />
          </div>
          <span className="text-sm tracking-tight">
            <span className="font-bold text-[var(--lt-text-muted)]">Arshanemi </span>
            <span className="font-bold text-[var(--lt-accent)]">MultiImageLink</span>
          </span>
        </Link>
      </div>

      <nav className="flex items-center gap-1">
        {nav.map(({ href, label, icon: Icon, external }) => (
          <Link
            key={href}
            href={href}
            title={label}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-sm transition-colors',
              !external && pathname?.startsWith(href)
                ? 'text-[var(--lt-accent-light)] bg-[var(--lt-accent-muted)]'
                : 'text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] hover:bg-[var(--lt-card-hover)]'
            )}
          >
            {Icon && <Icon size={14} />}
            <span className="hidden sm:inline">{label}</span>
          </Link>
        ))}
      </nav>
    </header>
  )
}
