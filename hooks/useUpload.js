'use client'

import { useState, useCallback } from 'react'

export function useUpload({ currentPath, refetch, toast }) {
  const [uploads, setUploads] = useState([]) // [{ id, file, progress, status, error }]
  const [uploading, setUploading] = useState(false)

  const uploadFiles = useCallback((files) => {
    if (!files?.length) return

    const entries = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending',
      error: null,
    }))

    setUploads(entries)
    setUploading(true)

    const formData = new FormData()
    formData.append('folderPath', currentPath || '')
    entries.forEach(e => formData.append('files', e.file))

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload')

    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable) return
      const pct = Math.round((ev.loaded / ev.total) * 100)
      setUploads(prev => prev.map(u => ({ ...u, progress: pct, status: 'uploading' })))
    }

    xhr.onload = () => {
      setUploading(false)
      if (xhr.status === 200) {
        setUploads(prev => prev.map(u => ({ ...u, progress: 100, status: 'done' })))
        toast(`Uploaded ${entries.length} file${entries.length > 1 ? 's' : ''}`, 'success')
        refetch()
        setTimeout(() => setUploads([]), 1500)
      } else {
        setUploads(prev => prev.map(u => ({ ...u, status: 'error', error: 'Upload failed' })))
        toast('Upload failed', 'error')
      }
    }

    xhr.onerror = () => {
      setUploading(false)
      setUploads(prev => prev.map(u => ({ ...u, status: 'error', error: 'Network error' })))
      toast('Network error during upload', 'error')
    }

    xhr.send(formData)
  }, [currentPath, refetch, toast])

  const clearUploads = useCallback(() => setUploads([]), [])

  return { uploads, uploading, uploadFiles, clearUploads }
}
