'use client'

import { useState } from 'react'
import Modal  from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

export default function CreateFolderModal({ open, onClose, currentPath, onCreated, toast }) {
  const [name, setName]     = useState('')
  const [busy, setBusy]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy(true)
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-folder', path: currentPath, name: trimmed }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setName('')
      onCreated()
    } catch (e) {
      toast?.(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  function handleClose() {
    setName('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Folder" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Folder name"
          className="w-full px-3 py-2.5 bg-[#111111] border border-[#333333] rounded-[8px] text-sm text-[#f5f5f5] placeholder-[#6b7280] focus:outline-none focus:border-[#4f46e5] transition-colors"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" disabled={busy || !name.trim()}>
            {busy ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
