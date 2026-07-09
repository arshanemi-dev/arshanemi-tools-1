'use client'

import { useState, useEffect, useCallback } from 'react'

// Tracks which storage backend (Dropbox / Bunny.net) is currently active, and stays in
// sync with switches made anywhere in the app via the shared 'storage:provider-changed' event.
export function useStorageProvider() {
  const [active, setActive]       = useState(null)
  const [providers, setProviders] = useState({})
  const [loading, setLoading]     = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res  = await fetch('/api/storage-provider')
      const data = await res.json()
      setActive(data.active)
      setProviders(data.providers)
    } catch {
      // best-effort — UI just keeps whatever it last knew
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener('storage:provider-changed', refresh)
    return () => window.removeEventListener('storage:provider-changed', refresh)
  }, [refresh])

  return { active, providers, loading, refresh }
}
