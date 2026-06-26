'use client'

import { useState, useCallback } from 'react'

export function useUpload({ currentPath, refetch, toast }) {
  const [uploads,   setUploads]   = useState([]) // [{ id, file, progress, status, error }]
  const [uploading, setUploading] = useState(false)

  const uploadFiles = useCallback(async (files) => {
    if (!files?.length) return

    const entries = Array.from(files).map(file => ({
      id:       `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status:   'uploading',
      error:    null,
    }))

    setUploads(entries)
    setUploading(true)

    // Launch all uploads in parallel — each file gets its own XHR so
    // per-file progress is tracked individually and one failure doesn't
    // cancel the others.
    const results = await Promise.all(
      entries.map(entry => new Promise((resolve) => {
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
          } else {
            let errorMsg = 'Upload failed'
            try { errorMsg = JSON.parse(xhr.responseText)?.error ?? errorMsg } catch {}
            setUploads(prev => prev.map(u =>
              u.id === entry.id ? { ...u, status: 'error', error: errorMsg } : u
            ))
            resolve(false)
          }
        }

        xhr.onerror = () => {
          setUploads(prev => prev.map(u =>
            u.id === entry.id ? { ...u, status: 'error', error: 'Network error' } : u
          ))
          resolve(false)
        }

        xhr.send(formData)
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
