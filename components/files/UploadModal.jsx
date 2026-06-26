'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, X, CheckCircle, AlertCircle, Image, Video, AlertTriangle, Folder } from 'lucide-react'
import Modal       from '@/components/ui/Modal'
import Button      from '@/components/ui/Button'
import ExpiryPicker from '@/components/ui/ExpiryPicker'
import { formatBytes } from '@/lib/utils'
import { cn } from '@/lib/utils'

const IMAGE_EXTS = new Set(['jpg','jpeg','png','gif','webp','svg','avif','heic','bmp','tiff','tif'])
const VIDEO_EXTS = new Set(['mp4','mov','avi','mkv','webm','wmv','m4v','flv','3gp','ogv'])
const IMAGE_MAX  = 30  * 1024 * 1024  // 30 MB
const VIDEO_MAX  = 100* 1024 * 1024  // 100 MB

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
      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[var(--lt-accent-muted)] text-[var(--lt-accent-light)]">
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

/* ── Pre-upload file row (ready / duplicate / rejected) ───────── */
function FileRow({ file, variant, error }) {
  const category = getFileCategory(file)
  const preview  = category === 'image' ? URL.createObjectURL(file) : null

  return (
    <div className={cn(
      'flex items-center gap-3 py-2 px-3 border-b border-[var(--lt-divider)] last:border-0',
      variant === 'duplicate' && 'bg-[#2d1a00]/20',
      variant === 'rejected'  && 'bg-[#450a0a]/20',
    )}>
      <div className="w-8 h-8 shrink-0 rounded-[5px] bg-[var(--lt-surface)] overflow-hidden flex items-center justify-center">
        {preview
          ? <img src={preview} alt="" className="w-8 h-8 object-cover" />
          : category === 'video'
          ? <Video size={15} className="text-[#f59e0b]" />
          : <Upload size={13} className="text-[var(--lt-text-subtle)]" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-xs text-[var(--lt-text-primary)] truncate">{file.name}</p>
          <FileBadge category={category} />
        </div>
        <p className="text-[10px] text-[var(--lt-text-subtle)]">{formatBytes(file.size)}</p>
        {error && <p className="text-[10px] text-[#ef4444] mt-0.5">{error}</p>}
      </div>
      {variant === 'duplicate' && <AlertTriangle size={13} className="text-[#f59e0b] shrink-0" />}
      {variant === 'rejected'  && <AlertCircle  size={13} className="text-[#ef4444] shrink-0" />}
    </div>
  )
}

/* ── Upload progress item ─────────────────────────────────────── */
function UploadItem({ entry }) {
  const category = getFileCategory(entry.file)
  const preview  = category === 'image' ? URL.createObjectURL(entry.file) : null

  const statusColor = entry.status === 'done'
    ? 'text-[#10b981]'
    : entry.status === 'error'
    ? 'text-[#ef4444]'
    : 'text-[var(--lt-accent-light)]'

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 border-b border-[var(--lt-divider)] last:border-0">
      <div className="w-10 h-10 shrink-0 rounded-[6px] bg-[var(--lt-surface)] overflow-hidden flex items-center justify-center">
        {preview
          ? <img src={preview} alt="" className="w-10 h-10 object-cover" />
          : category === 'video'
          ? <Video size={18} className="text-[#f59e0b]" />
          : <Upload size={16} className="text-[var(--lt-text-subtle)]" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm text-[var(--lt-text-primary)] truncate">{entry.file.name}</p>
          <FileBadge category={category} />
        </div>
        <p className="text-xs text-[var(--lt-text-subtle)]">{formatBytes(entry.file.size)}</p>

        {(entry.status === 'uploading' || entry.status === 'pending') && (
          <div className="mt-1.5 h-1.5 bg-[var(--lt-card-hover)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--lt-accent)] transition-all duration-300 rounded-full"
              style={{ width: `${entry.progress}%` }}
            />
          </div>
        )}

        {entry.status === 'error' && (
          <p className="text-[11px] text-[#ef4444] mt-0.5">{entry.error}</p>
        )}
      </div>

      <div className={cn('shrink-0', statusColor)}>
        {entry.status === 'done'    && <CheckCircle size={16} />}
        {entry.status === 'error'   && <AlertCircle size={16} />}
        {(entry.status === 'uploading' || entry.status === 'pending') && (
          <span className="text-xs font-medium">{entry.progress}%</span>
        )}
      </div>
    </div>
  )
}

/* ══ UploadModal ════════════════════════════════════════════════ */
export default function UploadModal({ open, onClose, onUpload, uploads, uploading, existingNames, folderPath }) {
  const [dragOver,    setDragOver]    = useState(false)
  const [readyFiles,  setReadyFiles]  = useState([])   // File[] — valid, not duplicate
  const [duplicates,  setDuplicates]  = useState([])   // File[] — already exist in folder
  const [rejected,    setRejected]    = useState([])   // { file, error }[] — invalid type/size
  const [expiryIso,   setExpiryIso]   = useState(null) // ISO string or null
  const inputRef = useRef(null)

  const hasFiles     = readyFiles.length > 0 || duplicates.length > 0 || rejected.length > 0
  const allDone      = uploads.length > 0 && uploads.every(u => u.status === 'done' || u.status === 'error')
  const showDropZone = !hasFiles && uploads.length === 0

  // Auto-close 1 s after all uploads finish
  useEffect(() => {
    if (!allDone) return
    const t = setTimeout(() => {
      setReadyFiles([])
      setDuplicates([])
      setRejected([])
      setExpiryIso(null)
      onClose()
    }, 1000)
    return () => clearTimeout(t)
  }, [allDone, onClose])

  /* ── Categorise dropped/chosen files ───────────────────────── */
  const handleFiles = useCallback((files) => {
    if (!files?.length) return
    const arr = Array.from(files)

    const newReady = []
    const newDups  = []
    const newBad   = []

    arr.forEach(file => {
      const { valid, error } = validateFile(file)
      if (!valid) {
        newBad.push({ file, error })
      } else if (existingNames?.has(file.name)) {
        newDups.push(file)
      } else {
        newReady.push(file)
      }
    })

    setReadyFiles(newReady)
    setDuplicates(newDups)
    setRejected(newBad)
  }, [existingNames])

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  function handleClose() {
    setReadyFiles([])
    setDuplicates([])
    setRejected([])
    setExpiryIso(null)
    onClose()
  }

  function handleUpload() {
    if (!readyFiles.length) return
    onUpload(readyFiles, expiryIso)
  }

  /* ── Upload result summary ──────────────────────────────────── */
  const doneCount = allDone ? uploads.filter(u => u.status === 'done').length : 0
  const errCount  = allDone ? uploads.filter(u => u.status === 'error').length : 0

  return (
    <Modal open={open} onClose={handleClose} title="Upload Files" size="md" lockClose>
      <div className="flex flex-col gap-4">

        {/* Current upload destination */}
        {folderPath !== undefined && folderPath !== null && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-[var(--lt-surface)] border border-[var(--lt-divider)]">
            <Folder size={13} className="text-[var(--lt-accent)] shrink-0" fill="rgba(79,70,229,0.15)" />
            <span className="text-[10px] text-[var(--lt-text-subtle)] shrink-0">Uploading to:</span>
            <span className="text-[11px] text-[var(--lt-text-muted)] font-mono truncate">
              {folderPath === '' ? '/ (root)' : folderPath.split('/').filter(Boolean).pop()}
            </span>
          </div>
        )}

        {/* Limit info cards */}
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-[8px] bg-[var(--lt-surface)] border border-[var(--lt-divider)]">
            <Image size={14} className="text-[var(--lt-accent-light)] shrink-0" />
            <div>
              <p className="text-xs font-medium text-[var(--lt-text-primary)]">Images</p>
              <p className="text-[10px] text-[var(--lt-text-subtle)]">Max 30 MB · jpg png gif webp svg…</p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-[8px] bg-[var(--lt-surface)] border border-[var(--lt-divider)]">
            <Video size={14} className="text-[#f59e0b] shrink-0" />
            <div>
              <p className="text-xs font-medium text-[var(--lt-text-primary)]">Videos</p>
              <p className="text-[10px] text-[var(--lt-text-subtle)]">Max 100 MB · mp4 mov mkv webm…</p>
            </div>
          </div>
        </div>

        {/* Drop area — shown only before file selection */}
        {showDropZone && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-3 py-10 rounded-[10px] border-2 border-dashed cursor-pointer transition-all',
              dragOver
                ? 'border-[var(--lt-accent)] bg-[var(--lt-accent-muted)]/40'
                : 'border-[var(--lt-divider-light)] hover:border-[var(--lt-accent)]/50 hover:bg-[var(--lt-card-hover)]'
            )}
          >
            <div className="w-12 h-12 rounded-full bg-[var(--lt-card-hover)] border border-[var(--lt-divider-light)] flex items-center justify-center">
              <Upload size={22} className="text-[var(--lt-accent)]" />
            </div>
            <div className="text-center">
              <p className="text-sm text-[var(--lt-text-primary)] font-medium">Drag images & videos here or click to browse</p>
              <p className="text-xs text-[var(--lt-text-subtle)] mt-0.5">Images ≤ 30 MB · Videos ≤ 100 MB</p>
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

        {/* ── Pre-upload file lists (shown after selection, before upload click) ── */}
        {hasFiles && uploads.length === 0 && (
          <>
            {/* Ready to upload */}
            {readyFiles.length > 0 && (
              <div className="rounded-[8px] border border-[var(--lt-divider)] overflow-hidden">
                <div className="px-3 py-2 border-b border-[var(--lt-divider)] bg-[var(--lt-surface)]">
                  <p className="text-xs font-medium text-[#10b981]">
                    {readyFiles.length} file{readyFiles.length > 1 ? 's' : ''} ready to upload
                  </p>
                </div>
                <div className="max-h-44 overflow-y-auto">
                  {readyFiles.map((file, i) => (
                    <FileRow key={i} file={file} variant="ready" />
                  ))}
                </div>
              </div>
            )}

            {/* Duplicate files — skipped */}
            {duplicates.length > 0 && (
              <div className="rounded-[8px] border border-[#f59e0b]/30 overflow-hidden">
                <div className="px-3 py-2 border-b border-[#f59e0b]/20 bg-[#2d1a00]/30">
                  <p className="text-xs font-medium text-[#f59e0b]">
                    {duplicates.length} file{duplicates.length > 1 ? 's' : ''} already exist in this folder — will be skipped
                  </p>
                </div>
                <div className="max-h-36 overflow-y-auto">
                  {duplicates.map((file, i) => (
                    <FileRow key={i} file={file} variant="duplicate" error="File already exists in this folder" />
                  ))}
                </div>
              </div>
            )}

            {/* Rejected files — invalid type/size */}
            {rejected.length > 0 && (
              <div className="rounded-[8px] border border-[#ef4444]/30 overflow-hidden">
                <div className="px-3 py-2 border-b border-[#ef4444]/20 bg-[#450a0a]/20">
                  <p className="text-xs font-medium text-[#ef4444]">
                    {rejected.length} file{rejected.length > 1 ? 's' : ''} rejected
                  </p>
                </div>
                <div className="max-h-36 overflow-y-auto">
                  {rejected.map((r, i) => (
                    <FileRow key={i} file={r.file} variant="rejected" error={r.error} />
                  ))}
                </div>
              </div>
            )}

            {/* Expiry picker — only when there are files to upload */}
            {readyFiles.length > 0 && (
              <div className="px-3 py-3 rounded-[8px] bg-[var(--lt-surface)] border border-[var(--lt-divider)] space-y-2">
                <p className="text-xs font-medium text-[var(--lt-text-muted)]">
                  Expiry Date <span className="text-[var(--lt-text-subtle)] font-normal">(optional)</span>
                </p>
                <ExpiryPicker onChange={setExpiryIso} />
              </div>
            )}
          </>
        )}

        {/* ── Upload progress list ─────────────────────────────────── */}
        {uploads.length > 0 && (
          <div className="max-h-64 overflow-y-auto rounded-[8px] border border-[var(--lt-divider)] bg-[var(--lt-surface)]">
            {uploads.map(entry => (
              <UploadItem key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {/* ── Upload result summary ────────────────────────────────── */}
        {allDone && (
          <div className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-[8px] border',
            errCount === 0
              ? 'bg-[#064e3b]/30 border-[#10b981]/30'
              : doneCount > 0
              ? 'bg-[var(--lt-accent-muted)]/30 border-[var(--lt-accent)]/30'
              : 'bg-[#450a0a]/30 border-[#ef4444]/30'
          )}>
            {errCount === 0
              ? <CheckCircle size={14} className="text-[#10b981] shrink-0" />
              : <AlertCircle size={14} className="text-[var(--lt-accent-light)] shrink-0" />
            }
            <p className="text-xs text-[var(--lt-text-primary)]">
              {doneCount > 0 && `${doneCount} file${doneCount > 1 ? 's' : ''} uploaded successfully`}
              {doneCount > 0 && errCount > 0 && ' · '}
              {errCount > 0 && `${errCount} failed`}
            </p>
          </div>
        )}

        {/* ── Action buttons ───────────────────────────────────────── */}
        <div className="flex justify-end gap-2">
          {allDone ? (
            <Button variant="primary" size="sm" onClick={handleClose}>Done</Button>
          ) : uploads.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Cancel'}
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
              {showDropZone ? (
                <Button variant="primary" size="sm" onClick={() => inputRef.current?.click()}>
                  Choose Files
                </Button>
              ) : readyFiles.length > 0 ? (
                <Button variant="primary" size="sm" onClick={handleUpload}>
                  Upload {readyFiles.length} file{readyFiles.length !== 1 ? 's' : ''}
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
                  Choose Different Files
                </Button>
              )}
            </>
          )}
        </div>

      </div>
    </Modal>
  )
}
