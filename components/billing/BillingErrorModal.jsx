'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import Modal from '@/components/ui/Modal'

// A genuine failure while checking billing (network error, unexpected
// server response, stale/misconfigured backend, etc.) — kept visually and
// textually distinct from AccessUnauthorizedModal so a broken check never
// reads as "you're not allowed to do this." Offers a retry since these are
// often transient, unlike a real access/feature-unavailable block.
export default function BillingErrorModal({ open, onClose, onRetry, data }) {
  return (
    <Modal open={open} onClose={onClose} title="Something Went Wrong" size="sm">
      <div className="flex flex-col items-center text-center gap-3 py-2">
        <div className="w-12 h-12 rounded-full bg-[var(--lt-danger-bg)] border border-[var(--lt-danger-text)]/30 flex items-center justify-center">
          <AlertTriangle size={20} className="text-[var(--lt-danger-text)]" />
        </div>
        <p className="text-sm text-[var(--lt-text-muted)]">
          Couldn&apos;t check billing for this action{data?.message ? ` — ${data.message}` : ''}. This isn&apos;t a permissions problem, try again in a moment.
        </p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={onClose}
            className="px-4 h-9 rounded-[8px] text-xs font-semibold border border-[var(--lt-divider)] text-[var(--lt-text-muted)] hover:bg-[var(--lt-card-hover)] transition-colors"
          >
            Close
          </button>
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-4 h-9 rounded-[8px] text-xs font-semibold bg-[var(--lt-accent)] text-white hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={13} /> Try Again
          </button>
        </div>
      </div>
    </Modal>
  )
}
