'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Cloud, Zap, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStorageProvider } from '@/hooks/useStorageProvider'

const PROVIDER_META = {
  dropbox: { label: 'Dropbox', icon: Cloud, color: '#0061fe' },
  bunny:   { label: 'Bunny.net', icon: Zap, color: '#ff7a00' },
}

export default function StorageProviderBadge() {
  const [open, setOpen]           = useState(false)
  const { active, providers, switchProvider } = useStorageProvider()
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleSwitch(provider) {
    if (provider === active) { setOpen(false); return }
    if (!providers[provider]?.configured) return
    const ok = window.confirm(
      `Switch active storage to ${PROVIDER_META[provider].label}? This is saved to this browser only — new folders and uploads you make will go there from now on.`
    )
    if (!ok) return

    switchProvider(provider)
    setOpen(false)
  }

  if (!active) return null

  const meta = PROVIDER_META[active]
  const Icon = meta.icon

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Active storage provider"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-xs font-medium text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] hover:bg-[var(--lt-card-hover)] transition-colors"
      >
        <Icon size={13} style={{ color: meta.color }} />
        <span className="hidden sm:inline">{meta.label}</span>
        <ChevronDown size={11} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-60 bg-[var(--lt-card)] border border-[var(--lt-divider)] rounded-[10px] shadow-2xl shadow-black/60 p-1.5 z-[100]">
          <p className="px-2 py-1.5 text-[9px] font-bold text-[var(--lt-text-subtle)] uppercase tracking-wider">
            Storage Provider
          </p>

          {Object.entries(PROVIDER_META).map(([key, m]) => {
            const status   = providers[key] ?? { configured: false }
            const isActive = active === key
            const MIcon    = m.icon
            return (
              <button
                key={key}
                disabled={!status.configured && !isActive}
                onClick={() => handleSwitch(key)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-2 rounded-[7px] text-xs transition-colors text-left',
                  isActive
                    ? 'bg-[var(--lt-accent-muted)] text-[var(--lt-accent-light)]'
                    : 'text-[var(--lt-text-muted)] hover:bg-[var(--lt-card-hover)]',
                  !status.configured && !isActive && 'opacity-40 cursor-not-allowed'
                )}
              >
                <MIcon size={13} style={{ color: m.color }} className="shrink-0" />
                <span className="flex-1">{m.label}</span>
                {isActive && <Check size={12} />}
                {!status.configured && !isActive && (
                  <span className="text-[9px] text-[var(--lt-text-subtle)]">Not set up</span>
                )}
              </button>
            )
          })}

          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="block mt-1 px-2 py-1.5 text-[10px] text-[var(--lt-text-subtle)] hover:text-[var(--lt-accent-light)] border-t border-[var(--lt-divider)] transition-colors"
          >
            Manage in Settings →
          </Link>
        </div>
      )}
    </div>
  )
}
