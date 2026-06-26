'use client'
// FileList — last updated 2026-06-25
// T3: "Copy Name" button on every row (copies filename without extension)
// T4: Inline file rename — no modal, extension preserved, auto-save on switch

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  Link2, Download, Pencil, Trash2, Loader2, Check, Minus,
  Folder, Clock,
  FileText, FileImage, FileVideo, FileAudio,
  File, Archive, Code, FileSpreadsheet, FileType2,
} from 'lucide-react'
import { cn, formatBytes, isImage, getFileType } from '@/lib/utils'

/* ─── File type icon helpers ─────────────────────────────────────── */
const TYPE_ICONS = {
  image: FileImage, video: FileVideo, audio: FileAudio,
  pdf: FileText, doc: FileText, spreadsheet: FileSpreadsheet,
  presentation: FileType2, archive: Archive, code: Code, text: FileText, file: File,
}
const TYPE_COLORS = {
  image: 'text-[#818cf8]', video: 'text-[#f59e0b]', audio: 'text-[#10b981]',
  pdf: 'text-[#ef4444]', doc: 'text-[#3b82f6]', spreadsheet: 'text-[#10b981]',
  presentation: 'text-[#f97316]', archive: 'text-[#a3a3a3]', code: 'text-[#06b6d4]',
}

function FileTypeIcon({ name, size = 16, className }) {
  const type = getFileType(name)
  const Icon = TYPE_ICONS[type] ?? File
  return <Icon size={size} className={cn(TYPE_COLORS[type] ?? 'text-[#6b7280]', className)} />
}

/* ─── Inline image thumbnail with loader ────────────────────────── */
function ImageThumb({ path, name }) {
  const [status, setStatus] = useState('loading')

  return (
    <>
      {status === 'loading' && (
        <Loader2 size={14} className="animate-spin text-[#6b7280] absolute" />
      )}
      <img
        src={`/api/thumbnail?path=${encodeURIComponent(path)}`}
        alt={name}
        className={cn('w-8 h-8 object-cover rounded-[6px] transition-opacity', status === 'loaded' ? 'opacity-100' : 'opacity-0')}
        loading="lazy"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
      {status === 'error' && <FileTypeIcon name={name} size={16} />}
    </>
  )
}

/* ─── Expiry badge ───────────────────────────────────────────────── */
function formatExpiryLabel(days) {
  if (days <= 0)  return 'Expired'
  if (days < 7)   return `${days}d`
  if (days < 30)  return `${Math.floor(days / 7)}w`
  if (days < 365) return `${Math.floor(days / 30)}mo`
  return `${Math.floor(days / 365)}y`
}

function ExpiryBadge({ expiryAt, onEdit }) {
  const days     = Math.ceil((new Date(expiryAt) - new Date()) / 86400000)
  const label    = formatExpiryLabel(days)
  const fullDate = new Date(expiryAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const cls = days <= 0
    ? 'bg-red-500/20 text-red-400'
    : days <= 7
    ? 'bg-amber-500/20 text-amber-400'
    : days <= 30
    ? 'bg-yellow-500/15 text-yellow-400'
    : 'bg-[#1e1b4b] text-[#818cf8]'
  return (
    <button
      onClick={e => { e.stopPropagation(); onEdit() }}
      title={`Expires: ${fullDate}`}
      className={cn('flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full leading-none shrink-0', cls)}
    >
      <Clock size={9} />
      {label}
    </button>
  )
}

/* ─── Per-row action buttons (always visible) ───────────────────── */
function RowActions({ item, onDelete, onTriggerInlineRename, expiryRecord, onEditExpiry }) {
  const [copyState, setCopyState] = useState('idle')  // idle | loading | done
  const [dlState,   setDlState]   = useState('idle')

  const isFolder = item.tag === 'folder'

  async function handleCopyLink(e) {
    e.stopPropagation()
    if (isFolder) return
    setCopyState('loading')
    try {
      const res = await fetch('/api/files', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'get-urls', paths: [item.path] }),
      })
      if (!res.ok) throw new Error()
      const { urls } = await res.json()
      await navigator.clipboard.writeText(urls[0])
      setCopyState('done')
      setTimeout(() => setCopyState('idle'), 1800)
    } catch {
      setCopyState('idle')
    }
  }

  async function handleDownload(e) {
    e.stopPropagation()
    if (isFolder) return
    setDlState('loading')
    try {
      const res = await fetch('/api/files', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'get-urls', paths: [item.path] }),
      })
      if (!res.ok) throw new Error()
      const { urls } = await res.json()
      const dlUrl = (urls[0] ?? '').replace('?raw=1', '?dl=1').replace('raw=1', 'dl=1')
      window.open(dlUrl, '_blank', 'noreferrer')
    } catch {
      // silent
    } finally {
      setDlState('idle')
    }
  }

  return (
    <div className="flex items-center gap-0.5 shrink-0">

      {/* Copy link */}
      {!isFolder && (
        <button
          onClick={handleCopyLink}
          disabled={copyState === 'loading'}
          title="Copy link"
          className={cn(
            'w-6 h-6 flex items-center justify-center rounded-[5px] transition-colors',
            copyState === 'done'
              ? 'text-[#10b981] bg-[#064e3b]'
              : 'text-[#6b7280] hover:text-[#818cf8] hover:bg-[#1e1b4b]'
          )}
        >
          {copyState === 'loading' ? <Loader2 size={11} className="animate-spin" />
            : copyState === 'done'  ? <Check   size={11} />
            : <Link2 size={11} />}
        </button>
      )}

      {/* Download */}
      {!isFolder && (
        <button
          onClick={handleDownload}
          disabled={dlState === 'loading'}
          title="Download"
          className="w-6 h-6 flex items-center justify-center rounded-[5px] text-[#6b7280] hover:text-[#4f46e5] hover:bg-[#1e1b4b] transition-colors"
        >
          {dlState === 'loading'
            ? <Loader2 size={11} className="animate-spin" />
            : <Download size={11} />}
        </button>
      )}

      {/* Set / edit expiry — shown for files only */}
      {!isFolder && onEditExpiry && (
        <button
          onClick={e => { e.stopPropagation(); onEditExpiry() }}
          title={expiryRecord ? 'Edit expiry' : 'Set expiry'}
          className={cn(
            'w-6 h-6 flex items-center justify-center rounded-[5px] transition-colors',
            expiryRecord
              ? 'text-[#818cf8] bg-[#1e1b4b] hover:bg-[#2d2a6e]'
              : 'text-[#6b7280] hover:text-[#818cf8] hover:bg-[#1e1b4b]'
          )}
        >
          <Clock size={11} />
        </button>
      )}

      {/* T4: Rename — triggers inline rename, not modal */}
      <button
        onClick={e => { e.stopPropagation(); onTriggerInlineRename(item) }}
        title="Rename"
        className="w-6 h-6 flex items-center justify-center rounded-[5px] text-[#6b7280] hover:text-[#f5f5f5] hover:bg-[#262626] transition-colors"
      >
        <Pencil size={11} />
      </button>

      {/* Delete */}
      <button
        onClick={e => { e.stopPropagation(); onDelete([item.path]) }}
        title="Delete"
        className="w-6 h-6 flex items-center justify-center rounded-[5px] text-[#6b7280] hover:text-[#ef4444] hover:bg-[#450a0a] transition-colors"
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}

/* ─── Sort header cell ────────────────────────────────────────────── */
function SortTh({ col, label, colSort, onSort, className }) {
  const active = colSort.col === col
  const dir    = colSort.dir

  return (
    <th
      className={cn('px-3 py-2 text-left select-none', className)}
      onClick={() => onSort(col)}
    >
      <button className="flex items-center gap-1 text-[11px] font-semibold text-[#6b7280] hover:text-[#a3a3a3] transition-colors whitespace-nowrap cursor-pointer">
        {label}
        {active
          ? dir === 'asc'
            ? <ChevronUp   size={11} className="text-[#818cf8]" />
            : <ChevronDown size={11} className="text-[#818cf8]" />
          : <ChevronsUpDown size={11} className="opacity-40" />
        }
      </button>
    </th>
  )
}

/* ─── FileList ────────────────────────────────────────────────────── */
export default function FileList({
  folders = [],
  files   = [],
  selectedItems,
  selectionOrder,
  cutPaths,
  sortBy,
  onRowClick,
  onToggleItem,
  onSelectAll,
  onClearSelection,
  onNavigate,
  onContextMenu,
  onDelete,
  onCopyUrl,
  onRenamed,   // T4: called after a successful inline rename (use to refetch)
  expiryMap,   // Map<fileName, expiryRecord> — optional
  onEditExpiry, // (item) => void — open expiry modal for a file
}) {
  // ── Column sort ───────────────────────────────────────────────────
  const [colSort, setColSort] = useState({ col: sortBy || 'name', dir: 'asc' })
  function handleSort(col) {
    setColSort(prev =>
      prev.col === col
        ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { col, dir: 'asc' }
    )
  }

  // ── Per-column search ─────────────────────────────────────────────
  const [colSearch, setColSearch] = useState({ name: '', type: '', modified: '', size: '' })
  function updateSearch(col, val) {
    setColSearch(prev => ({ ...prev, [col]: val }))
  }

  function applyColFilters(items) {
    return items.filter(item => {
      const nm = colSearch.name.trim().toLowerCase()
      const ty = colSearch.type.trim().toLowerCase()
      const mo = colSearch.modified.trim().toLowerCase()
      const sz = colSearch.size.trim().toLowerCase()
      if (nm && !item.name.toLowerCase().includes(nm)) return false
      const ext = item.name.split('.').pop().toLowerCase()
      if (ty && !ext.includes(ty) && !(item.tag === 'folder' ? 'folder' : ext).includes(ty)) return false
      if (mo && item.modified) {
        if (!new Date(item.modified).toLocaleDateString().toLowerCase().includes(mo)) return false
      }
      if (sz && item.size != null) {
        if (!formatBytes(item.size).toLowerCase().includes(sz)) return false
      }
      return true
    })
  }

  function sortItems(items) {
    return [...items].sort((a, b) => {
      let cmp = 0
      const { col, dir } = colSort
      if (col === 'name') {
        cmp = a.name.localeCompare(b.name)
      } else if (col === 'type') {
        const ea = a.tag === 'folder' ? 'folder' : (a.name.split('.').pop() ?? '')
        const eb = b.tag === 'folder' ? 'folder' : (b.name.split('.').pop() ?? '')
        cmp = ea.localeCompare(eb)
      } else if (col === 'modified') {
        cmp = new Date(a.modified ?? 0) - new Date(b.modified ?? 0)
      } else if (col === 'size') {
        cmp = (a.size ?? 0) - (b.size ?? 0)
      }
      return dir === 'asc' ? cmp : -cmp
    })
  }

  const sortedFolders = useMemo(() => sortItems(applyColFilters(folders)), [folders, colSort, colSearch])
  const sortedFiles   = useMemo(() => sortItems(applyColFilters(files)),   [files,   colSort, colSearch])
  const allItems      = [...sortedFolders, ...sortedFiles]

  // ── T4: Inline rename state ───────────────────────────────────────
  const [inlineRenameItem, setInlineRenameItem] = useState(null)
  const [inlineRenameName, setInlineRenameName] = useState('')
  const [inlineRenameBusy, setInlineRenameBusy] = useState(false)

  const doInlineRename = useCallback(async (item, name) => {
    const trimmed = name.trim()
    if (!trimmed) { setInlineRenameItem(null); setInlineRenameName(''); return }

    const ext     = item.tag === 'file' ? (item.name.match(/\.[^/.]+$/) ?? [''])[0] : ''
    const newName = trimmed + ext

    if (newName === item.name) { setInlineRenameItem(null); setInlineRenameName(''); return }

    setInlineRenameBusy(true)
    try {
      const res = await fetch('/api/files', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ path: item.path, newName }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setInlineRenameItem(null)
      setInlineRenameName('')
      onRenamed?.()
    } catch {
      // keep open so user can fix; don't clear
    } finally {
      setInlineRenameBusy(false)
    }
  }, [onRenamed])

  // T4: Trigger inline rename — auto-save existing open rename first
  const handleTriggerInlineRename = useCallback(async (item) => {
    if (inlineRenameItem && inlineRenameItem.path !== item.path) {
      await doInlineRename(inlineRenameItem, inlineRenameName)
    }
    const initialName = item.tag === 'file'
      ? item.name.replace(/\.[^/.]+$/, '')
      : item.name
    setInlineRenameItem(item)
    setInlineRenameName(initialName)
  }, [inlineRenameItem, inlineRenameName, doInlineRename])

  const handleSaveInlineRename = useCallback(() => {
    if (inlineRenameItem) doInlineRename(inlineRenameItem, inlineRenameName)
  }, [inlineRenameItem, inlineRenameName, doInlineRename])

  const handleCancelInlineRename = useCallback(() => {
    setInlineRenameItem(null)
    setInlineRenameName('')
  }, [])

  if (allItems.length === 0 && !Object.values(colSearch).some(Boolean)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[#a3a3a3] text-sm">This folder is empty</p>
      </div>
    )
  }

  const hasRowCallbacks = !!onDelete

  return (
    <div className="overflow-x-auto rounded-[8px] border border-[#1e1e1e]">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-[#0d0d0d] border-b border-[#1e1e1e]">
            <th className="w-8 px-2 py-2" onClick={e => e.stopPropagation()}>
              {onSelectAll && (() => {
                const total   = sortedFolders.length + sortedFiles.length
                const allSel  = total > 0 && selectedItems.size >= total
                const partial = !allSel && selectedItems.size > 0
                return (
                  <button
                    onClick={() => allSel ? onClearSelection?.() : onSelectAll?.()}
                    title={allSel ? 'Deselect all' : 'Select all'}
                    className={cn(
                      'w-5 h-5 rounded-[4px] border-2 flex items-center justify-center transition-all shrink-0',
                      allSel   ? 'bg-[#4f46e5] border-[#4f46e5]'
                      : partial ? 'border-[#4f46e5] bg-transparent'
                      :           'border-[#333333] hover:border-[#4f46e5] bg-transparent'
                    )}
                  >
                    {allSel   && <Check size={11} className="text-white" />}
                    {partial  && <Minus size={11} className="text-[#818cf8]" />}
                  </button>
                )
              })()}
            </th>
            <th className="w-10 px-3 py-2" />
            <SortTh col="name" label="Name" colSort={colSort} onSort={handleSort} className="min-w-[180px]" />
            <th className="w-14 px-3 py-2 text-left text-[11px] font-semibold text-[#6b7280]">Link</th>
            {hasRowCallbacks && <th className="w-36 px-3 py-2" />}
          </tr>
        </thead>

        <tbody>
          {allItems.length === 0 ? (
            <tr>
              <td colSpan={hasRowCallbacks ? 5 : 4} className="py-12 text-center text-xs text-[#6b7280]">
                No results match your filters
              </td>
            </tr>
          ) : (
            allItems.map(item => (
              <ListRow
                key={item.id ?? item.path}
                item={item}
                isSelected={selectedItems.has(item.path)}
                isCut={cutPaths?.has(item.path)}
                selectionIndex={selectionOrder?.get(item.path)}
                onRowClick={onRowClick}
                onToggleItem={onToggleItem}
                onNavigate={onNavigate}
                onContextMenu={onContextMenu}
                onDelete={onDelete}
                onCopyUrl={onCopyUrl}
                hasRowCallbacks={hasRowCallbacks}
                expiryRecord={expiryMap?.get(item.name)}
                onEditExpiry={onEditExpiry ? () => onEditExpiry(item) : undefined}
                // T4: inline rename
                isRenaming={inlineRenameItem?.path === item.path}
                inlineRenameName={inlineRenameName}
                inlineRenameBusy={inlineRenameBusy}
                onTriggerInlineRename={handleTriggerInlineRename}
                onInlineRenameNameChange={setInlineRenameName}
                onSaveInlineRename={handleSaveInlineRename}
                onCancelInlineRename={handleCancelInlineRename}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Single list row ─────────────────────────────────────────────── */
function ListRow({
  item,
  isSelected, isCut, selectionIndex,
  onRowClick, onToggleItem, onNavigate, onContextMenu,
  onDelete, onCopyUrl,
  hasRowCallbacks,
  expiryRecord, onEditExpiry,
  // T4: inline rename props
  isRenaming, inlineRenameName, inlineRenameBusy,
  onTriggerInlineRename, onInlineRenameNameChange,
  onSaveInlineRename, onCancelInlineRename,
}) {
  const isFolder = item.tag === 'folder'
  const ext      = isFolder ? '' : (item.name.match(/\.[^/.]+$/) ?? [''])[0]

  const inputRef = useRef(null)
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  return (
    <tr
      onClick={e => isRenaming ? e.stopPropagation() : onRowClick?.(item, e)}
      onDoubleClick={() => !isRenaming && isFolder && onNavigate(item.path)}
      onContextMenu={e => onContextMenu(e, item)}
      className={cn(
        'group/row border-b border-[#1a1a1a] last:border-0 cursor-pointer select-none transition-colors',
        isSelected ? 'bg-[#1e1b4b]' : 'hover:bg-[#141414]',
        isCut && 'opacity-50',
        isRenaming && 'bg-[#0f0f1a]',
      )}
    >
      {/* Checkbox */}
      <td className="px-2 py-2 w-8" onClick={e => e.stopPropagation()}>
        <button
          onClick={e => { e.stopPropagation(); onToggleItem?.(item) }}
          title={isSelected ? 'Deselect' : 'Select'}
          className={cn(
            'w-5 h-5 rounded-[4px] border-2 flex items-center justify-center transition-all shrink-0',
            isSelected
              ? 'bg-[#4f46e5] border-[#4f46e5]'
              : 'border-[#333333] hover:border-[#4f46e5] bg-transparent'
          )}
        >
          {isSelected && <Check size={11} className="text-white" />}
        </button>
      </td>

      {/* Thumbnail */}
      <td className="px-3 py-2 w-10">
        <div className="relative w-8 h-8 shrink-0 flex items-center justify-center rounded-[6px] bg-[#161616]">
          {isFolder ? (
            <Folder size={18} className="text-[#4f46e5]" fill="rgba(79,70,229,0.2)" />
          ) : isImage(item.name) ? (
            <ImageThumb path={item.path} name={item.name} />
          ) : (
            <FileTypeIcon name={item.name} size={16} />
          )}
          {selectionIndex != null && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-[#4f46e5] text-white text-[9px] font-bold flex items-center justify-center shadow-lg z-10">
              {selectionIndex}
            </span>
          )}
        </div>
      </td>

      {/* Name — T4: inline input when renaming */}
      <td
        className="px-3 py-2 min-w-[180px] w-full"
        onClick={e => isRenaming && e.stopPropagation()}
      >
        {isRenaming ? (
          <form
            onSubmit={e => { e.preventDefault(); onSaveInlineRename() }}
            className="flex items-center gap-1.5"
          >
            <input
              ref={inputRef}
              value={inlineRenameName}
              onChange={e => onInlineRenameNameChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') { e.preventDefault(); onCancelInlineRename() }
                if (e.key === 'Enter')  { e.preventDefault(); onSaveInlineRename() }
              }}
              className="flex-1 min-w-0 px-2 py-0.5 text-xs bg-[#0a0a0a] border border-[#4f46e5] rounded-[5px] text-[#f5f5f5] focus:outline-none"
            />
            {/* Show extension as read-only hint for files */}
            {!isFolder && ext && (
              <span className="text-[10px] text-[#6b7280] shrink-0 font-mono">{ext}</span>
            )}
            <button
              type="submit"
              disabled={inlineRenameBusy || !inlineRenameName.trim()}
              className="w-5 h-5 flex items-center justify-center rounded-[4px] bg-[#4f46e5] text-white disabled:opacity-40 shrink-0 hover:bg-[#4338ca] transition-colors"
            >
              {inlineRenameBusy ? <Loader2 size={9} className="animate-spin" /> : <Check size={9} />}
            </button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onCancelInlineRename() }}
              className="w-5 h-5 flex items-center justify-center rounded-[4px] text-[#6b7280] hover:text-[#f5f5f5] hover:bg-[#262626] shrink-0 transition-colors"
            >
              <X size={9} />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-[#f5f5f5] truncate max-w-[260px]" title={item.name}>
              {item.name.length > 40 ? item.name.slice(0, 38) + '…' : item.name}
            </span>
            {item.folderSource && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-[#1e1b4b] text-[#818cf8] shrink-0">
                {item.folderSource}
              </span>
            )}
            {expiryRecord && onEditExpiry && (
              <ExpiryBadge
                expiryAt={expiryRecord.expiryAt ?? expiryRecord.expiry_at}
                onEdit={onEditExpiry}
              />
            )}
          </div>
        )}
      </td>

      {/* Link column — empty, reserved for extension */}
      <td className="px-3 py-2 w-14" />

      {/* Row actions — T3 Copy Name + T4 inline rename trigger */}
      {hasRowCallbacks && (
        <td className="px-2 py-2 w-36" onClick={e => e.stopPropagation()}>
          <RowActions
            item={item}
            onDelete={onDelete}
            onCopyUrl={onCopyUrl}
            onTriggerInlineRename={onTriggerInlineRename}
            expiryRecord={expiryRecord}
            onEditExpiry={onEditExpiry}
          />
        </td>
      )}
    </tr>
  )
}

// ─── X icon (needed for inline form) ───────────────────────────────
function X({ size, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}
