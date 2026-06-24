'use client'
// FileList — last updated 2026-06-24
// T8: sortable column headers (asc/desc per column), per-column search boxes
// T9: Link column, per-row Copy Link / Download / Rename / Delete buttons

import { useState, useMemo } from 'react'
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  Link2, Download, Pencil, Trash2, Loader2, Check, Minus,
  Folder,
  FileText, FileImage, FileVideo, FileAudio,
  File, Archive, Code, FileSpreadsheet, FileType2,
} from 'lucide-react'
import { cn, formatBytes, isImage, getFileType } from '@/lib/utils'
import FileItem from './FileItem'

/* ─── Per-row action buttons (Task 9) ────────────────────────────── */
function RowActions({ item, onRename, onDelete, onCopyUrl }) {
  const [copyState, setCopyState]     = useState('idle')  // idle | loading | done
  const [dlState,   setDlState]       = useState('idle')

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
    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
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
            : copyState === 'done' ? <Check size={11} />
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

      {/* Rename */}
      <button
        onClick={e => { e.stopPropagation(); onRename(item) }}
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
  sortBy,          // initial hint from parent
  onRowClick,      // row click: mode-aware (single vs multi)
  onToggleItem,    // checkbox click: always toggles (additive)
  onSelectAll,     // header checkbox: select all visible
  onClearSelection,// header checkbox: deselect all
  onNavigate,
  onContextMenu,
  // Task 9: row-level callbacks
  onRename,
  onDelete,
  onCopyUrl,
}) {
  // ── Column sort state (Task 8) ────────────────────────────────────
  const [colSort, setColSort] = useState({ col: sortBy || 'name', dir: 'asc' })

  function handleSort(col) {
    setColSort(prev =>
      prev.col === col
        ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { col, dir: 'asc' }
    )
  }

  // ── Per-column search state (Task 8) ─────────────────────────────
  const [colSearch, setColSearch] = useState({ name: '', type: '', modified: '', size: '' })

  function updateSearch(col, val) {
    setColSearch(prev => ({ ...prev, [col]: val }))
  }

  // ── Apply per-column search filter ────────────────────────────────
  function applyColFilters(items) {
    return items.filter(item => {
      const nm  = colSearch.name.trim().toLowerCase()
      const ty  = colSearch.type.trim().toLowerCase()
      const mo  = colSearch.modified.trim().toLowerCase()
      const sz  = colSearch.size.trim().toLowerCase()

      if (nm && !item.name.toLowerCase().includes(nm)) return false

      const ext = item.name.split('.').pop().toLowerCase()
      if (ty && !ext.includes(ty) && !(item.tag === 'folder' ? 'folder' : ext).includes(ty)) return false

      if (mo && item.modified) {
        const dateStr = new Date(item.modified).toLocaleDateString().toLowerCase()
        if (!dateStr.includes(mo)) return false
      }

      if (sz && item.size != null) {
        if (!formatBytes(item.size).toLowerCase().includes(sz)) return false
      }

      return true
    })
  }

  // ── Sort ──────────────────────────────────────────────────────────
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

  const sortedFolders = useMemo(() =>
    sortItems(applyColFilters(folders)), [folders, colSort, colSearch])
  const sortedFiles   = useMemo(() =>
    sortItems(applyColFilters(files)),   [files,   colSort, colSearch])

  const allItems = [...sortedFolders, ...sortedFiles]

  if (allItems.length === 0 && !Object.values(colSearch).some(Boolean)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[#a3a3a3] text-sm">This folder is empty</p>
      </div>
    )
  }

  const hasRowCallbacks = onRename && onDelete

  return (
    <div className="overflow-x-auto rounded-[8px] border border-[#1e1e1e]">
      <table className="w-full text-xs border-collapse">
        <thead>
          {/* ── Sort header row (Task 8) ── */}
          <tr className="bg-[#0d0d0d] border-b border-[#1e1e1e]">
            {/* Select-all header checkbox */}
            <th className="w-8 px-2 py-2" onClick={e => e.stopPropagation()}>
              {onSelectAll && (() => {
                const total = sortedFolders.length + sortedFiles.length
                const allSel = total > 0 && selectedItems.size >= total
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
            {/* Thumbnail column */}
            <th className="w-10 px-3 py-2" />

            <SortTh col="name"     label="Name"     colSort={colSort} onSort={handleSort} className="min-w-[180px]" />
            <SortTh col="type"     label="Type"     colSort={colSort} onSort={handleSort} className="w-20 hidden sm:table-cell" />
            <SortTh col="modified" label="Modified" colSort={colSort} onSort={handleSort} className="w-28 hidden md:table-cell" />
            <SortTh col="size"     label="Size"     colSort={colSort} onSort={handleSort} className="w-20 text-right" />
            {/* Link column header (Task 9) */}
            <th className="w-14 px-3 py-2 text-left text-[11px] font-semibold text-[#6b7280]">Link</th>
            {/* Actions */}
            {hasRowCallbacks && <th className="w-28 px-3 py-2" />}
          </tr>

          {/* ── Per-column search row (Task 8) ── */}
          <tr className="bg-[#0a0a0a] border-b border-[#262626]">
            {/* T3: empty cell for select-button column */}
            <td className="px-2 py-1.5" />
            <td className="px-3 py-1.5" />
            {(['name', 'type', 'modified', 'size']).map((col, i) => (
              <td
                key={col}
                className={cn(
                  'px-2 py-1.5',
                  (col === 'type')     && 'hidden sm:table-cell',
                  (col === 'modified') && 'hidden md:table-cell',
                )}
              >
                <input
                  value={colSearch[col]}
                  onChange={e => updateSearch(col, e.target.value)}
                  placeholder={`Filter…`}
                  className="w-full px-2 h-6 bg-[#111111] border border-[#262626] rounded-[5px] text-[10px] text-[#f5f5f5] placeholder-[#444] focus:outline-none focus:border-[#4f46e5] transition-colors"
                />
              </td>
            ))}
            <td className="px-2 py-1.5" />
            {hasRowCallbacks && <td className="px-2 py-1.5" />}
          </tr>
        </thead>

        <tbody>
          {allItems.length === 0 ? (
            <tr>
              <td colSpan={hasRowCallbacks ? 8 : 7} className="py-12 text-center text-xs text-[#6b7280]">
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
                onRename={onRename}
                onDelete={onDelete}
                onCopyUrl={onCopyUrl}
                hasRowCallbacks={hasRowCallbacks}
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
  onRename, onDelete, onCopyUrl,
  hasRowCallbacks,
}) {
  const isFolder = item.tag === 'folder'
  const ext      = isFolder ? 'Folder' : (item.name.split('.').pop()?.toUpperCase() ?? '—')

  return (
    <tr
      onClick={e => onRowClick?.(item, e)}
      onDoubleClick={() => isFolder && onNavigate(item.path)}
      onContextMenu={e => onContextMenu(e, item)}
      className={cn(
        'group/row border-b border-[#1a1a1a] last:border-0 cursor-pointer select-none transition-colors',
        isSelected ? 'bg-[#1e1b4b]' : 'hover:bg-[#141414]',
        isCut && 'opacity-50',
      )}
    >
      {/* Checkbox: always toggles item (additive), regardless of mode */}
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

      {/* Thumbnail + selection badge */}
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

      {/* Name */}
      <td className="px-3 py-2 min-w-[180px]">
        <span className="text-xs text-[#f5f5f5] truncate block max-w-[300px]" title={item.name}>
          {item.name.length > 40 ? item.name.slice(0, 38) + '…' : item.name}
        </span>
        {item.folderSource && (
          <span className="text-[9px] px-1 py-0.5 rounded bg-[#1e1b4b] text-[#818cf8] mt-0.5 inline-block">
            {item.folderSource}
          </span>
        )}
      </td>

      {/* Type */}
      <td className="px-3 py-2 w-20 hidden sm:table-cell">
        <span className="text-[10px] text-[#6b7280] font-mono">{ext}</span>
      </td>

      {/* Modified */}
      <td className="px-3 py-2 w-28 hidden md:table-cell">
        <span className="text-[10px] text-[#6b7280]">
          {item.modified ? new Date(item.modified).toLocaleDateString() : '—'}
        </span>
      </td>

      {/* Size */}
      <td className="px-3 py-2 w-20 text-right">
        <span className="text-[10px] text-[#6b7280]">
          {item.size != null ? formatBytes(item.size) : isFolder ? '—' : '—'}
        </span>
      </td>

      {/* Link column (Task 9) */}
      <td className="px-3 py-2 w-14">
        {!isFolder && (
          <span className="text-[9px] text-[#4f46e5] font-mono truncate block max-w-[80px]" title={item.path}>
            {item.path.split('/').pop()}
          </span>
        )}
      </td>

      {/* Row actions (Task 9) */}
      {hasRowCallbacks && (
        <td className="px-2 py-2 w-28">
          <RowActions
            item={item}
            onRename={onRename}
            onDelete={onDelete}
            onCopyUrl={onCopyUrl}
          />
        </td>
      )}
    </tr>
  )
}

/* ─── Inline image thumbnail with loader (used in list row) ─────── */
function ImageThumb({ path, name }) {
  const [status, setStatus] = useState('loading') // loading | loaded | error

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
