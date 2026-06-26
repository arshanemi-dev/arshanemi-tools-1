'use client'

import { useState, useEffect } from 'react'
import { Key, Link2, Eye, EyeOff, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { getDropboxToken, setDropboxToken, clearDropboxToken, getAdminToken, setAdminToken, clearAdminToken } from '@/lib/tokenStore'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

function TokenField({ label, icon: Icon, value, onChange, onSave, onClear, saved, description }) {
  const [show, setShow] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => setDraft(value), [value])

  return (
    <div className="flex flex-col gap-3 p-4 bg-[var(--lt-card)] border border-[var(--lt-divider)] rounded-[10px]">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-[6px] bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/30 flex items-center justify-center shrink-0">
          <Icon size={13} className="text-[var(--lt-accent-light)]" />
        </div>
        <span className="text-sm font-medium text-[var(--lt-text-primary)]">{label}</span>
        {value && <CheckCircle size={13} className="text-[#10b981] ml-auto" />}
      </div>

      {description && (
        <p className="text-xs text-[var(--lt-text-subtle)]">{description}</p>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? 'text' : 'password'}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={value ? '••••••••••••••••' : 'Paste token here…'}
            className="w-full px-3 pr-9 py-2 bg-[var(--lt-surface)] border border-[var(--lt-divider-light)] rounded-[8px] text-sm text-[var(--lt-text-primary)] placeholder-[var(--lt-text-subtle)] focus:outline-none focus:border-[var(--lt-accent)] transition-colors font-mono"
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] transition-colors"
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <Button
          size="sm"
          variant="primary"
          disabled={!draft.trim() || draft === value}
          onClick={() => { onSave(draft.trim()); onChange(draft.trim()) }}
        >
          Save
        </Button>
        {value && (
          <Button
            size="sm"
            variant="ghost"
            icon={<Trash2 size={13} />}
            onClick={() => { onClear(); onChange('') }}
            title="Remove token"
          />
        )}
      </div>
    </div>
  )
}

export default function TokenSetup({ onTokenChange }) {
  const [dropboxToken, setDropboxTokenState] = useState('')
  const [adminToken,   setAdminTokenState]   = useState('')

  useEffect(() => {
    setDropboxTokenState(getDropboxToken() ?? '')
    setAdminTokenState(getAdminToken() ?? '')
  }, [])

  const handleDropboxSave = (t) => {
    setDropboxToken(t)
    onTokenChange?.()
  }
  const handleAdminSave = (t) => {
    setAdminToken(t)
    onTokenChange?.()
  }

  const apiBase = process.env.NEXT_PUBLIC_ADMIN_API_URL

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--lt-text-primary)]">API Tokens</h2>
        {apiBase ? (
          <span className="flex items-center gap-1.5 text-xs text-[#10b981]">
            <CheckCircle size={11} />
            Admin API connected
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-[var(--lt-text-subtle)]">
            <XCircle size={11} />
            No admin API configured
          </span>
        )}
      </div>

      <TokenField
        label="Dropbox Access Token"
        icon={Key}
        value={dropboxToken}
        onChange={setDropboxTokenState}
        onSave={handleDropboxSave}
        onClear={() => { clearDropboxToken(); setDropboxTokenState(''); onTokenChange?.() }}
        description="Long-lived offline token from Dropbox App Console → your app → Generated access token."
      />

      <TokenField
        label="Admin Panel Token"
        icon={Link2}
        value={adminToken}
        onChange={setAdminTokenState}
        onSave={handleAdminSave}
        onClear={() => { clearAdminToken(); setAdminTokenState(''); onTokenChange?.() }}
        description={
          apiBase
            ? `Connects to ${apiBase}. Used to fetch your theme, user profile, and subscription plan.`
            : 'Set NEXT_PUBLIC_ADMIN_API_URL in .env.local to enable admin panel sync.'
        }
      />

      {apiBase && !adminToken && (
        <p className="text-xs text-[#f59e0b] bg-[#451a03] border border-[#f59e0b]/30 rounded-[8px] px-3 py-2">
          Admin API URL is configured but no token is set. Theme / user / subscription will use dummy data.
        </p>
      )}
    </div>
  )
}
