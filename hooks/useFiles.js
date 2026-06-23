'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export function useFiles(currentPath) {
  const [folders, setFolders] = useState([])
  const [files, setFiles]     = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const abortRef              = useRef(null)

  // null means "not ready yet" — skip fetching
  const disabled = currentPath === null

  const fetchFiles = useCallback(async () => {
    if (disabled) return

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
  }, [currentPath, disabled])

  useEffect(() => {
    if (disabled) return
    fetchFiles()
    return () => abortRef.current?.abort()
  }, [fetchFiles, disabled])

  return { folders, files, loading, error, refetch: fetchFiles }
}
