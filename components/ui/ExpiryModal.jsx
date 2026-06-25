'use client'
import { useState } from 'react'
import { X, Clock, Check, Loader2 } from 'lucide-react'

function daysRemaining(iso) {
  return Math.ceil((new Date(iso) - new Date()) / 86400000)
}

export default function ExpiryModal({ files, existingExpiry, onSave, onClose }) {
  const [date, setDate]       = useState(
    existingExpiry ? existingExpiry.slice(0, 10) : ''
  )
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  async function handleSave() {
    setError('')
    if (!date) { setError('Please select an expiry date'); return }
    setSaving(true)
    try {
      await onSave(new Date(date).toISOString())
      onClose()
    } catch (e) {
      setError(e.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-[#262626] rounded-[12px] shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-[#818cf8]" />
            <h2 className="font-semibold text-[#f5f5f5] text-sm">
              {files.length === 1 ? 'Set File Expiry' : `Set Expiry for ${files.length} Files`}
            </h2>
          </div>
          <button onClick={onClose} className="text-[#6b7280] hover:text-[#f5f5f5] transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* File list preview */}
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {files.map(f => (
              <div key={f.path} className="flex items-center gap-2 text-xs text-[#a3a3a3] bg-[#161616] rounded-[6px] px-3 py-1.5">
                <Clock size={11} className="text-[#4f46e5] shrink-0" />
                <span className="truncate">{f.name}</span>
              </div>
            ))}
          </div>

          {/* Current expiry if single file */}
          {existingExpiry && (
            <p className="text-xs text-[#6b7280]">
              Current expiry: <span className={daysRemaining(existingExpiry) <= 0 ? 'text-red-400' : 'text-[#818cf8]'}>
                {new Date(existingExpiry).toLocaleDateString()} ({daysRemaining(existingExpiry)}d)
              </span>
            </p>
          )}

          {/* Date picker */}
          <div>
            <label className="block text-xs font-medium text-[#a3a3a3] mb-1.5">New Expiry Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-[#161616] border border-[#262626] rounded-[8px] px-3 py-2 text-sm text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-[#4f46e5]/60"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 pb-4">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs border border-[#262626] rounded-[8px] text-[#a3a3a3] hover:bg-[#1c1c1c] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-xs bg-[#4f46e5] text-white rounded-[8px] hover:bg-[#4338ca] transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
            Save Expiry
          </button>
        </div>
      </div>
    </div>
  )
}
