'use client'
// FileList — last updated 2026-07-23
// Browse-only rows: thumbnail, name, Download, Set Expiry, Delete.
// Copy-link and inline rename removed — not part of the catalog's billed
// feature set (see data/tools.js's link-generator entry).

import { useState, useMemo } from 'react'
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  Download, Trash2, Loader2, Check, Minus,
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
  image: 'text-[var(--lt-accent-light)]', video: 'text-[#f59e0b]', audio: 'text-[#10b981]',
  pdf: 'text-[#ef4444]', doc: 'text-[#3b82f6]', spreadsheet: 'text-[#10b981]',
  presentation: 'text-[#f97316]', archive: 'text-[var(--lt-text-muted)]', code: 'text-[#06b6d4]',
}

function FileTypeIcon({ name, size = 16, className }) {
  const type = getFileType(name)
  const Icon = TYPE_ICONS[type] ?? File
  return <Icon size={size} className={cn(TYPE_COLORS[type] ?? 'text-[var(--lt-text-subtle)]', className)} />
}

/* ─── Inline image thumbnail with loader ────────────────────────── */
function ImageThumb({ path, name }) {
  const [status, setStatus] = useState('loading')

  return (
    <>
      {status === 'loading' && (
        <Loader2 size={14} className="animate-spin text-[var(--lt-text-subtle)] absolute" />
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
    : 'bg-[var(--lt-accent-muted)] text-[var(--lt-accent-light)]'
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
function RowActions({ item, onDelete, expiryRecord, onEditExpiry }) {
  const [dlState, setDlState] = useState('idle')

  const isFolder = item.tag === 'folder'

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

      {/* Download */}
      {!isFolder && (
        <button
          onClick={handleDownload}
          disabled={dlState === 'loading'}
          title="Download"
          className="w-6 h-6 flex items-center justify-center rounded-[5px] text-[var(--lt-text-subtle)] hover:text-[var(--lt-accent)] hover:bg-[var(--lt-accent-muted)] transition-colors"
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
              ? 'text-[var(--lt-accent-light)] bg-[var(--lt-accent-muted)] hover:bg-[var(--lt-accent-muted)]/70'
              : 'text-[var(--lt-text-subtle)] hover:text-[var(--lt-accent-light)] hover:bg-[var(--lt-accent-muted)]'
          )}
        >
          <Clock size={11} />
        </button>
      )}

      {/* Delete */}
      <button
        onClick={e => { e.stopPropagation(); onDelete([item.path]) }}
        title="Delete"
        className="w-6 h-6 flex items-center justify-center rounded-[5px] text-[var(--lt-text-subtle)] hover:text-[#ef4444] hover:bg-[#450a0a] transition-colors"
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
      <button className="flex items-center gap-1 text-[11px] font-semibold text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-muted)] transition-colors whitespace-nowrap cursor-pointer">
        {label}
        {active
          ? dir === 'asc'
            ? <ChevronUp   size={11} className="text-[var(--lt-accent-light)]" />
            : <ChevronDown size={11} className="text-[var(--lt-accent-light)]" />
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
  sortBy,
  onRowClick,
  onToggleItem,
  onSelectAll,
  onClearSelection,
  onNavigate,
  onContextMenu,
  onDelete,
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

  if (allItems.length === 0 && !Object.values(colSearch).some(Boolean)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[var(--lt-text-muted)] text-sm">This folder is empty</p>
      </div>
    )
  }

  const hasRowCallbacks = !!onDelete

  return (
    <div className="overflow-x-auto rounded-[8px] border border-[var(--lt-divider)]">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-[var(--lt-surface)] border-b border-[var(--lt-divider)]">
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
                      allSel   ? 'bg-[var(--lt-accent)] border-[var(--lt-accent)]'
                      : partial ? 'border-[var(--lt-accent)] bg-transparent'
                      :           'border-[var(--lt-divider-light)] hover:border-[var(--lt-accent)] bg-transparent'
                    )}
                  >
                    {allSel   && <Check size={11} className="text-white" />}
                    {partial  && <Minus size={11} className="text-[var(--lt-accent-light)]" />}
                  </button>
                )
              })()}
            </th>
            <th className="w-10 px-3 py-2" />
            <SortTh col="name" label="Name" colSort={colSort} onSort={handleSort} className="min-w-[180px]" />
            {hasRowCallbacks && <th className="w-28 px-3 py-2" />}
          </tr>
        </thead>

        <tbody>
          {allItems.length === 0 ? (
            <tr>
              <td colSpan={hasRowCallbacks ? 4 : 3} className="py-12 text-center text-xs text-[var(--lt-text-subtle)]">
                No results match your filters
              </td>
            </tr>
          ) : (
            allItems.map(item => (
              <ListRow
                key={item.id ?? item.path}
                item={item}
                isSelected={selectedItems.has(item.path)}
                selectionIndex={selectionOrder?.get(item.path)}
                onRowClick={onRowClick}
                onToggleItem={onToggleItem}
                onNavigate={onNavigate}
                onContextMenu={onContextMenu}
                onDelete={onDelete}
                hasRowCallbacks={hasRowCallbacks}
                expiryRecord={expiryMap?.get(item.name)}
                onEditExpiry={onEditExpiry ? () => onEditExpiry(item) : undefined}
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
  isSelected, selectionIndex,
  onRowClick, onToggleItem, onNavigate, onContextMenu,
  onDelete,
  hasRowCallbacks,
  expiryRecord, onEditExpiry,
}) {
  const isFolder = item.tag === 'folder'

  return (
    <tr
      onClick={e => onRowClick?.(item, e)}
      onDoubleClick={() => isFolder && onNavigate(item.path)}
      onContextMenu={e => onContextMenu(e, item)}
      className={cn(
        'group/row border-b border-[var(--lt-divider)] last:border-0 cursor-pointer select-none transition-colors',
        isSelected ? 'bg-[var(--lt-accent-muted)]' : 'hover:bg-[var(--lt-surface)]',
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
              ? 'bg-[var(--lt-accent)] border-[var(--lt-accent)]'
              : 'border-[var(--lt-divider-light)] hover:border-[var(--lt-accent)] bg-transparent'
          )}
        >
          {isSelected && <Check size={11} className="text-white" />}
        </button>
      </td>

      {/* Thumbnail */}
      <td className="px-3 py-2 w-10">
        <div className="relative w-8 h-8 shrink-0 flex items-center justify-center rounded-[6px] bg-[var(--lt-card)]">
          {isFolder ? (
            <Folder size={18} className="text-[var(--lt-accent)]" fill="rgba(79,70,229,0.2)" />
          ) : isImage(item.name) ? (
            <ImageThumb path={item.path} name={item.name} />
          ) : (
            <FileTypeIcon name={item.name} size={16} />
          )}
          {selectionIndex != null && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-[var(--lt-accent)] text-white text-[9px] font-bold flex items-center justify-center shadow-lg z-10">
              {selectionIndex}
            </span>
          )}
        </div>
      </td>

      {/* Name */}
      <td className="px-3 py-2 min-w-[180px] w-full">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-[var(--lt-text-primary)] truncate max-w-[260px]" title={item.name}>
            {item.name.length > 40 ? item.name.slice(0, 38) + '…' : item.name}
          </span>
          {item.folderSource && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-[var(--lt-accent-muted)] text-[var(--lt-accent-light)] shrink-0">
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
      </td>

      {/* Row actions — Download / Expiry / Delete */}
      {hasRowCallbacks && (
        <td className="px-2 py-2 w-28" onClick={e => e.stopPropagation()}>
          <RowActions
            item={item}
            onDelete={onDelete}
            expiryRecord={expiryRecord}
            onEditExpiry={onEditExpiry}
          />
        </td>
      )}
    </tr>
  )
}
