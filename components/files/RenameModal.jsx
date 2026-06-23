'use client'

import { useState, useEffect } from 'react'
import Modal  from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

export default function RenameModal({ open, onClose, item, onRenamed, toast }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (item) setName(item.name)
  }, [item])

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || trimmed === item?.name) return
    setBusy(true)
    try {
      const res = await fetch('/api/files', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: item.path, newName: trimmed }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      onRenamed()
    } catch (e) {
      toast?.(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Rename" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onFocus={e => {
            // Select name without extension for files
            const dot = e.target.value.lastIndexOf('.')
            if (dot > 0 && item?.tag === 'file') {
              e.target.setSelectionRange(0, dot)
            } else {
              e.target.select()
            }
          }}
          className="w-full px-3 py-2.5 bg-[#111111] border border-[#333333] rounded-[8px] text-sm text-[#f5f5f5] focus:outline-none focus:border-[#4f46e5] transition-colors"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" disabled={busy || !name.trim() || name.trim() === item?.name}>
            {busy ? 'Renaming…' : 'Rename'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
