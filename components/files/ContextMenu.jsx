'use client'

import { useEffect, useRef } from 'react'
import { FolderOpen, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const Divider = () => <div className="my-0.5 mx-2 h-px bg-[var(--lt-divider)]" />

function MenuItem({ icon: Icon, label, onClick, variant = 'default', disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2.5 w-full px-3 py-1.5 text-sm rounded-[6px] transition-colors cursor-pointer',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variant === 'danger'
          ? 'text-[#ef4444] hover:bg-[#450a0a]'
          : 'text-[var(--lt-text-muted)] hover:text-[var(--lt-text-primary)] hover:bg-[var(--lt-card-hover)]'
      )}
    >
      {Icon && <Icon size={14} className="shrink-0" />}
      {label}
    </button>
  )
}

export default function ContextMenu({
  menu,
  onClose,
  onOpen,
  onDelete,
}) {
  const ref  = useRef(null)
  const item = menu?.item

  useEffect(() => {
    if (!menu) return
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    setTimeout(() => window.addEventListener('mousedown', handle), 0)
    return () => window.removeEventListener('mousedown', handle)
  }, [menu, onClose])

  if (!menu) return null

  // Clamp to viewport
  const x = Math.min(menu.x, window.innerWidth - 180)
  const y = Math.min(menu.y, window.innerHeight - 280)

  const isFolder = item?.tag === 'folder'

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.12 }}
      style={{ position: 'fixed', left: x, top: y, zIndex: 1000 }}
      className="w-44 bg-[var(--lt-card)] border border-[var(--lt-divider-light)] rounded-[10px] shadow-2xl shadow-black/60 p-1 animate-fadeIn"
      onClick={e => e.stopPropagation()}
    >
      {isFolder && (
        <>
          <MenuItem icon={FolderOpen} label="Open" onClick={() => { onOpen(item); onClose() }} />
          <Divider />
        </>
      )}
      <MenuItem icon={Trash2} label="Delete" onClick={() => { onDelete([item.path]); onClose() }} variant="danger" />
    </motion.div>
  )
}
