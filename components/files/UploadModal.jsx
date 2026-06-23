'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, CheckCircle, AlertCircle, Image, Video } from 'lucide-react'
import Modal  from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { formatBytes } from '@/lib/utils'
import { cn } from '@/lib/utils'

const IMAGE_EXTS = new Set(['jpg','jpeg','png','gif','webp','svg','avif','heic','bmp','tiff','tif'])
const VIDEO_EXTS = new Set(['mp4','mov','avi','mkv','webm','wmv','m4v','flv','3gp','ogv'])
const IMAGE_MAX  = 31  * 1024 * 1024  // 31 MB
const VIDEO_MAX  = 101 * 1024 * 1024  // 101 MB

function getFileCategory(file) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (IMAGE_EXTS.has(ext)) return 'image'
  if (VIDEO_EXTS.has(ext)) return 'video'
  return 'other'
}

function validateFile(file) {
  const cat = getFileCategory(file)
  if (cat === 'other') {
    return { valid: false, error: 'Only images & videos are allowed' }
  }
  if (cat === 'image' && file.size > IMAGE_MAX) {
    return { valid: false, error: `Image too large — max 31 MB (got ${formatBytes(file.size)})` }
  }
  if (cat === 'video' && file.size > VIDEO_MAX) {
    return { valid: false, error: `Video too large — max 101 MB (got ${formatBytes(file.size)})` }
  }
  return { valid: true, category: cat }
}

function FileBadge({ category }) {
  if (category === 'image') {
    return (
      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#1e1b4b] text-[#818cf8]">
        <Image size={9} /> IMG
      </span>
    )
  }
  if (category === 'video') {
    return (
      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#451a03] text-[#f59e0b]">
        <Video size={9} /> VID
      </span>
    )
  }
  return null
}

function UploadItem({ entry }) {
  const category = getFileCategory(entry.file)
  const preview = category === 'image'
    ? URL.createObjectURL(entry.file)
    : null

  const statusColor = entry.status === 'done'
    ? 'text-[#10b981]'
    : entry.status === 'error'
    ? 'text-[#ef4444]'
    : 'text-[#818cf8]'

  return (
    <div className={cn(
      'flex items-center gap-3 py-2.5 px-3 border-b border-[#262626] last:border-0',
      entry.status === 'rejected' && 'bg-[#450a0a]/30'
    )}>
      {/* Preview / icon */}
      <div className="w-10 h-10 shrink-0 rounded-[6px] bg-[#111111] overflow-hidden flex items-center justify-center">
        {preview
          ? <img src={preview} alt="" className="w-10 h-10 object-cover" />
          : category === 'video'
          ? <Video size={18} className="text-[#f59e0b]" />
          : <Upload size={16} className="text-[#6b7280]" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm text-[#f5f5f5] truncate">{entry.file.name}</p>
          {category && <FileBadge category={category} />}
        </div>
        <p className="text-xs text-[#6b7280]">{formatBytes(entry.file.size)}</p>

        {entry.status === 'uploading' && (
          <div className="mt-1.5 h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4f46e5] transition-all duration-300 rounded-full"
              style={{ width: `${entry.progress}%` }}
            />
          </div>
        )}

        {entry.status === 'rejected' && (
          <p className="text-[11px] text-[#ef4444] mt-0.5">{entry.error}</p>
        )}
      </div>

      {/* Status icon */}
      <div className={cn('shrink-0', statusColor)}>
        {entry.status === 'done'      && <CheckCircle  size={16} />}
        {entry.status === 'error'     && <AlertCircle  size={16} />}
        {entry.status === 'rejected'  && <AlertCircle  size={16} className="text-[#ef4444]" />}
        {entry.status === 'uploading' && (
          <span className="text-xs font-medium">{entry.progress}%</span>
        )}
      </div>
    </div>
  )
}

export default function UploadModal({ open, onClose, onUpload, uploads, uploading }) {
  const [dragOver, setDragOver]     = useState(false)
  const [rejected, setRejected]     = useState([])
  const inputRef                    = useRef(null)

  const handleFiles = useCallback((files) => {
    if (!files?.length) return
    const arr = Array.from(files)

    const good    = []
    const badList = []

    arr.forEach(file => {
      const { valid, error } = validateFile(file)
      if (valid) {
        good.push(file)
      } else {
        badList.push({ file, error })
      }
    })

    setRejected(badList)
    if (good.length) onUpload(good)
  }, [onUpload])

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const allDone = uploads.length > 0 && uploads.every(u => u.status === 'done' || u.status === 'error')

  function handleClose() {
    setRejected([])
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Upload Files" size="md">
      <div className="flex flex-col gap-4">

        {/* Limit info */}
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-[8px] bg-[#111111] border border-[#262626]">
            <Image size={14} className="text-[#818cf8] shrink-0" />
            <div>
              <p className="text-xs font-medium text-[#f5f5f5]">Images</p>
              <p className="text-[10px] text-[#6b7280]">Max 31 MB · jpg png gif webp svg…</p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-[8px] bg-[#111111] border border-[#262626]">
            <Video size={14} className="text-[#f59e0b] shrink-0" />
            <div>
              <p className="text-xs font-medium text-[#f5f5f5]">Videos</p>
              <p className="text-[10px] text-[#6b7280]">Max 101 MB · mp4 mov mkv webm…</p>
            </div>
          </div>
        </div>

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
              <p className="text-sm text-[#f5f5f5] font-medium">Drag images & videos here or click to browse</p>
              <p className="text-xs text-[#6b7280] mt-0.5">Images ≤ 31 MB · Videos ≤ 101 MB</p>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />

        {/* Rejected files */}
        {rejected.length > 0 && (
          <div className="rounded-[8px] border border-[#ef4444]/30 bg-[#450a0a]/20 overflow-hidden">
            <div className="px-3 py-2 border-b border-[#ef4444]/20">
              <p className="text-xs font-medium text-[#ef4444]">{rejected.length} file{rejected.length > 1 ? 's' : ''} rejected</p>
            </div>
            {rejected.map((r, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 border-b border-[#ef4444]/10 last:border-0">
                <AlertCircle size={12} className="text-[#ef4444] shrink-0" />
                <span className="text-xs text-[#f5f5f5] truncate flex-1">{r.file.name}</span>
                <span className="text-[10px] text-[#ef4444] shrink-0">{r.error}</span>
              </div>
            ))}
          </div>
        )}

        {/* Upload list */}
        {uploads.length > 0 && (
          <div className="max-h-60 overflow-y-auto rounded-[8px] border border-[#262626] bg-[#111111]">
            {uploads.map(entry => (
              <UploadItem key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {allDone ? (
            <Button variant="primary" size="sm" onClick={handleClose}>Done</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={uploading}>
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
