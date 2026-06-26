'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Layers, Settings } from 'lucide-react'
import { isLoggedIn } from '@/lib/tokenStore'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export default function Header() {
  const pathname = usePathname()
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => { setLoggedIn(isLoggedIn()) }, [])

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center border-b border-[var(--lt-divider)] bg-[var(--lt-bg-base)]/90 backdrop-blur-md px-4">
      <div className="flex items-center gap-3 flex-1">
        <Link href="/files" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-[8px] bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/40 flex items-center justify-center">
            <Layers size={16} className="text-[var(--lt-accent-light)]" />
          </div>
          <span className="font-semibold text-[var(--lt-text-primary)] text-sm tracking-tight">
            MultiImage<span className="text-[var(--lt-accent)]">Link</span>
          </span>
        </Link>

        <span className="text-[var(--lt-divider-light)] hidden sm:inline">/</span>
        <span className="text-[var(--lt-text-subtle)] text-sm hidden sm:inline">File Manager</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-px h-4 bg-[var(--lt-divider)] hidden md:block" />

        <Link
          href="/settings"
          title="Settings"
          className={cn(
            'p-1.5 rounded-[6px] transition-colors',
            pathname?.startsWith('/settings')
              ? 'text-[var(--lt-accent-light)] bg-[var(--lt-accent-muted)]'
              : 'text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] hover:bg-[var(--lt-card-hover)]'
          )}
        >
          <Settings size={15} />
        </Link>

        <div className="w-7 h-7 rounded-full bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/30 flex items-center justify-center relative">
          <span className="text-[10px] font-bold text-[var(--lt-accent-light)]">
            {loggedIn ? '✓' : 'A'}
          </span>
          {loggedIn && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#10b981] rounded-full border border-[var(--lt-bg-base)]" />
          )}
        </div>
      </div>
    </header>
  )
}
