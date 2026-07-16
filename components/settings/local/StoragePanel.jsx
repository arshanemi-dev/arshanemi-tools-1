'use client'

import { useState } from 'react'
import { Cloud, Zap, CheckCircle2, AlertTriangle, RefreshCw, FolderCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStorageProvider } from '@/hooks/useStorageProvider'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

const PROVIDER_META = {
  dropbox: {
    label: 'Dropbox', icon: Cloud, color: '#0061fe',
    hint: 'Set DROPBOX_APP_KEY, DROPBOX_APP_SECRET and DROPBOX_REFRESH_TOKEN (or fill in data/dropbox-tokens.json) in .env.local.',
  },
  bunny: {
    label: 'Bunny.net', icon: Zap, color: '#ff7a00',
    hint: 'Set BUNNY_STORAGE_ZONE and BUNNY_STORAGE_ACCESS_KEY in .env.local. Add BUNNY_PULL_ZONE_URL too, so uploaded files get public URLs.',
  },
}

async function callApi(body) {
  const res  = await fetch('/api/storage-provider', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export default function StoragePanel() {
  const { active, providers, loading, switchProvider } = useStorageProvider()
  const [switching, setSwitching]   = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [provisioning, setProvisioning]   = useState(false)
  const [message, setMessage]       = useState(null) // { type: 'success'|'error', text }

  function handleSwitch(provider) {
    setSwitching(provider)
    setMessage(null)
    switchProvider(provider)
    setMessage({
      type: 'success',
      text: `Switched active storage to ${PROVIDER_META[provider].label} — for this browser only. New folders and uploads you make will go there from now on.`,
    })
    setSwitching(null)
    setConfirmTarget(null)
  }

  async function handleProvision() {
    setProvisioning(true)
    setMessage(null)
    try {
      const data = await callApi({ action: 'provision-all', provider: active })
      setMessage({
        type: 'success',
        text: `Provisioned ${data.created}/${data.total} company & user folders on ${PROVIDER_META[active]?.label ?? 'the active provider'}${data.failed ? ` — ${data.failed} failed` : ''}.`,
      })
    } catch (e) {
      setMessage({ type: 'error', text: e.message })
    } finally {
      setProvisioning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-xs text-[var(--lt-text-subtle)]">
        <div className="w-3.5 h-3.5 border-2 border-[var(--lt-divider-light)] border-t-[var(--lt-accent)] rounded-full animate-spin" />
        Loading storage settings…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-[var(--lt-text-subtle)] leading-relaxed">
        Choose which service stores files for <span className="font-semibold text-[var(--lt-text-primary)]">this browser</span>.
        The choice is saved locally, not shared with other users — folders are created automatically on whichever provider is active here.
      </p>

      {message && (
        <div className={cn(
          'flex items-start gap-2 px-3 py-2.5 rounded-[8px] text-xs border',
          message.type === 'success'
            ? 'text-[#10b981] bg-[#064e3b] border-[#10b981]/30'
            : 'text-[#ef4444] bg-[#450a0a] border-[#ef4444]/30'
        )}>
          {message.type === 'success'
            ? <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
            : <AlertTriangle size={13} className="mt-0.5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(PROVIDER_META).map(([key, meta]) => {
          const status   = providers[key] ?? { configured: false }
          const isActive = active === key
          const Icon     = meta.icon
          return (
            <div
              key={key}
              className={cn(
                'flex flex-col gap-3 p-4 rounded-[12px] border transition-colors',
                isActive
                  ? 'bg-[var(--lt-accent-muted)] border-[var(--lt-accent)]/40'
                  : 'bg-[var(--lt-card)] border-[var(--lt-divider)]'
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0 border"
                  style={{ backgroundColor: `${meta.color}1a`, borderColor: `${meta.color}4d` }}
                >
                  <Icon size={16} style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--lt-text-primary)]">{meta.label}</p>
                    {isActive && <Badge variant="accent">Active</Badge>}
                  </div>
                  <p className={cn('text-[11px] mt-0.5 font-medium', status.configured ? 'text-[#10b981]' : 'text-[#f59e0b]')}>
                    {status.configured ? 'Configured' : 'Not configured'}
                  </p>
                </div>
              </div>

              {!status.configured && (
                <p className="text-[10px] text-[var(--lt-text-subtle)] leading-relaxed">{meta.hint}</p>
              )}

              {status.configured && key === 'bunny' && !status.publicUrlConfigured && (
                <p className="text-[10px] text-[#f59e0b] leading-relaxed">
                  BUNNY_PULL_ZONE_URL isn't set — uploads will work, but files won't have public URLs yet.
                </p>
              )}

              <Button
                size="sm"
                variant={isActive ? 'secondary' : 'primary'}
                disabled={isActive || !status.configured || switching === key}
                onClick={() => setConfirmTarget(key)}
              >
                {switching === key ? 'Switching…' : isActive ? 'Currently Active' : 'Set Active'}
              </Button>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between p-4 bg-[var(--lt-card)] border border-[var(--lt-divider)] rounded-[12px]">
        <div className="flex items-start gap-2.5">
          <FolderCheck size={15} className="text-[var(--lt-accent)] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[var(--lt-text-primary)]">Provision all folders now</p>
            <p className="text-[10px] text-[var(--lt-text-subtle)] mt-0.5 leading-relaxed">
              Optional — creates every company &amp; user's default folder on {PROVIDER_META[active]?.label ?? 'the active provider'} right
              away, instead of waiting for their next login.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0"
          icon={<RefreshCw size={12} className={provisioning ? 'animate-spin' : ''} />}
          disabled={provisioning}
          onClick={handleProvision}
        >
          {provisioning ? 'Working…' : 'Provision'}
        </Button>
      </div>

      <Modal open={!!confirmTarget} onClose={() => setConfirmTarget(null)} title="Switch active storage?" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--lt-text-muted)] leading-relaxed">
            This changes the storage backend for <span className="font-semibold text-[var(--lt-text-primary)]">this browser only</span>.
            New uploads and folders you make will go to{' '}
            <span className="font-semibold text-[var(--lt-text-primary)]">{PROVIDER_META[confirmTarget]?.label}</span> from now on.
            Existing files on the other provider are not moved automatically, and other people using this tool keep their own choice.
          </p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              className="flex-1"
              disabled={switching === confirmTarget}
              onClick={() => handleSwitch(confirmTarget)}
            >
              {switching === confirmTarget ? 'Switching…' : 'Confirm Switch'}
            </Button>
            <Button variant="secondary" onClick={() => setConfirmTarget(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
