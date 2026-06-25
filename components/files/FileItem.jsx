'use client'
// FileItem — last updated 2026-06-25

import { useState } from 'react'
import {
  Folder, FolderOpen, FileText, FileImage, FileVideo, FileAudio,
  File, Archive, Code, FileSpreadsheet, FileType2, Loader2, Clock,
} from 'lucide-react'
import { cn, formatBytes, getFileType, isImage } from '@/lib/utils'

function ExpiryBadge({ expiryAt, onEdit }) {
  const days = Math.ceil((new Date(expiryAt) - new Date()) / 86400000)
  const label = days <= 0 ? 'Expired' : `Exp: ${days}d`
  const cls   = days <= 0
    ? 'bg-red-500/20 text-red-400'
    : days <= 7
    ? 'bg-amber-500/20 text-amber-400'
    : 'bg-[#1e1b4b] text-[#818cf8]'

  return (
    <button
      onClick={e => { e.stopPropagation(); onEdit() }}
      title="Edit expiry"
      className={cn('flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full leading-none', cls)}
    >
      <Clock size={9} />
      {label}
    </button>
  )
}

const TYPE_ICONS = {
  image:        FileImage,
  video:        FileVideo,
  audio:        FileAudio,
  pdf:          FileText,
  doc:          FileText,
  spreadsheet:  FileSpreadsheet,
  presentation: FileType2,
  archive:      Archive,
  code:         Code,
  text:         FileText,
  file:         File,
}

const TYPE_COLORS = {
  image:        'text-[#818cf8]',
  video:        'text-[#f59e0b]',
  audio:        'text-[#10b981]',
  pdf:          'text-[#ef4444]',
  doc:          'text-[#3b82f6]',
  spreadsheet:  'text-[#10b981]',
  presentation: 'text-[#f97316]',
  archive:      'text-[#a3a3a3]',
  code:         'text-[#06b6d4]',
}

function FileTypeIcon({ name, size = 20, className }) {
  const type = getFileType(name)
  const Icon = TYPE_ICONS[type] ?? File
  return <Icon size={size} className={cn(TYPE_COLORS[type] ?? 'text-[#6b7280]', className)} />
}

function isVideo(name) {
  return getFileType(name) === 'video'
}

/* ─── Image thumbnail with loader + live-URL fallback (Task 11) ─── */
async function fetchLiveUrl(path) {
  const res = await fetch('/api/files', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ action: 'get-urls', paths: [path] }),
  })
  if (!res.ok) throw new Error()
  const { urls } = await res.json()
  return urls[0] ?? null
}

function GridImageThumb({ path, name }) {
  const [status,      setStatus]      = useState('loading') // loading | loaded | error | fallback
  const [liveUrl,     setLiveUrl]     = useState(null)
  const [fetchingUrl, setFetchingUrl] = useState(false)

  async function handleError() {
    if (fetchingUrl || liveUrl) { setStatus('error'); return }
    setFetchingUrl(true)
    try {
      const url = await fetchLiveUrl(path)
      if (url) {
        setLiveUrl(url)
        setStatus('fallback')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    } finally {
      setFetchingUrl(false)
    }
  }

  const src = liveUrl
    ? liveUrl
    : `/api/thumbnail?path=${encodeURIComponent(path)}`

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      {/* Loader shown while image is in-flight */}
      {(status === 'loading' || fetchingUrl) && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#111111] z-10">
          <Loader2 size={18} className="animate-spin text-[#4f46e5]" />
        </div>
      )}

      {status !== 'error' && (
        <img
          key={src}
          src={src}
          alt={name}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-200',
            status === 'loaded' || status === 'fallback' ? 'opacity-100' : 'opacity-0'
          )}
          loading="lazy"
          onLoad={() => setStatus(liveUrl ? 'fallback' : 'loaded')}
          onError={handleError}
        />
      )}

      {status === 'error' && (
        <FileTypeIcon name={name} size={36} />
      )}
    </div>
  )
}

function ListImageThumb({ path, name }) {
  const [status,      setStatus]      = useState('loading')
  const [liveUrl,     setLiveUrl]     = useState(null)
  const [fetchingUrl, setFetchingUrl] = useState(false)

  async function handleError() {
    if (fetchingUrl || liveUrl) { setStatus('error'); return }
    setFetchingUrl(true)
    try {
      const url = await fetchLiveUrl(path)
      if (url) { setLiveUrl(url); setStatus('loading') }
      else      setStatus('error')
    } catch {
      setStatus('error')
    } finally {
      setFetchingUrl(false)
    }
  }

  const src = liveUrl
    ? liveUrl
    : `/api/thumbnail?path=${encodeURIComponent(path)}`

  if (status === 'error') return <FileTypeIcon name={name} size={16} />

  return (
    <>
      {status === 'loading' && (
        <Loader2 size={12} className="animate-spin text-[#6b7280] absolute" />
      )}
      <img
        key={src}
        src={src}
        alt={name}
        className={cn(
          'w-8 h-8 object-cover rounded-[6px] transition-opacity',
          status === 'loaded' ? 'opacity-100' : 'opacity-0'
        )}
        loading="lazy"
        onLoad={() => setStatus('loaded')}
        onError={handleError}
      />
    </>
  )
}

/* ─── FileItem ────────────────────────────────────────────────────── */
export default function FileItem({
  item,
  isSelected,
  isCut,
  selectionIndex,
  view = 'grid',
  onSelect,
  onDoubleClick,
  onContextMenu,
  expiryRecord,
  onEditExpiry,
}) {
  const isFolder = item.tag === 'folder'

  // ── List view ────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div
        onClick={onSelect}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-[8px] cursor-pointer select-none',
          'border transition-all duration-100 group',
          isSelected
            ? 'bg-[#1e1b4b] border-[#4f46e5]/60'
            : 'bg-transparent border-transparent hover:bg-[#1c1c1c] hover:border-[#333333]',
          isCut && 'opacity-50'
        )}
      >
        {/* Thumbnail / icon */}
        <div className="relative w-8 h-8 shrink-0 flex items-center justify-center rounded-[6px] bg-[#161616] overflow-hidden">
          {isFolder ? (
            <Folder size={18} className="text-[#4f46e5]" fill="rgba(79,70,229,0.2)" />
          ) : isImage(item.name) ? (
            <ListImageThumb path={item.path} name={item.name} />
          ) : (
            <FileTypeIcon name={item.name} size={16} />
          )}
          {selectionIndex != null && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-[#4f46e5] text-white text-[9px] font-bold flex items-center justify-center shadow-lg z-10">
              {selectionIndex}
            </span>
          )}
        </div>

        {/* Name */}
        <span className="flex-1 text-sm text-[#f5f5f5] truncate">{item.name}</span>

        {/* Meta */}
        <div className="flex items-center gap-3 shrink-0">
          {expiryRecord && (
            <ExpiryBadge expiryAt={expiryRecord.expiryAt ?? expiryRecord.expiry_at} onEdit={onEditExpiry} />
          )}
          {item.folderSource && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e1b4b] text-[#818cf8] hidden sm:block">
              {item.folderSource}
            </span>
          )}
          {item.modified && (
            <span className="text-xs text-[#6b7280] hidden sm:block">
              {new Date(item.modified).toLocaleDateString()}
            </span>
          )}
          {item.size != null && (
            <span className="text-xs text-[#6b7280] w-16 text-right">{formatBytes(item.size)}</span>
          )}
          {isFolder && (
            <span className="text-xs text-[#6b7280] w-16 text-right">Folder</span>
          )}
        </div>
      </div>
    )
  }

  // ── Grid view ────────────────────────────────────────────────────
  return (
    <div
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      className={cn(
        'relative flex flex-col items-center gap-2 p-3 rounded-[10px] cursor-pointer select-none',
        'border transition-all duration-100 group',
        isSelected
          ? 'bg-[#1e1b4b] border-[#4f46e5]/70'
          : 'bg-[#161616] border-[#262626] hover:bg-[#1c1c1c] hover:border-[#333333]',
        isCut && 'opacity-50'
      )}
    >
      {selectionIndex != null && (
        <span className="absolute top-1.5 right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-[#4f46e5] text-white text-[10px] font-bold flex items-center justify-center shadow-lg z-10 ring-2 ring-[#1e1b4b]">
          {selectionIndex}
        </span>
      )}

      {/* Thumbnail / icon area */}
      <div className="w-full aspect-square rounded-[8px] flex items-center justify-center overflow-hidden bg-[#111111] relative">
        {isFolder ? (
          <Folder size={40} className="text-[#4f46e5]" fill="rgba(79,70,229,0.18)" />
        ) : isImage(item.name) ? (
          <GridImageThumb path={item.path} name={item.name} />
        ) : isVideo(item.name) ? (
          <div className="flex flex-col items-center gap-1">
            <FileVideo size={36} className="text-[#f59e0b]" />
            <span className="text-[8px] text-[#f59e0b]/70 font-medium">VIDEO</span>
          </div>
        ) : (
          <FileTypeIcon name={item.name} size={36} />
        )}

        {item.folderSource && (
          <span className="absolute bottom-1 left-1 text-[8px] px-1 py-0.5 rounded bg-[#0a0a0a]/80 text-[#818cf8] leading-none">
            {item.folderSource}
          </span>
        )}
      </div>

      {/* Name — shortened (Task 7) */}
      <span className="text-xs text-[#f5f5f5] text-center truncate w-full leading-tight">
        {item.name.length > 18 ? item.name.slice(0, 16) + '…' : item.name}
      </span>

      {item.size != null ? (
        <span className="text-[10px] text-[#6b7280]">{formatBytes(item.size)}</span>
      ) : isFolder ? (
        <span className="text-[10px] text-[#4f46e5]">Folder</span>
      ) : null}

      {expiryRecord && (
        <ExpiryBadge expiryAt={expiryRecord.expiryAt ?? expiryRecord.expiry_at} onEdit={onEditExpiry} />
      )}
    </div>
  )
}
