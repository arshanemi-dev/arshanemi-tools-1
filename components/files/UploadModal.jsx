'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import Modal  from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { formatBytes } from '@/lib/utils'
import { cn } from '@/lib/utils'

function UploadItem({ entry }) {
  const preview = entry.file.type.startsWith('image/')
    ? URL.createObjectURL(entry.file)
    : null

  const statusColor = entry.status === 'done'
    ? 'text-[#10b981]'
    : entry.status === 'error'
    ? 'text-[#ef4444]'
    : 'text-[#818cf8]'

  return (
    <div className="flex items-center gap-3 py-2 border-b border-[#262626] last:border-0">
      {/* Preview / icon */}
      <div className="w-10 h-10 shrink-0 rounded-[6px] bg-[#111111] overflow-hidden flex items-center justify-center">
        {preview
          ? <img src={preview} alt="" className="w-10 h-10 object-cover" />
          : <Upload size={16} className="text-[#6b7280]" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#f5f5f5] truncate">{entry.file.name}</p>
        <p className="text-xs text-[#6b7280]">{formatBytes(entry.file.size)}</p>

        {/* Progress bar */}
        {entry.status === 'uploading' && (
          <div className="mt-1 h-1 bg-[#1c1c1c] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4f46e5] transition-all duration-300"
              style={{ width: `${entry.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Status */}
      <div className={cn('shrink-0', statusColor)}>
        {entry.status === 'done'      && <CheckCircle  size={16} />}
        {entry.status === 'error'     && <AlertCircle  size={16} />}
        {entry.status === 'uploading' && <span className="text-xs font-medium">{entry.progress}%</span>}
      </div>
    </div>
  )
}

export default function UploadModal({ open, onClose, onUpload, uploads, uploading }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleFiles = useCallback((files) => {
    if (files?.length) onUpload(Array.from(files))
  }, [onUpload])

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const allDone = uploads.length > 0 && uploads.every(u => u.status === 'done' || u.status === 'error')

  return (
    <Modal open={open} onClose={onClose} title="Upload Files" size="md">
      <div className="flex flex-col gap-4">

        {/* Drop area */}
        {uploads.length === 0 && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-3 py-10 rounded-[10px] border-2 border-dashed cursor-pointer transition-all',
              dragOver
                ? 'border-[#4f46e5] bg-[#1e1b4b]/40'
                : 'border-[#333333] hover:border-[#4f46e5]/50 hover:bg-[#1c1c1c]'
            )}
          >
            <div className="w-12 h-12 rounded-full bg-[#1c1c1c] border border-[#333333] flex items-center justify-center">
              <Upload size={22} className="text-[#4f46e5]" />
            </div>
            <div className="text-center">
              <p className="text-sm text-[#f5f5f5] font-medium">Drag files here or click to browse</p>
              <p className="text-xs text-[#6b7280] mt-0.5">Any file type accepted</p>
            </div>
          </div>
        )}

        <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />

        {/* Upload list */}
        {uploads.length > 0 && (
          <div className="max-h-60 overflow-y-auto">
            {uploads.map(entry => (
              <UploadItem key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {allDone ? (
            <Button variant="primary" size="sm" onClick={onClose}>Done</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onClose} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Cancel'}
            </Button>
          )}
          {uploads.length === 0 && (
            <Button variant="primary" size="sm" onClick={() => inputRef.current?.click()}>
              Choose Files
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
