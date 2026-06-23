'use client'

import { useState, useCallback } from 'react'

export function useClipboard({ currentPath, clearSelection, refetch, toast }) {
  const [clipboard, setClipboard] = useState(null) // { op: 'copy'|'cut', paths: [] }

  const copy = useCallback((paths) => {
    setClipboard({ op: 'copy', paths })
    toast(`${paths.length} item${paths.length > 1 ? 's' : ''} copied`, 'info')
  }, [toast])

  const cut = useCallback((paths) => {
    setClipboard({ op: 'cut', paths })
    toast(`${paths.length} item${paths.length > 1 ? 's' : ''} cut`, 'info')
  }, [toast])

  const paste = useCallback(async () => {
    if (!clipboard) return
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: clipboard.op === 'copy' ? 'copy' : 'move',
          paths: clipboard.paths,
          destPath: currentPath || '',
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      if (clipboard.op === 'cut') setClipboard(null)
      clearSelection()
      refetch()
      toast('Pasted successfully', 'success')
    } catch (e) {
      toast(e.message, 'error')
    }
  }, [clipboard, currentPath, clearSelection, refetch, toast])

  const clearClipboard = useCallback(() => setClipboard(null), [])

  return { clipboard, setClipboard, copy, cut, paste, clearClipboard }
}
