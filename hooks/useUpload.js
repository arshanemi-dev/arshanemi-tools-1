'use client'

import { useState, useCallback } from 'react'
import { runBillingGate, reportStorageUsage } from '@/lib/toolBilling'
import { TOOL_SLUG, FEATURES } from '@/lib/toolFeatures'

const MAX_ATTEMPTS = 3

const delay = (ms) => new Promise(r => setTimeout(r, ms))

// provider: active storage provider ('dropbox'|'bunny'), for storage-delta
// reporting. onBillingBlocked(reason, data, retry): opens the caller's
// BillingGateModal — same {reason, data, retry} shape as every other
// runBillingGate call site in this app.
export function useUpload({ currentPath, refetch, toast, provider, onBillingBlocked }) {
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
              // uploaded[0].size — same shape /api/upload always returns
              // (normalizeFile() per provider). Falls back to the local
              // File object's own size if parsing ever fails, so a storage
              // report still happens even on an unexpected response shape.
              let size = entry.file.size
              try { size = JSON.parse(xhr.responseText)?.uploaded?.[0]?.size ?? size } catch {}
              resolve({ ok: true, size })
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
              resolve({ ok: false })
            }
          }

          xhr.onerror = () => {
            if (attempt < MAX_ATTEMPTS) {
              delay(800 * 2 ** (attempt - 1) + Math.random() * 400).then(tryUpload)
            } else {
              setUploads(prev => prev.map(u =>
                u.id === entry.id ? { ...u, status: 'error', error: 'Network error' } : u
              ))
              resolve({ ok: false })
            }
          }

          xhr.send(formData)
        }

        tryUpload()
      }))
    )

    setUploading(false)

    const succeeded  = results.filter(r => r.ok)
    const doneCount  = succeeded.length
    const errCount   = results.length - doneCount
    const totalBytes = succeeded.reduce((sum, r) => sum + (r.size || 0), 0)

    if (doneCount > 0) {
      toast(
        `Uploaded ${doneCount} file${doneCount > 1 ? 's' : ''}` +
        (errCount > 0 ? ` · ${errCount} failed` : ''),
        errCount > 0 ? 'info' : 'success'
      )
      refetch()

      // Billed AFTER upload, on however many files actually succeeded (not
      // files.length) — nothing here can un-upload a file already committed
      // to Dropbox/Bunny, so charge-then-block would be wrong; this reports
      // what happened instead. Storage accounting below happens regardless
      // of the gate's outcome — the bytes are on disk either way.
      runBillingGate({ toolSlug: TOOL_SLUG, featureApiIdentifier: FEATURES.IMAGE_UPLOAD, quantity: doneCount })
        .then((gate) => {
          if (gate.status === 'blocked') onBillingBlocked?.(gate.reason, gate.data, () => {})
        })
        .catch((err) => console.error('Upload billing gate failed:', err))

      if (totalBytes > 0) {
        reportStorageUsage({ provider, deltaBytes: totalBytes }).catch((err) =>
          console.error('Storage usage report failed:', err)
        )
      }
    } else {
      toast('Upload failed', 'error')
    }

    setTimeout(() => setUploads([]), 3000)
  }, [currentPath, refetch, toast, provider, onBillingBlocked])

  const clearUploads = useCallback(() => setUploads([]), [])

  return { uploads, uploading, uploadFiles, clearUploads }
}
