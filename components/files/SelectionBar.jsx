'use client'

import { Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'

export default function SelectionBar({
  selectedItems,
  onDelete,
  onClearSelection,
}) {
  const count = selectedItems.size

  if (count === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="hidden flex items-center gap-2 flex-wrap px-4 py-2.5 bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/40 rounded-[10px] shadow-lg shadow-[var(--lt-accent)]/10"
      >
        {/* Badge */}
        <button
          onClick={onClearSelection}
          className="flex items-center gap-1.5 px-2.5 h-7 rounded-[6px] bg-[var(--lt-accent)]/20 text-[var(--lt-accent-light)] text-sm font-semibold hover:bg-[var(--lt-accent)]/30 transition-colors cursor-pointer"
        >
          {count} selected ✕
        </button>

        <div className="w-px h-5 bg-[var(--lt-accent)]/30" />

        <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={onDelete}>
          Delete
        </Button>
      </motion.div>
    </AnimatePresence>
  )
}
