'use client'

import { useState, useEffect, useCallback } from 'react'
import { getStorageProvider, setStorageProvider } from '@/lib/localStore'

// Tracks which storage backend (Dropbox / Bunny.net) is active *in this browser* —
// the choice lives in localStorage (lib/localStore.js), not server config, so it
// never touches the filesystem and never affects other users. `providers` (which
// backends are configured) still comes from the server, since that depends on env
// vars only the server can see. Stays in sync with switches made anywhere in the
// app via the shared 'storage:provider-changed' event.
export function useStorageProvider() {
  const [active, setActive]       = useState(null)
  const [providers, setProviders] = useState({})
  const [loading, setLoading]     = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res  = await fetch('/api/storage-provider')
      const data = await res.json()
      setProviders(data.providers)
      // First visit in this browser → adopt the server's default so there's
      // something sensible to show before the user ever picks explicitly.
      setActive(getStorageProvider() ?? data.default)
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

  const switchProvider = useCallback((provider) => {
    setStorageProvider(provider)
    setActive(provider)
    window.dispatchEvent(new CustomEvent('storage:provider-changed', { detail: { provider } }))
  }, [])

  return { active, providers, loading, refresh, switchProvider }
}
