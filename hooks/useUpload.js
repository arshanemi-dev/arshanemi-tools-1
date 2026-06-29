'use client'

import { useState, useCallback } from 'react'

const MAX_ATTEMPTS = 3

const delay = (ms) => new Promise(r => setTimeout(r, ms))

export function useUpload({ currentPath, refetch, toast }) {
  const [uploads,   setUploads]   = useState([]) // [{ id, file, progress, status, error, attempt, maxAttempts }]
  const [uploading, setUploading] = useState(false)

  const uploadFiles = useCallback(async (files) => {
    if (!files?.length) return

    const entries = Array.from(files).map(file => ({
      id:          `${Date.now()}-${Math.random()}`,
      file,
      progress:    0,
      status:      'uploading',
      error:       null,
      attempt:     1,
      maxAttempts: MAX_ATTEMPTS,
    }))

    setUploads(entries)
    setUploading(true)

    // Each file gets its own XHR with retry logic — parallel uploads, independent failures.
    const results = await Promise.all(
      entries.map(entry => new Promise((resolve) => {
        let attempt = 0

        function tryUpload() {
          attempt++

          if (attempt > 1) {
            setUploads(prev => prev.map(u =>
              u.id === entry.id
                ? { ...u, status: 'retrying', attempt, progress: 0, error: null }
                : u
            ))
          }

          const formData = new FormData()
          formData.append('folderPath', currentPath || '')
          formData.append('files', entry.file)

          const xhr = new XMLHttpRequest()
          xhr.open('POST', '/api/upload')

          xhr.upload.onprogress = (ev) => {
            if (!ev.lengthComputable) return
            const pct = Math.round((ev.loaded / ev.total) * 100)
            setUploads(prev => prev.map(u =>
              u.id === entry.id ? { ...u, progress: pct } : u
            ))
          }

          xhr.onload = () => {
            if (xhr.status === 200) {
              setUploads(prev => prev.map(u =>
                u.id === entry.id ? { ...u, progress: 100, status: 'done' } : u
              ))
              resolve(true)
              return
            }

            let errorMsg = 'Upload failed'
            try { errorMsg = JSON.parse(xhr.responseText)?.error ?? errorMsg } catch {}

            // Retry on server errors (5xx); don't retry 400/401/403/404 — those are permanent.
            if (attempt < MAX_ATTEMPTS && (xhr.status === 0 || xhr.status >= 500)) {
              delay(800 * 2 ** (attempt - 1) + Math.random() * 400).then(tryUpload)
            } else {
              setUploads(prev => prev.map(u =>
                u.id === entry.id ? { ...u, status: 'error', error: errorMsg } : u
              ))
              resolve(false)
            }
          }

          xhr.onerror = () => {
            if (attempt < MAX_ATTEMPTS) {
              delay(800 * 2 ** (attempt - 1) + Math.random() * 400).then(tryUpload)
            } else {
              setUploads(prev => prev.map(u =>
                u.id === entry.id ? { ...u, status: 'error', error: 'Network error' } : u
              ))
              resolve(false)
            }
          }

          xhr.send(formData)
        }

        tryUpload()
      }))
    )

    setUploading(false)

    const doneCount = results.filter(Boolean).length
    const errCount  = results.length - doneCount

    if (doneCount > 0) {
      toast(
        `Uploaded ${doneCount} file${doneCount > 1 ? 's' : ''}` +
        (errCount > 0 ? ` · ${errCount} failed` : ''),
        errCount > 0 ? 'info' : 'success'
      )
      refetch()
    } else {
      toast('Upload failed', 'error')
    }

    setTimeout(() => setUploads([]), 3000)
  }, [currentPath, refetch, toast])

  const clearUploads = useCallback(() => setUploads([]), [])

  return { uploads, uploading, uploadFiles, clearUploads }
}
