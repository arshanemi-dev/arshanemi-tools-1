'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { runBillingGate } from '@/lib/toolBilling'
import { TOOL_SLUG, FEATURES } from '@/lib/toolFeatures'

// onBillingBlocked(reason, data, retry): opens the caller's BillingGateModal
// — same {reason, data, retry} shape as every other runBillingGate call site.
// link-browse is 0 coins today, so this resolves to 'proceed' on every real
// call (see lib/toolBilling.js's short-circuit for falsy coinCost) — wired so
// browsing becomes instantly price-editable via the admin catalog later,
// with no further code changes needed here.
export function useFiles(currentPath, { onBillingBlocked } = {}) {
  const [folders, setFolders] = useState([])
  const [files, setFiles]     = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const abortRef              = useRef(null)
  // Holds the latest fetchFiles closure so the retry callback below can call
  // it without directly self-referencing the useCallback binding (which
  // react-hooks/immutability flags even though it's runtime-safe via closure).
  const fetchFilesRef          = useRef(null)

  // null means "not ready yet" — skip fetching
  const disabled = currentPath === null

  const fetchFiles = useCallback(async () => {
    if (disabled) return

    const gate = await runBillingGate({ toolSlug: TOOL_SLUG, featureApiIdentifier: FEATURES.BROWSE })
    if (gate.status === 'blocked') {
      onBillingBlocked?.(gate.reason, gate.data, () => fetchFilesRef.current?.())
      return
    }

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/files?path=${encodeURIComponent(currentPath ?? '')}`,
        { signal: abortRef.current.signal }
      )
      if (!res.ok) {
        let msg = `Error ${res.status}`
        try { const b = await res.json(); if (b?.error) msg = b.error } catch {}
        throw new Error(msg)
      }
      const data = await res.json()
      setFolders(data.folders ?? [])
      setFiles(data.files ?? [])
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [currentPath, disabled, onBillingBlocked])

  useEffect(() => { fetchFilesRef.current = fetchFiles }, [fetchFiles])

  useEffect(() => {
    if (disabled) return
    fetchFiles()
    return () => abortRef.current?.abort()
  }, [fetchFiles, disabled])

  return { folders, files, loading, error, refetch: fetchFiles }
}
