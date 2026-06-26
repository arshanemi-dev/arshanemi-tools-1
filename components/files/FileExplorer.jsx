'use client'
// FileExplorer — last updated 2026-06-25
// T1: right panel shows ONLY files (no sub-folders rendered)
// T2: recursive file listing — every file in selected folder tree appears
// T3: per-row checkbox in FileList
// Toolbar: single row — search · count · Copy Excel · Copy List · Delete · Upload

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Search, X, RefreshCw, PanelLeftClose, PanelLeftOpen,
  Upload, Trash2, Table2, List as ListIcon, Loader2, Layers2, Copy, Clock,
  FolderOpen, FileX,
} from 'lucide-react';

import { useFiles }           from '@/hooks/useFiles'
import { useAuthGate }        from '@/hooks/useAuthGate'
import { useSelection }       from '@/hooks/useSelection'
import { useClipboard }       from '@/hooks/useClipboard'
import { useContextMenu }     from '@/hooks/useContextMenu'
import { useUpload }          from '@/hooks/useUpload'
import { cn }                 from '@/lib/utils'
import { useSelectedFiles }   from '@/context/SelectedFilesContext'

import AuthGate            from './AuthGate'
import FolderTree          from './FolderTree'
import FileGrid            from './FileGrid'
import FileList            from './FileList'
import SelectionBar        from './SelectionBar'
import ContextMenu         from './ContextMenu'
import CreateFolderModal   from './CreateFolderModal'
import RenameModal         from './RenameModal'
import DeleteConfirmModal  from './DeleteConfirmModal'
import UploadModal         from './UploadModal'
import CopyUrlsModal       from './CopyUrlsModal'
import DropZone            from './DropZone'
import Spinner             from '@/components/ui/Spinner'
import ExpiryModal         from '@/components/ui/ExpiryModal'

const GROUP_SIZES = [1, 2, 3, 4]

/* ── T2: BFS recursive file fetcher ──────────────────────────────── */
async function fetchAllFilesRecursive(rootPaths) {
  const allFiles = []
  const queue    = [...rootPaths]

  while (queue.length > 0) {
    const batch   = queue.splice(0, 5)
    const results = await Promise.all(
      batch.map(p =>
        fetch(`/api/files?path=${encodeURIComponent(p)}`)
          .then(r => r.ok ? r.json() : { folders: [], files: [] })
          .catch(() => ({ folders: [], files: [] }))
      )
    )
    results.forEach(data => {
      allFiles.push(...(data.files  ?? []))
      queue.push(  ...(data.folders ?? []).map(f => f.path))
    })
  }

  return allFiles
}

/* ── Single-row toolbar ───────────────────────────────────────────── */
function RightToolbar({
  search, onSearchChange,
  onUpload, uploadDisabled, uploadTitle,
  selectedCount, fileCount,
  onDeleteSelected, deleting,
  onEditExpiry,
  onCopyExcel,  copyingExcel,
  onCopyNames,  copyingNames,
  onCopyList,   copyingList,
  multiSelectMode, onToggleMultiSelect,
  groupSize, onGroupSizeChange,
}) {
  const hasSelection    = selectedCount > 1
  const hasAnySelected  = selectedCount > 0

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--lt-divider)] bg-[var(--lt-surface)] shrink-0">

      {/* Search */}
      <div className="relative w-52 shrink-0">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--lt-text-subtle)]" />
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search files…"
          className="w-full pl-8 pr-7 h-8 bg-[var(--lt-surface)] border border-[var(--lt-divider)] rounded-[8px] text-xs text-[var(--lt-text-primary)] placeholder-[var(--lt-text-subtle)] focus:outline-none focus:border-[var(--lt-accent)] transition-colors"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)]"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* File / selection count */}
      {fileCount > 0 && (
        <span className="text-[10px] text-[var(--lt-text-subtle)] shrink-0 whitespace-nowrap">
          {fileCount} file{fileCount !== 1 ? 's' : ''}
          {hasSelection && (
            <span className="text-[var(--lt-accent-light)] ml-1">· {selectedCount} selected</span>
          )}
        </span>
      )}

      {/* Multi-select mode toggle */}
      <button
        onClick={onToggleMultiSelect}
        title={multiSelectMode ? 'Multi-select ON — click to disable (or press Shift)' : 'Enable multi-select mode (Shift)'}
        className={cn(
          'flex items-center gap-1.5 px-2.5 h-8 text-[11px] rounded-[8px] font-medium border transition-all shrink-0',
          multiSelectMode
            ? 'bg-[var(--lt-accent-muted)] border-[var(--lt-accent)]/60 text-[var(--lt-accent-light)] hidden'
            : 'bg-transparent border-[#222] text-[var(--lt-text-subtle)] hover:border-[#333] hover:text-[var(--lt-text-subtle)] hidden'
        )}
      >
        <Layers2 size={12} />
        {multiSelectMode ? 'Multi ON' : 'Multi'}
      </button>

      <div className="flex-1" />

      {/* Group size selector */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[10px] text-[var(--lt-text-subtle)] mr-0.5">Group</span>
        {GROUP_SIZES.map(n => (
          <button
            key={n}
             disabled={ !hasSelection}
            onClick={() => onGroupSizeChange(n)}
            title={`Group by ${n}`}
            className={cn(
              'w-6 h-6 rounded-[5px] text-[11px] font-semibold transition-all',
              groupSize === n&& hasSelection
                ? 'bg-[var(--lt-accent)] text-white'
                : 'bg-[var(--lt-surface)] border border-[var(--lt-divider)] text-[var(--lt-text-subtle)] hover:border-[var(--lt-accent)] hover:text-[var(--lt-text-primary)]'+(hasSelection ? '' : 'bg-[var(--lt-surface)] border border-[var(--lt-divider)] text-[var(--lt-divider-light)] cursor-not-allowed')
            )}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Copy Excel URLs */}
      <button
        onClick={onCopyExcel}
        disabled={copyingExcel || !hasSelection}
        title={!hasSelection ? 'Select files first' : `Copy Excel URLs (group of ${groupSize})`}
        className={cn(
          'flex items-center gap-1.5 px-2.5 h-8 text-xs rounded-[8px] font-medium border transition-all shrink-0',
          copyingExcel
            ? 'bg-[#064e3b] border-[#10b981]/40 text-[#10b981]'
            : hasSelection
            ? 'bg-[var(--lt-surface)] border-[var(--lt-divider-light)] text-[var(--lt-text-muted)] hover:border-[var(--lt-accent)] hover:text-[var(--lt-text-primary)]'
            : 'bg-transparent border-[var(--lt-divider)] text-[var(--lt-divider-light)] cursor-not-allowed'
        )}
      >
        {copyingExcel ? <Loader2 size={12} className="animate-spin" /> : <Table2 size={12} />}
        {copyingExcel ? 'Copying…' : 'Copy'}
      </button>

      {/* Copy Names — name (no ext) + URL per selected file, TSV for Excel */}
      <button
        onClick={onCopyNames}
        disabled={copyingNames || !hasSelection}
        title={!hasSelection ? 'Select files first' : 'Copy names + URLs (name without extension)'}
        className={cn(
          'flex items-center gap-1.5 px-2.5 h-8 text-xs rounded-[8px] font-medium border transition-all shrink-0',
          copyingNames
            ? 'bg-[#064e3b] border-[#10b981]/40 text-[#10b981]'
            : hasSelection
            ? 'bg-[var(--lt-surface)] border-[var(--lt-divider-light)] text-[var(--lt-text-muted)] hover:border-[#10b981]/60 hover:text-[#10b981]'
            : 'bg-transparent border-[var(--lt-divider)] text-[var(--lt-divider-light)] cursor-not-allowed'
        )}
      >
        {copyingNames ? <Loader2 size={12} className="animate-spin" /> : <Copy size={12} />}
        {copyingNames ? 'Copying…' : 'Copy Names'}
      </button>

      {/* Copy List URLs */}
      <button
        onClick={onCopyList}
        disabled={copyingList || !hasSelection}
        title={!hasSelection ? 'Select files first' : 'Copy URL list'}
        className={cn(
          'flex items-center gap-1.5 px-2.5 h-8 text-xs rounded-[8px] font-medium border transition-all shrink-0 hidden',
          copyingList
            ? 'bg-[#064e3b] border-[#10b981]/40 text-[#10b981]'
            : hasSelection
            ? 'bg-[var(--lt-surface)] border-[var(--lt-divider-light)] text-[var(--lt-text-muted)] hover:border-[var(--lt-accent)] hover:text-[var(--lt-text-primary)]'
            : 'bg-transparent border-[var(--lt-divider)] text-[var(--lt-divider-light)] cursor-not-allowed'
        )}
      >
        {copyingList ? <Loader2 size={12} className="animate-spin" /> : <ListIcon size={12} />}
        {copyingList ? 'Copying…' : 'Copy List'}
      </button>

      {/* Edit Expiry — always visible, enabled only when 2+ selected */}
      <button
        onClick={hasSelection ? onEditExpiry : undefined}
        disabled={!hasSelection}
        title={!hasSelection ? 'Select 2 or more files to edit expiry' : `Edit expiry for ${selectedCount} files`}
        className={cn(
          'flex items-center gap-1.5 px-2.5 h-8 text-xs rounded-[8px] font-medium border transition-all shrink-0',
          hasSelection
            ? 'bg-[var(--lt-accent-muted)] border-[var(--lt-accent)]/40 text-[var(--lt-accent-light)] hover:bg-[var(--lt-accent-muted)]/70'
            : 'bg-transparent border-[var(--lt-divider)] text-[var(--lt-divider-light)] cursor-not-allowed'
        )}
      >
        <Clock size={12} />
        Edit Expiry{hasSelection ? ` (${selectedCount})` : ''}
      </button>

      {/* Delete selected */}
      <button
        disabled={!hasSelection || deleting}
        onClick={onDeleteSelected}
        className={cn(
          'flex items-center gap-1.5 px-2.5 h-8 text-xs rounded-[8px] font-medium transition-all shrink-0',
          deleting
            ? 'bg-[#450a0a] text-[#ef4444] opacity-70 cursor-not-allowed'
            : hasSelection
            ? 'bg-[#450a0a] text-[#ef4444] hover:bg-[#6b1212]'
            : 'bg-[var(--lt-surface)] border border-[var(--lt-divider)] text-[var(--lt-divider-light)] cursor-not-allowed'
        )}
      >
        {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
        {deleting ? 'Deleting…' : `Delete (${selectedCount})`}
      </button>
    



      {/* Upload */}
      <button
        onClick={onUpload}
        disabled={uploadDisabled}
        title={uploadDisabled ? uploadTitle : 'Upload Files'}
        className={cn(
          'flex items-center gap-1.5 px-3 h-8 text-xs rounded-[8px] font-medium transition-all shrink-0',
          uploadDisabled
            ? 'bg-[var(--lt-card-hover)] text-[var(--lt-text-subtle)] cursor-not-allowed opacity-50'
            : 'bg-[var(--lt-accent)] hover:bg-[var(--lt-accent-hover)] text-white shadow-sm'
        )}
      >
        <Upload size={12} />
        Upload
      </button>
    </div>
  )
}

/* ══ FileExplorer ════════════════════════════════════════════════════ */
export default function FileExplorer({ path: pathSegments = [] }) {
  const initialPath = pathSegments.length ? '/' + pathSegments.join('/') : ''

  const { checked, authed, userRoot, startPath } = useAuthGate(initialPath)

  const [currentPath,      setCurrentPath]      = useState(null)
  const view = 'list'
  const [search,           setSearch]           = useState('')
  const [sidebarOpen,      setSidebarOpen]      = useState(true)
  const [sidebarWidth,     setSidebarWidth]     = useState(384)
  const sidebarWidthRef = useRef(384)

  const handleResizeStart = useCallback((e) => {
    e.preventDefault()
    const startX     = e.clientX
    const startWidth = sidebarWidthRef.current

    function onMove(mv) {
      const next = Math.min(Math.max(startWidth + (mv.clientX - startX), 180), 680)
      sidebarWidthRef.current = next
      setSidebarWidth(next)
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
      document.body.style.cursor     = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor     = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
  }, [])

  const [checkedFolders,   setCheckedFolders]   = useState(new Set())
  const [activeFolderPath, setActiveFolderPath] = useState(null)

  // Inline copy state
  const [copyingExcel, setCopyingExcel] = useState(false)
  const [copyingNames, setCopyingNames] = useState(false)
  const [copyingList,  setCopyingList]  = useState(false)
  const [groupSize,    setGroupSize]    = useState(1)

  // T2: recursive file-listing state
  const [rightFiles,   setRightFiles]   = useState([])
  const [rightLoading, setRightLoading] = useState(false)
  const [fetchTick,    setFetchTick]    = useState(0)

  // Bulk expiry UI
  const pendingExpiryRef               = useRef(null)
  const [showBulkExpiry, setShowBulkExpiry] = useState(false)

  const [treeRootPath, setTreeRootPath] = useState(null)
  useEffect(() => {
    if (authed && treeRootPath === null) setTreeRootPath(userRoot || '')
  }, [authed, userRoot, treeRootPath])

  const { folders: sidebarRootFolders, loading: sidebarLoading, refetch: refetchSidebar } = useFiles(treeRootPath)

  // Auto-select the first folder once on initial load — guard with a ref so
  // subsequent sidebar refreshes (new folder created, etc.) don't jump back.
  const autoSelectedRef = useRef(false)
  useEffect(() => {
    if (autoSelectedRef.current) return
    if (!sidebarRootFolders?.length) return
    autoSelectedRef.current = true
    const first = sidebarRootFolders[0]
    setActiveFolderPath(first.path)
    setCurrentPath(first.path)
  }, [sidebarRootFolders])

  const [toasts, setToasts] = useState([])
  const toast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  // T2: BFS recursive fetch — use explicit checkedFolders, fall back to activeFolderPath
  useEffect(() => {
    const foldersToLoad = checkedFolders.size > 0
      ? [...checkedFolders]
      : activeFolderPath ? [activeFolderPath] : []
    if (!authed || !foldersToLoad.length) {
      setRightFiles([])
      setRightLoading(false)
      return
    }
    let cancelled = false
    setRightLoading(true)
    fetchAllFilesRecursive(foldersToLoad)
      .then(files => { if (!cancelled) setRightFiles(files) })
      .catch(e    => { if (!cancelled) toast(e.message, 'error') })
      .finally(() => { if (!cancelled) setRightLoading(false) })
    return () => { cancelled = true }
  }, [authed, checkedFolders, activeFolderPath, fetchTick]) // eslint-disable-line react-hooks/exhaustive-deps

  const refetchRoot = useCallback(() => {
    refetchSidebar()
    setFetchTick(t => t + 1)
  }, [refetchSidebar])

  const [showNewFolder, setShowNewFolder] = useState(false)
  const [showRename,    setShowRename]    = useState(false)
  const [renameItem,    setRenameItem]    = useState(null)
  const [showDelete,    setShowDelete]    = useState(false)
  const [deletePaths,   setDeletePaths]   = useState([])
  const [deleting,      setDeleting]      = useState(false)
  const [showUpload,    setShowUpload]    = useState(false)
  const [showCopyUrls,  setShowCopyUrls]  = useState(false)
  const [copyUrlItems,  setCopyUrlItems]  = useState([])

  // T1: only files in the right panel
  const allItems = rightFiles
  const loading  = rightLoading

  const { selectedItems, selectionOrder, toggleSelect, toggleItem, selectAll, clearSelection } =
    useSelection(allItems)

  // Sync selection to global context so Header can show Edit Expiry button.
  // Use selectionOrder (stable Map ref from useState) instead of selectedItems
  // (new Set every render) to avoid an infinite re-render loop.
  const { setSelectedFiles } = useSelectedFiles()
  useEffect(() => {
    if (!selectionOrder.size) { setSelectedFiles([]); return }
    const files = allItems
      .filter(i => selectionOrder.has(i.path))
      .map(i => ({ name: i.name, path: i.path }))
    setSelectedFiles(files)
  }, [selectionOrder, allItems]) // eslint-disable-line react-hooks/exhaustive-deps

  const [multiSelectMode, setMultiSelectMode] = useState(false)
  const shiftUsedRef = useRef(false)
  const { clipboard, copy, cut, paste, clearClipboard } = useClipboard({
    currentPath: activeFolderPath ?? currentPath,
    clearSelection, refetch: refetchRoot, toast,
  })
  const { menu: ctxMenu, openMenu, closeMenu } = useContextMenu()
  const { uploads, uploading, uploadFiles, clearUploads } = useUpload({
    currentPath: activeFolderPath ?? currentPath,
    refetch: refetchRoot, toast,
  })

  const cutPaths = clipboard?.op === 'cut' ? new Set(clipboard.paths) : new Set()

  // ── File expiry records ───────────────────────────────────────────
  const [expiryRecords,   setExpiryRecords]   = useState([])
  const [expiryModalItem, setExpiryModalItem] = useState(null) // { name, path } | null

  const fetchExpiry = useCallback(async () => {
    try {
      const res  = await fetch('/api/files-expiry')
      const data = await res.json()
      setExpiryRecords(data.records ?? [])
    } catch { /* non-critical */ }
  }, [])

  useEffect(() => { fetchExpiry() }, [fetchExpiry])

  // Save expiry for newly uploaded files when upload completes
  useEffect(() => {
    if (uploading || !uploads.length) return
    if (!pendingExpiryRef.current) return
    const doneUploads = uploads.filter(u => u.status === 'done')
    if (!doneUploads.length) return
    const expiryAt = pendingExpiryRef.current
    pendingExpiryRef.current = null
    fetch('/api/files-expiry', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ items: doneUploads.map(u => ({ name: u.file.name, expiryAt })) }),
    }).then(fetchExpiry).catch(() => {})
  }, [uploading, uploads, fetchExpiry])

  // Names of files that already exist in the active upload folder (for duplicate detection)
  const existingNamesInFolder = useMemo(() => {
    if (activeFolderPath === null || activeFolderPath === undefined) return new Set()
    const prefix = activeFolderPath === '' ? '/' : activeFolderPath + '/'
    return new Set(
      rightFiles
        .filter(f => f.tag === 'file' && f.path.startsWith(prefix) && !f.path.slice(prefix.length).includes('/'))
        .map(f => f.name)
    )
  }, [rightFiles, activeFolderPath])

  const expiryMap = useMemo(
    () => new Map(expiryRecords.map(r => [r.name, r])),
    [expiryRecords]
  )

  async function handleSaveExpiry(expiryAt) {
    const record = expiryMap.get(expiryModalItem.name)
    if (record) {
      await fetch(`/api/files-expiry/${record.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ expiryAt }),
      })
    } else {
      await fetch('/api/files-expiry', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ items: [{ name: expiryModalItem.name, expiryAt }] }),
      })
    }
    fetchExpiry()
  }

  async function handleBulkSaveExpiry(expiryAt) {
    const items = allItems
      .filter(i => i.tag === 'file' && selectedItems.has(i.path))
      .map(i => ({ name: i.name, expiryAt }))
    await fetch('/api/files-expiry', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ items }),
    })
    fetchExpiry()
  }

  useEffect(() => {
    if (authed) {
      setCurrentPath(startPath)
      setActiveFolderPath(startPath)
    }
  }, [authed, startPath])

  const navigate = useCallback((path) => {
    if (userRoot && path !== userRoot && !path.startsWith(userRoot + '/')) return
    setCurrentPath(path)
    setActiveFolderPath(path)
    clearSelection()
    clearClipboard()
  }, [userRoot, clearSelection, clearClipboard])

  const handleFolderOpen = useCallback((path) => {
    setActiveFolderPath(path)
    setCurrentPath(path)
    clearSelection()
  }, [clearSelection])

  const handleFolderCheck = useCallback((path) => {
    setCheckedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
        if (activeFolderPath === path) {
          const remaining = [...next]
          setActiveFolderPath(remaining[0] ?? null)
          setCurrentPath(remaining[0] ?? null)
        }
      } else {
        next.add(path)
        if (next.size === 1) {
          setActiveFolderPath(path)
          setCurrentPath(path)
        }
      }
      return next
    })
    clearSelection()
  }, [activeFolderPath, clearSelection])

  const handleSelectAllFolders = useCallback((paths) => {
    setCheckedFolders(new Set(paths))
    if (paths.length) {
      setActiveFolderPath(paths[0])
      setCurrentPath(paths[0])
    } else {
      setActiveFolderPath(null)
      setCurrentPath(null)
    }
    clearSelection()
  }, [clearSelection])

  const handleDelete = useCallback(async (paths) => {
    setDeleting(true)
    try {
      const res = await fetch('/api/files', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ paths }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      clearSelection()
      setCheckedFolders(prev => {
        const next = new Set(prev)
        paths.forEach(p => next.delete(p))
        return next
      })
      refetchRoot()
      toast(`Deleted ${paths.length} item${paths.length > 1 ? 's' : ''}`, 'success')
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setDeleting(false)
    }
  }, [clearSelection, refetchRoot, toast])

  const handleCopyUrls = useCallback(async (items) => {
    if (!items.length) return
    try {
      const paths = items.filter(i => i.tag === 'file').map(i => i.path)
      if (!paths.length) { toast('Select files to copy URLs', 'info'); return }
      
      const res = await fetch('/api/files', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'get-urls', paths }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const { urls } = await res.json();
      setCopyUrlItems(urls.map((url, i) => ({ url, name: paths[i].split('/').pop() })))
      setShowCopyUrls(true)
    } catch (e) {
      toast(e.message, 'error')
    }
  }, [toast])

  // Inline Copy Excel (no modal, uses DEFAULT_GROUP_SIZE)
  const handleInlineCopyExcel = useCallback(async () => {
    const paths = rightFiles.filter(f => selectedItems.has(f.path)).map(f => f.path)
    if (!paths.length) { toast('Select files to copy URLs', 'info'); return }

    // Sort by selection order
    const sortedPaths = selectionOrder?.size
      ? [...selectionOrder.entries()]
          .filter(([p]) => paths.includes(p))
          .sort(([, a], [, b]) => a - b)
          .map(([p]) => p)
      : paths

    setCopyingExcel(true)
    try {
      const urlRes = await fetch('/api/files', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'get-urls', paths: sortedPaths }),
      })
      if (!urlRes.ok) throw new Error((await urlRes.json()).error)
      const { urls } = await urlRes.json()

      const tsvRes = await fetch('/api/urls', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ items: urls, groupSize: groupSize, sortBy: 'date' }),
      })
      if (!tsvRes.ok) throw new Error()
      const { groups } = await tsvRes.json()

      const header = Array.from({ length: groupSize }).map((_, i) => `Group ${i + 1}`).join('\t')
      const rows   = groups.map(row =>
        Array.from({ length: groupSize }).map((_, ci) => row[ci] ?? '').join('\t')
      )
      await navigator.clipboard.writeText([...rows].join('\n'))
      toast('Excel URLs copied!', 'success')
    } catch (e) {
      toast(e.message ?? 'Copy failed', 'error')
    } finally {
      setCopyingExcel(false)
    }
  }, [rightFiles, selectedItems, selectionOrder, toast])

  // Inline Copy Names — respects groupSize
  // Group of 1 → name\turl per row (col A = name, col B = URL, paste straight into Excel)
  // Group of N → name1\tname2\t…\nurl1\turl2\t… (name row then url row per group)
  const handleInlineCopyNames = useCallback(async () => {
    const selectedFiles = rightFiles.filter(f => selectedItems.has(f.path))
    if (!selectedFiles.length) { toast('Select files first', 'info'); return }

    const sortedFiles = selectionOrder?.size
      ? [...selectionOrder.entries()]
          .filter(([p]) => selectedFiles.some(f => f.path === p))
          .sort(([, a], [, b]) => a - b)
          .map(([p]) => selectedFiles.find(f => f.path === p))
          .filter(Boolean)
      : selectedFiles

    setCopyingNames(true)
    try {
      const paths = sortedFiles.map(f => f.path)
      const res = await fetch('/api/files', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'get-urls', paths }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const { urls } = await res.json()

      const rows = []
      for (let i = 0; i < sortedFiles.length; i += groupSize) {
        const chunkFiles = sortedFiles.slice(i, i + groupSize)
        const chunkUrls  = urls.slice(i, i + groupSize)
        const names = chunkFiles.map(f => f.name.replace(/\.[^/.]+$/, ''))
        if (groupSize === 1) {
          // name in col A, URL in col B — one file per row
          rows.push(`${names[0]}\t${chunkUrls[0]}`)
        } else {
          // name row then url row for this group
          rows.push(names.join('\t'))
          rows.push(chunkUrls.join('\t'))
          // rows.push('')
        }
      }
      await navigator.clipboard.writeText(rows.join('\n'))
      toast('Copied with names!', 'success')
    } catch (e) {
      toast(e.message ?? 'Copy failed', 'error')
    } finally {
      setCopyingNames(false)
    }
  }, [rightFiles, selectedItems, selectionOrder, groupSize, toast])

  // Inline Copy List (no modal)
  const handleInlineCopyList = useCallback(async () => {
    const paths = rightFiles.filter(f => selectedItems.has(f.path)).map(f => f.path)
    if (!paths.length) { toast('Select files to copy URLs', 'info'); return }

    const sortedPaths = selectionOrder?.size
      ? [...selectionOrder.entries()]
          .filter(([p]) => paths.includes(p))
          .sort(([, a], [, b]) => a - b)
          .map(([p]) => p)
      : paths

    setCopyingList(true)
    try {
      const res = await fetch('/api/files', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'get-urls', paths: sortedPaths }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const { urls } = await res.json()
      await navigator.clipboard.writeText(urls.join('\n'))
      toast('URL list copied!', 'success')
    } catch (e) {
      toast(e.message ?? 'Copy failed', 'error')
    } finally {
      setCopyingList(false)
    }
  }, [rightFiles, selectedItems, selectionOrder, toast])

  // Search filter only (no type filter, no sort — table columns handle sort)
  const filteredFiles = useMemo(() => {
    if (!search.trim()) return rightFiles
    const q = search.trim().toLowerCase()
    return rightFiles.filter(f => f.name.toLowerCase().includes(q))
  }, [rightFiles, search])

  useEffect(() => {
    if (!authed) return
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'Escape')                               clearSelection()
      if (e.ctrlKey && e.key === 'a') { e.preventDefault(); selectAll() }
      if (e.ctrlKey && e.key === 'c' && selectedItems.size > 0) copy([...selectedItems])
      if (e.ctrlKey && e.key === 'x' && selectedItems.size > 0) cut([...selectedItems])
      if (e.ctrlKey && e.key === 'v')                       paste()
      if (e.key === 'Delete' && selectedItems.size > 0) {
        setDeletePaths([...selectedItems]); setShowDelete(true)
      }
      if (e.key === 'F2' && selectedItems.size === 1) {
        const item = allItems.find(i => i.path === [...selectedItems][0])
        if (item) { setRenameItem(item); setShowRename(true) }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [authed, selectedItems, allItems, clearSelection, selectAll, copy, cut, paste])

  // Shift key (alone, no click) toggles multi-select mode
  useEffect(() => {
    const onMouseDown = (e) => { if (e.shiftKey) shiftUsedRef.current = true }
    const onKeyDown   = (e) => { if (e.key === 'Shift') shiftUsedRef.current = false }
    const onKeyUp     = (e) => {
      if (e.key !== 'Shift') return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (!shiftUsedRef.current) setMultiSelectMode(v => !v)
    }
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown',   onKeyDown)
    window.addEventListener('keyup',     onKeyUp)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown',   onKeyDown)
      window.removeEventListener('keyup',     onKeyUp)
    }
  }, [])

  // Row click: multi-select mode → toggle item; normal → single-select
  const handleRowClick = useCallback((item, e) => {
    if (multiSelectMode) toggleItem(item.path)
    else toggleSelect(item.path, e)
  }, [multiSelectMode, toggleItem, toggleSelect])

  // Checkbox in row: always toggles (additive), regardless of mode
  const handleCheckboxToggle = useCallback((item) => {
    toggleItem(item.path)
  }, [toggleItem])

  // Upload only makes sense targeting one specific sub-folder
  const isAtUserRoot   = activeFolderPath === userRoot
  const uploadDisabled = !activeFolderPath || checkedFolders.size > 1 || isAtUserRoot
  const uploadTitle    = checkedFolders.size > 1
    ? 'Select a single folder to upload (multiple folders are selected)'
    : isAtUserRoot
    ? 'Select a sub-folder to upload (cannot upload to root)'
    : 'Select a folder first'

  if (!checked) {
    return (
      <div className="min-h-screen bg-[var(--lt-bg-base)] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }
  if (!authed) return <AuthGate />

  const rowCallbacks = {
    onDelete:  (paths) => { setDeletePaths(paths); setShowDelete(true) },
    onCopyUrl: (item)  => handleCopyUrls([item]),
    onRenamed: refetchRoot,
  }

  return (
    <div className="relative flex flex-col h-full bg-[var(--lt-bg-base)] overflow-hidden">
      <DropZone onDrop={uploadDisabled ? null : uploadFiles} currentPath={activeFolderPath} />

      {/* Top context bar */}
      <div className="hidden flex items-center gap-2 px-3 h-10 border-b border-[var(--lt-divider)] bg-[var(--lt-surface)] shrink-0 z-10">
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="p-1.5 rounded-[6px] text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] hover:bg-[var(--lt-card-hover)] transition-colors"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
        </button>

        {activeFolderPath != null && (
          <span className="text-xs text-[var(--lt-text-subtle)] truncate font-mono">
            {activeFolderPath || '/root'}
          </span>
        )}

        {checkedFolders.size > 1 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--lt-accent-muted)] text-[var(--lt-accent-light)] border border-[var(--lt-accent)]/30 shrink-0">
            {checkedFolders.size} folders merged
          </span>
        )}

        <button
          onClick={refetchRoot}
          className="ml-auto p-1.5 rounded-[6px] text-[var(--lt-text-subtle)] hover:text-[var(--lt-accent)] hover:bg-[var(--lt-card-hover)] transition-colors"
          title="Refresh"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Sidebar */}
        {sidebarOpen && (
          <>
            <div
              style={{ width: sidebarWidth, minWidth: 180, maxWidth: 680 }}
              className="shrink-0 bg-[var(--lt-surface)] flex flex-col overflow-hidden"
            >
              <FolderTree
                rootFolders={sidebarRootFolders}
                rootPath={treeRootPath ?? ''}
                activeFolderPath={activeFolderPath}
                checkedFolders={checkedFolders}
                filesLoading={rightLoading}
                sidebarLoading={treeRootPath === null || sidebarLoading}
                onFolderOpen={handleFolderOpen}
                onFolderCheck={handleFolderCheck}
                onSelectAllFolders={handleSelectAllFolders}
                onNewRootFolder={() => setShowNewFolder(true)}
                onRename={(folder) => { setRenameItem(folder); setShowRename(true) }}
                onDelete={(folder) => { setDeletePaths([folder.path]); setShowDelete(true) }}
                onDeletePaths={(paths) => { setDeletePaths(paths); setShowDelete(true) }}
                refetchRoot={refetchRoot}
                toast={toast}
              />
            </div>

            {/* Drag-to-resize handle */}
            <div
              onMouseDown={handleResizeStart}
              className="w-1 shrink-0 bg-[var(--lt-divider)] hover:bg-[var(--lt-accent)] active:bg-[var(--lt-accent)] cursor-col-resize transition-colors"
              title="Drag to resize"
            />
          </>
        )}

        {/* Right panel */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Single-row toolbar */}
          <RightToolbar
            search={search}
            onSearchChange={setSearch}
            onUpload={() => setShowUpload(true)}
            uploadDisabled={uploadDisabled}
            uploadTitle={uploadTitle}
            selectedCount={selectedItems.size}
            fileCount={filteredFiles.length}
            onDeleteSelected={() => { setDeletePaths([...selectedItems]); setShowDelete(true) }}
            deleting={deleting}
            onEditExpiry={() => setShowBulkExpiry(true)}
            onCopyExcel={handleInlineCopyExcel}
            copyingExcel={copyingExcel}
            onCopyNames={handleInlineCopyNames}
            copyingNames={copyingNames}
            onCopyList={handleInlineCopyList}
            copyingList={copyingList}
            multiSelectMode={multiSelectMode}
            onToggleMultiSelect={() => setMultiSelectMode(v => !v)}
            onGroupSizeChange={(size) => setGroupSize(size)}
            groupSize={groupSize}
          />

          <div className="px-4 pt-3">
            <SelectionBar
              selectedItems={selectedItems}
              clipboard={clipboard}
              currentPath={activeFolderPath ?? currentPath}
              allItems={allItems}
              onCopy={copy} onCut={cut} onPaste={paste}
              onRename={() => {
                const item = allItems.find(i => i.path === [...selectedItems][0])
                if (item) { setRenameItem(item); setShowRename(true) }
              }}
              onDelete={() => { setDeletePaths([...selectedItems]); setShowDelete(true) }}
              onCopyUrls={() => {
                const sel = allItems.filter(i => i.tag === 'file' && selectedItems.has(i.path))
                handleCopyUrls(sel)
              }}
              onClearSelection={clearSelection}
            />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <Spinner size="lg" />
              </div>

            ) : activeFolderPath === null ? (
              /* ── No folder selected (fresh load / after refresh) ── */
              <div className="flex flex-col items-center justify-center py-32 gap-4 select-none">
                <div className="w-16 h-16 rounded-2xl bg-[var(--lt-surface)] border border-[var(--lt-divider)] flex items-center justify-center">
                  <FolderOpen size={28} className="text-[var(--lt-divider-light)]" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-[var(--lt-text-subtle)]">No folder selected</p>
                  <p className="text-xs text-[var(--lt-divider-light)]">Choose a folder from the left panel to view its files</p>
                </div>
              </div>

            ) : !loading && filteredFiles.length === 0 ? (
              /* ── Folder selected but empty ── */
              <div className="flex flex-col items-center justify-center py-32 gap-4 select-none">
                <div className="w-16 h-16 rounded-2xl bg-[var(--lt-surface)] border border-[var(--lt-divider)] flex items-center justify-center">
                  <FileX size={28} className="text-[var(--lt-divider-light)]" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-[var(--lt-text-subtle)]">No files in this folder</p>
                  <p className="text-xs text-[var(--lt-divider-light)]">This folder is empty — upload files using the</p>
                  <p className="text-xs text-[var(--lt-divider-light)] flex items-center justify-center gap-1">
                    <Upload size={11} className="text-[var(--lt-accent)]" />
                    <span className="text-[var(--lt-accent)] font-medium">Upload</span>
                    button in the toolbar above
                  </p>
                </div>
              </div>

            ) : view === 'grid' ? (
              <FileGrid
                folders={[]}
                files={filteredFiles}
                selectedItems={selectedItems}
                selectionOrder={selectionOrder}
                cutPaths={cutPaths}
                sortBy="name"
                onSelect={(item, e) => toggleSelect(item.path, e)}
                onNavigate={navigate}
                onContextMenu={openMenu}
              />
            ) : (
              <FileList
                folders={[]}
                files={filteredFiles}
                selectedItems={selectedItems}
                selectionOrder={selectionOrder}
                cutPaths={cutPaths}
                sortBy="name"
                onRowClick={handleRowClick}
                onToggleItem={handleCheckboxToggle}
                onSelectAll={selectAll}
                onClearSelection={clearSelection}
                onNavigate={navigate}
                onContextMenu={openMenu}
                expiryMap={expiryMap}
                onEditExpiry={(item) => setExpiryModalItem({ name: item.name, path: item.path })}
                {...rowCallbacks}
              />
            )}
          </div>
        </div>
      </div>

      {/* Context menu */}
      <ContextMenu
        menu={ctxMenu} clipboard={clipboard} onClose={closeMenu}
        onOpen={(item) => navigate(item.path)}
        onRename={(item) => { setRenameItem(item); setShowRename(true) }}
        onCopy={copy} onCut={cut} onPaste={paste}
        onCopyUrl={(item) => handleCopyUrls([item])}
        onDelete={(paths) => { setDeletePaths(paths); setShowDelete(true) }}
      />

      {/* Modals */}
      <CreateFolderModal
        open={showNewFolder}
        onClose={() => setShowNewFolder(false)}
        currentPath={activeFolderPath ?? currentPath}
        onCreated={() => { setShowNewFolder(false); refetchRoot(); toast('Folder created', 'success') }}
        toast={toast}
      />
      <RenameModal
        open={showRename}
        onClose={() => { setShowRename(false); setRenameItem(null) }}
        item={renameItem}
        onRenamed={() => { setShowRename(false); setRenameItem(null); refetchRoot(); toast('Renamed successfully', 'success') }}
      />
      <DeleteConfirmModal
        open={showDelete}
        onClose={() => { setShowDelete(false); setDeletePaths([]) }}
        paths={deletePaths}
        onConfirm={async () => { setShowDelete(false); await handleDelete(deletePaths); setDeletePaths([]) }}
      />
      <UploadModal
        open={showUpload}
        onClose={() => { setShowUpload(false); clearUploads() }}
        onUpload={(files, expiryDate) => {
          pendingExpiryRef.current = expiryDate || null
          uploadFiles(files)
        }}
        uploads={uploads}
        uploading={uploading}
        existingNames={existingNamesInFolder}
        folderPath={activeFolderPath}
      />
      <CopyUrlsModal
        open={showCopyUrls}
        onClose={() => { setShowCopyUrls(false); setCopyUrlItems([]) }}
        items={copyUrlItems}
        selectionOrder={selectionOrder}
        toast={toast}
      />

      {/* Per-file expiry modal */}
      {expiryModalItem && (
        <ExpiryModal
          files={[expiryModalItem]}
          existingExpiry={expiryMap.get(expiryModalItem.name)?.expiryAt ?? expiryMap.get(expiryModalItem.name)?.expiry_at}
          onSave={handleSaveExpiry}
          onClose={() => setExpiryModalItem(null)}
        />
      )}

      {/* Bulk expiry modal — for all currently selected files */}
      {showBulkExpiry && (
        <ExpiryModal
          files={allItems.filter(i => i.tag === 'file' && selectedItems.has(i.path)).map(i => ({ name: i.name, path: i.path }))}
          onSave={handleBulkSaveExpiry}
          onClose={() => setShowBulkExpiry(false)}
        />
      )}

      {/* Toast notifications */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'px-4 py-2.5 rounded-[8px] text-sm font-medium shadow-xl animate-slideUp pointer-events-auto',
              t.type === 'success' && 'bg-[#064e3b] text-[#10b981] border border-[#10b981]/30',
              t.type === 'error'   && 'bg-[#450a0a] text-[#ef4444] border border-[#ef4444]/30',
              t.type === 'info'    && 'bg-[var(--lt-accent-muted)] text-[var(--lt-accent-light)] border border-[var(--lt-accent)]/30',
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
