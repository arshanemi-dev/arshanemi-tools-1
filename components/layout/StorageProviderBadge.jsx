'use client'

import { useState, useEffect, useRef } from 'react'
import { Cloud, Zap, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStorageProvider } from '@/hooks/useStorageProvider'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

const PROVIDER_META = {
  dropbox: { label: 'Dropbox', icon: Cloud, color: '#0061fe' },
  bunny:   { label: 'Bunny.net', icon: Zap, color: '#ff7a00' },
}

export default function StorageProviderBadge() {
  const [open, setOpen]                   = useState(false)
  const [confirmTarget, setConfirmTarget] = useState(null)
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
    setOpen(false)
    setConfirmTarget(provider)
  }

  function confirmSwitch() {
    switchProvider(confirmTarget)
    // Hard reload so every already-loaded file list, upload target, and
    // provider-dependent view picks up the new backend instead of mixing
    // stale data from the old one with fresh calls to the new one.
    window.location.reload()
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
        </div>
      )}

      <Modal open={!!confirmTarget} onClose={() => setConfirmTarget(null)} title="Switch active storage?" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--lt-text-muted)] leading-relaxed">
            Switch active storage to{' '}
            <span className="font-semibold text-[var(--lt-text-primary)]">{PROVIDER_META[confirmTarget]?.label}</span>?
            This is saved to this browser only — new folders and uploads you make will go there from now on.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmTarget(null)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={confirmSwitch}>OK</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
