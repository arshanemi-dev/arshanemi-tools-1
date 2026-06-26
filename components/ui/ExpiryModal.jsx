'use client'

import { useState } from 'react'
import { X, Clock, Check, Loader2 } from 'lucide-react'
import ExpiryPicker from '@/components/ui/ExpiryPicker'

function daysRemaining(iso) {
  return Math.ceil((new Date(iso) - new Date()) / 86400000)
}

export default function ExpiryModal({ files, existingExpiry, onSave, onClose }) {
  const [expiryIso, setExpiryIso] = useState(existingExpiry ?? null)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  async function handleSave() {
    setError('')
    if (!expiryIso) { setError('Please select an expiry date'); return }
    setSaving(true)
    try {
      await onSave(expiryIso)
      onClose()
    } catch (e) {
      setError(e.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--lt-surface)] border border-[var(--lt-divider)] rounded-[12px] shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--lt-divider)]">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-[var(--lt-accent-light)]" />
            <h2 className="font-semibold text-[var(--lt-text-primary)] text-sm">
              {files.length === 1 ? 'Set File Expiry' : `Set Expiry for ${files.length} Files`}
            </h2>
          </div>
          <button onClick={onClose} className="text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">

          {/* File list preview */}
          <div className="space-y-1 max-h-28 overflow-y-auto">
            {files.map(f => (
              <div key={f.path} className="flex items-center gap-2 text-xs text-[var(--lt-text-muted)] bg-[var(--lt-card)] rounded-[6px] px-3 py-1.5">
                <Clock size={11} className="text-[var(--lt-accent)] shrink-0" />
                <span className="truncate">{f.name}</span>
              </div>
            ))}
          </div>

          {/* Current expiry — only for single-file edit */}
          {existingExpiry && files.length === 1 && (
            <p className="text-xs text-[var(--lt-text-subtle)]">
              Current expiry:{' '}
              <span className={daysRemaining(existingExpiry) <= 0 ? 'text-red-400' : 'text-[var(--lt-accent-light)]'}>
                {new Date(existingExpiry).toLocaleDateString()} ({daysRemaining(existingExpiry)}d)
              </span>
            </p>
          )}

          {/* Expiry picker */}
          <div>
            <p className="text-xs font-medium text-[var(--lt-text-muted)] mb-2">
              {existingExpiry ? 'Update Expiry' : 'Set Expiry Date'}
            </p>
            <ExpiryPicker
              initialValue={existingExpiry}
              onChange={setExpiryIso}
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 pb-4">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs border border-[var(--lt-divider)] rounded-[8px] text-[var(--lt-text-muted)] hover:bg-[var(--lt-card-hover)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !expiryIso}
            className="px-4 py-1.5 text-xs bg-[var(--lt-accent)] text-white rounded-[8px] hover:bg-[var(--lt-accent-hover)] transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
            Save Expiry
          </button>
        </div>

      </div>
    </div>
  )
}
