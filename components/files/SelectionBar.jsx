'use client'

import { Copy, Scissors, Clipboard, Pencil, Trash2, Link2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'

export default function SelectionBar({
  selectedItems,
  clipboard,
  currentPath,
  allItems,
  onCopy,
  onCut,
  onPaste,
  onRename,
  onDelete,
  onCopyUrls,
  onClearSelection,
}) {
  const count      = selectedItems.size
  const selectedArr = [...selectedItems]
  const allFiles   = allItems.filter(i => i.tag === 'file')
  const hasFiles   = selectedArr.some(p => allFiles.some(f => f.path === p))
  const canRename  = count === 1
  const canPaste   = clipboard && clipboard.paths.length > 0
  const canUrls    = count > 0 && hasFiles

  if (count === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-2 flex-wrap px-4 py-2.5 bg-[#1e1b4b] border border-[#4f46e5]/40 rounded-[10px] shadow-lg shadow-[#4f46e5]/10"
      >
        {/* Badge */}
        <button
          onClick={onClearSelection}
          className="flex items-center gap-1.5 px-2.5 h-7 rounded-[6px] bg-[#4f46e5]/20 text-[#818cf8] text-sm font-semibold hover:bg-[#4f46e5]/30 transition-colors cursor-pointer"
        >
          {count} selected ✕
        </button>

        <div className="w-px h-5 bg-[#4f46e5]/30" />

        <Button size="sm" variant="ghost" icon={<Copy size={13} />} onClick={() => onCopy(selectedArr)}>
          Copy
        </Button>
        <Button size="sm" variant="ghost" icon={<Scissors size={13} />} onClick={() => onCut(selectedArr)}>
          Cut
        </Button>
        <Button size="sm" variant="ghost" icon={<Clipboard size={13} />} onClick={onPaste} disabled={!canPaste}>
          Paste
        </Button>

        <div className="w-px h-5 bg-[#4f46e5]/30" />

        <Button size="sm" variant="ghost" icon={<Pencil size={13} />} onClick={onRename} disabled={!canRename}>
          Rename
        </Button>
        <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={onDelete}>
          Delete
        </Button>

        <div className="w-px h-5 bg-[#4f46e5]/30 ml-auto" />

        <Button
          size="sm"
          variant="primary"
          icon={<Link2 size={13} />}
          onClick={onCopyUrls}
          disabled={!canUrls}
          title={!canUrls ? 'Select files (not folders) to copy URLs' : ''}
        >
          Copy URLs
        </Button>
      </motion.div>
    </AnimatePresence>
  )
}
