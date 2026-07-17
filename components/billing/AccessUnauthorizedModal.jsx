'use client'

import Modal from '@/components/ui/Modal'
import { Lock } from 'lucide-react'

export default function AccessUnauthorizedModal({ open, onClose, toolTitle, message }) {
  return (
    <Modal open={open} onClose={onClose} title="Access Required" size="sm">
      <div className="flex flex-col items-center text-center gap-3 py-2">
        <div className="w-12 h-12 rounded-full bg-[var(--lt-surface)] border border-[var(--lt-divider)] flex items-center justify-center">
          <Lock size={20} className="text-[var(--lt-text-subtle)]" />
        </div>
        <p className="text-sm text-[var(--lt-text-muted)]">
          {message ?? (
            <>You don&apos;t have access to {toolTitle ? <span className="font-semibold text-[var(--lt-text-primary)]">{toolTitle}</span> : 'this tool'}.</>
          )}
        </p>
        <button
          onClick={onClose}
          className="mt-2 px-5 h-9 rounded-[8px] text-xs font-semibold bg-[var(--lt-accent)] text-white hover:opacity-90 transition-opacity"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}
