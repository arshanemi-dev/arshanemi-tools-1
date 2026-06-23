'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export function useFiles(currentPath) {
  const [folders, setFolders] = useState([])
  const [files, setFiles]     = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const abortRef              = useRef(null)

  const fetchFiles = useCallback(async () => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/files?path=${encodeURIComponent(currentPath ?? '')}`,
        { signal: abortRef.current.signal }
      )
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
      const data = await res.json()
      setFolders(data.folders ?? [])
      setFiles(data.files ?? [])
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [currentPath])

  useEffect(() => {
    fetchFiles()
    return () => abortRef.current?.abort()
  }, [fetchFiles])

  return { folders, files, loading, error, refetch: fetchFiles }
}
