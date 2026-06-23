'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Search, X, Image as ImageIcon, Video, LayoutGrid, List,
  ArrowUpDown, RefreshCw, PanelLeftClose, PanelLeftOpen,
  Upload, CheckSquare, FolderPlus,
} from 'lucide-react'

import { useFiles }       from '@/hooks/useFiles'
import { useAuthGate }    from '@/hooks/useAuthGate'
import { useSelection }   from '@/hooks/useSelection'
import { useClipboard }   from '@/hooks/useClipboard'
import { useContextMenu } from '@/hooks/useContextMenu'
import { useUpload }      from '@/hooks/useUpload'
import { cn }             from '@/lib/utils'

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
import Button              from '@/components/ui/Button'

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'date', label: 'Date'  },
  { value: 'size', label: 'Size'  },
  { value: 'type', label: 'Type'  },
]

/* ── Multi-folder file fetcher ───────────────────────────────────────── */
async function fetchFolderFiles(path) {
  const res = await fetch(`/api/files?path=${encodeURIComponent(path ?? '')}`)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

/* ── Toolbar (right panel top) ───────────────────────────────────────── */
function RightToolbar({
  view, sortBy, filter, search,
  onViewChange, onSortChange, onFilterChange, onSearchChange,
  onSelectAll, onNewFolder, onUpload,
  uploadDisabled, selectedCount, fileCount,
}) {
  return (
    <div className="flex flex-col gap-2 px-4 py-3 border-b border-[#1e1e1e] bg-[#0d0d0d]">
      {/* Row 1: search + upload */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b7280]" />
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search files…"
            className="w-full pl-8 pr-8 h-8 bg-[#111111] border border-[#262626] rounded-[8px] text-xs text-[#f5f5f5] placeholder-[#6b7280] focus:outline-none focus:border-[#4f46e5] transition-colors"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#f5f5f5]"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Select all */}
        <button
          onClick={onSelectAll}
          title="Select All (Ctrl+A)"
          className="flex items-center gap-1.5 px-2.5 h-8 text-xs rounded-[8px] text-[#a3a3a3] hover:text-[#f5f5f5] hover:bg-[#1c1c1c] transition-colors"
        >
          <CheckSquare size={13} />
          <span className="hidden md:inline">Select All</span>
        </button>

        {/* New folder */}
        <button
          onClick={onNewFolder}
          title="New Folder"
          className="flex items-center gap-1.5 px-2.5 h-8 text-xs rounded-[8px] text-[#a3a3a3] hover:text-[#f5f5f5] hover:bg-[#1c1c1c] transition-colors"
        >
          <FolderPlus size={13} />
          <span className="hidden md:inline">New Folder</span>
        </button>

        {/* Upload */}
        <button
          onClick={onUpload}
          disabled={uploadDisabled}
          title={uploadDisabled ? 'Select a single folder to upload' : 'Upload Files'}
          className={cn(
            'flex items-center gap-1.5 px-3 h-8 text-xs rounded-[8px] font-medium transition-all',
            uploadDisabled
              ? 'bg-[#1c1c1c] text-[#6b7280] cursor-not-allowed opacity-50'
              : 'bg-[#4f46e5] hover:bg-[#4338ca] text-white shadow-sm'
          )}
        >
          <Upload size={13} />
          Upload
        </button>
      </div>

      {/* Row 2: filters + sort + view */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Type filter pills */}
        <div className="flex items-center gap-1">
          {[
            { key: 'all',    label: 'All' },
            { key: 'images', label: 'Images', icon: ImageIcon },
            { key: 'videos', label: 'Videos', icon: Video },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => onFilterChange(opt.key)}
              className={cn(
                'flex items-center gap-1 px-2.5 h-7 rounded-full text-xs font-medium transition-all',
                filter === opt.key
                  ? opt.key === 'images'
                    ? 'bg-[#1e1b4b] text-[#818cf8] border border-[#4f46e5]/50'
                    : opt.key === 'videos'
                    ? 'bg-[#451a03] text-[#f59e0b] border border-[#f59e0b]/30'
                    : 'bg-[#4f46e5] text-white'
                  : 'bg-[#1c1c1c] text-[#6b7280] hover:text-[#a3a3a3] border border-[#262626]'
              )}
            >
              {opt.icon && <opt.icon size={11} />}
              {opt.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        {fileCount > 0 && (
          <span className="text-[10px] text-[#6b7280]">
            {fileCount} file{fileCount !== 1 ? 's' : ''}
            {selectedCount > 0 && <span className="text-[#818cf8] ml-1">· {selectedCount} selected</span>}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          {/* Sort */}
          <div className="relative group/sort">
            <button className="flex items-center gap-1 px-2.5 h-7 text-xs rounded-[8px] bg-[#111111] border border-[#262626] text-[#a3a3a3] hover:text-[#f5f5f5] hover:border-[#4f46e5] transition-all cursor-pointer">
              <ArrowUpDown size={11} />
              {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
            </button>
            <div className="absolute right-0 top-full mt-1 py-1 w-32 bg-[#161616] border border-[#333333] rounded-[8px] shadow-xl z-30 hidden group-hover/sort:block">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onSortChange(opt.value)}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-xs transition-colors',
                    sortBy === opt.value
                      ? 'text-[#818cf8] bg-[#1e1b4b]'
                      : 'text-[#a3a3a3] hover:text-[#f5f5f5] hover:bg-[#1c1c1c]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* View toggle */}
          <div className="flex bg-[#111111] border border-[#262626] rounded-[8px] p-0.5">
            <button
              onClick={() => onViewChange('grid')}
              className={cn('p-1.5 rounded-[6px] transition-all', view === 'grid' ? 'bg-[#4f46e5] text-white' : 'text-[#6b7280] hover:text-[#f5f5f5]')}
              title="Grid view"
            >
              <LayoutGrid size={13} />
            </button>
            <button
              onClick={() => onViewChange('list')}
              className={cn('p-1.5 rounded-[6px] transition-all', view === 'list' ? 'bg-[#4f46e5] text-white' : 'text-[#6b7280] hover:text-[#f5f5f5]')}
              title="List view"
            >
              <List size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══ FileExplorer ═══════════════════════════════════════════════════════ */
export default function FileExplorer({ path: pathSegments = [] }) {
  const initialPath = pathSegments.length ? '/' + pathSegments.join('/') : ''

  const { checked, authed, userRoot, startPath } = useAuthGate(initialPath)

  // ── Core navigation ──────────────────────────────────────────────────
  const [currentPath,    setCurrentPath]    = useState(null)
  const [view,           setView]           = useState('grid')
  const [sortBy,         setSortBy]         = useState('name')
  const [filter,         setFilter]         = useState('all')  // all | images | videos
  const [search,         setSearch]         = useState('')
  const [sidebarOpen,    setSidebarOpen]    = useState(true)

  // ── Folder sidebar state ─────────────────────────────────────────────
  // checkedFolders: Set of folder paths checked in sidebar (for multi-display)
  const [checkedFolders, setCheckedFolders] = useState(new Set())
  // activeFolderPath: the single folder open as the upload target
  const [activeFolderPath, setActiveFolderPath] = useState(null)

  // ── Multi-folder files ───────────────────────────────────────────────
  const [multiFolderFiles,   setMultiFolderFiles]   = useState([])
  const [multiFolderFolders, setMultiFolderFolders] = useState([])
  const [multiLoading,       setMultiLoading]       = useState(false)

  // ── Root-level folders for the sidebar tree (always fetched from userRoot) ──
  const [treeRootPath, setTreeRootPath] = useState(null)
  useEffect(() => {
    if (authed && treeRootPath === null) setTreeRootPath(userRoot || '')
  }, [authed, userRoot, treeRootPath])

  const { folders: sidebarRootFolders, refetch: refetchSidebar } = useFiles(treeRootPath)

  // ── Single-folder (current active path) ──────────────────────────────
  const { folders: rootFolders, files: rootFiles, loading: rootLoading, refetch: refetchCurrentPath } =
    useFiles(currentPath)

  const refetchRoot = useCallback(() => {
    refetchCurrentPath()
    refetchSidebar()
  }, [refetchCurrentPath, refetchSidebar])

  // Determine what to show in right panel
  const isMultiMode    = checkedFolders.size > 1
  const displayFolders = isMultiMode ? multiFolderFolders : rootFolders
  const displayFiles   = isMultiMode ? multiFolderFiles   : rootFiles
  const loading        = isMultiMode ? multiLoading       : rootLoading

  // ── Modal states ──────────────────────────────────────────────────────
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [showRename,    setShowRename]    = useState(false)
  const [renameItem,    setRenameItem]    = useState(null)
  const [showDelete,    setShowDelete]    = useState(false)
  const [deletePaths,   setDeletePaths]  = useState([])
  const [showUpload,    setShowUpload]    = useState(false)
  const [showCopyUrls,  setShowCopyUrls]  = useState(false)
  const [copyUrlItems,  setCopyUrlItems]  = useState([])
  const [toasts,        setToasts]        = useState([])

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  // ── Hooks ─────────────────────────────────────────────────────────────
  const allItems = [...displayFolders, ...displayFiles]
  const { selectedItems, selectionOrder, toggleSelect, selectAll, clearSelection } =
    useSelection(allItems)
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

  // ── Auth init ────────────────────────────────────────────────────────
  useEffect(() => {
    if (authed) {
      setCurrentPath(startPath)
      setActiveFolderPath(startPath)
      // Pre-check the starting folder in the sidebar
      if (startPath !== '') setCheckedFolders(new Set([startPath]))
    }
  }, [authed, startPath])

  // ── Multi-folder file loading ─────────────────────────────────────────
  useEffect(() => {
    if (!isMultiMode) return
    setMultiLoading(true)
    const paths = [...checkedFolders]
    Promise.all(paths.map(p => fetchFolderFiles(p)))
      .then(results => {
        const allFolders = []
        const allFiles   = []
        results.forEach((data, i) => {
          const sourceName = paths[i].split('/').pop() || 'root'
          ;(data.folders ?? []).forEach(f => allFolders.push({ ...f, folderSource: sourceName }))
          ;(data.files   ?? []).forEach(f => allFiles.push(  { ...f, folderSource: sourceName }))
        })
        setMultiFolderFolders(allFolders)
        setMultiFolderFiles(allFiles)
      })
      .catch(e => toast(e.message, 'error'))
      .finally(() => setMultiLoading(false))
  }, [isMultiMode, checkedFolders])

  // ── Navigation ───────────────────────────────────────────────────────
  const navigate = useCallback((path) => {
    if (userRoot && path !== userRoot && !path.startsWith(userRoot + '/')) return
    setCurrentPath(path)
    setActiveFolderPath(path)
    clearSelection()
    clearClipboard()
    setCheckedFolders(new Set([path]))
  }, [userRoot, clearSelection, clearClipboard])

  // ── Folder sidebar handlers ───────────────────────────────────────────
  const handleFolderOpen = useCallback((path) => {
    setActiveFolderPath(path)
    setCurrentPath(path)
    setCheckedFolders(prev => {
      // If opening a folder, clear multi-check and just check this one
      if (prev.size > 1) return new Set([path])
      return new Set([path])
    })
    clearSelection()
  }, [clearSelection])

  const handleFolderCheck = useCallback((path) => {
    setCheckedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
        // If unchecking the active folder, set active to first remaining
        if (activeFolderPath === path) {
          const remaining = [...next]
          setActiveFolderPath(remaining[0] ?? null)
          setCurrentPath(remaining[0] ?? null)
        }
      } else {
        next.add(path)
        // If this is the first checked folder, make it active
        if (next.size === 1) {
          setActiveFolderPath(path)
          setCurrentPath(path)
        }
      }
      return next
    })
    clearSelection()
  }, [activeFolderPath, clearSelection])

  const handleFolderUpload = useCallback((path) => {
    setActiveFolderPath(path)
    setCurrentPath(path)
    setShowUpload(true)
  }, [])

  // ── Delete ───────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (paths) => {
    try {
      const res = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      clearSelection()
      refetchRoot()
      toast(`Deleted ${paths.length} item${paths.length > 1 ? 's' : ''}`, 'success')
    } catch (e) {
      toast(e.message, 'error')
    }
  }, [clearSelection, refetchRoot, toast])

  // ── Copy URLs ─────────────────────────────────────────────────────────
  const handleCopyUrls = useCallback(async (items) => {
    if (!items.length) return
    try {
      const paths = items.filter(i => i.tag === 'file').map(i => i.path)
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-urls', paths }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const { urls } = await res.json()
      setCopyUrlItems(urls.map((url, i) => ({ url, name: paths[i].split('/').pop() })))
      setShowCopyUrls(true)
    } catch (e) {
      toast(e.message, 'error')
    }
  }, [toast])

  // ── Filter + search ───────────────────────────────────────────────────
  const filteredFiles = useMemo(() => {
    let files = displayFiles
    // Type filter
    if (filter === 'images') {
      files = files.filter(f => /\.(jpg|jpeg|png|gif|webp|svg|avif|heic|bmp|tiff)$/i.test(f.name))
    } else if (filter === 'videos') {
      files = files.filter(f => /\.(mp4|mov|avi|mkv|webm|wmv|m4v|flv|3gp|ogv)$/i.test(f.name))
    }
    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      files = files.filter(f => f.name.toLowerCase().includes(q))
    }
    return files
  }, [displayFiles, filter, search])

  const filteredFolders = useMemo(() => {
    if (!search.trim()) return displayFolders
    const q = search.trim().toLowerCase()
    return displayFolders.filter(f => f.name.toLowerCase().includes(q))
  }, [displayFolders, search])

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    if (!authed) return
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'Escape')               clearSelection()
      if (e.ctrlKey && e.key === 'a')       { e.preventDefault(); selectAll() }
      if (e.ctrlKey && e.key === 'c' && selectedItems.size > 0) copy([...selectedItems])
      if (e.ctrlKey && e.key === 'x' && selectedItems.size > 0) cut([...selectedItems])
      if (e.ctrlKey && e.key === 'v')       paste()
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

  // ── Upload disabled: only when exactly 1 folder is active ─────────────
  const uploadDisabled = checkedFolders.size !== 1

  // ── Auth guards ───────────────────────────────────────────────────────
  if (!checked) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }
  if (!authed) return <AuthGate />

  // ── Main render ───────────────────────────────────────────────────────
  return (
    <div className="relative flex flex-col h-full bg-[#0a0a0a] overflow-hidden">
      <DropZone onDrop={uploadDisabled ? null : uploadFiles} currentPath={activeFolderPath} />

      {/* Context bar: sidebar toggle + path + multi-folder badge */}
      <div className="flex items-center gap-2 px-3 h-10 border-b border-[#1a1a1a] bg-[#0d0d0d] shrink-0 z-10">
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="p-1.5 rounded-[6px] text-[#6b7280] hover:text-[#f5f5f5] hover:bg-[#1c1c1c] transition-colors"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
        </button>

        {/* Active path breadcrumb */}
        {activeFolderPath != null && (
          <span className="text-xs text-[#6b7280] truncate font-mono">
            {activeFolderPath || '/root'}
          </span>
        )}

        {isMultiMode && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1e1b4b] text-[#818cf8] border border-[#4f46e5]/30 shrink-0">
            {checkedFolders.size} folders merged
          </span>
        )}

        <button
          onClick={refetchRoot}
          className="ml-auto p-1.5 rounded-[6px] text-[#6b7280] hover:text-[#4f46e5] hover:bg-[#1c1c1c] transition-colors"
          title="Refresh"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Body: sidebar + right panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left sidebar: folder tree ───────────────────────────────── */}
        {sidebarOpen && (
          <div className="w-60 shrink-0 border-r border-[#1a1a1a] bg-[#0d0d0d] flex flex-col overflow-hidden">
            <FolderTree
              rootFolders={sidebarRootFolders}
              activeFolderPath={activeFolderPath}
              checkedFolders={checkedFolders}
              uploadEnabled={!uploadDisabled}
              onFolderOpen={handleFolderOpen}
              onFolderCheck={handleFolderCheck}
              onFolderUpload={handleFolderUpload}
              onNewRootFolder={() => setShowNewFolder(true)}
              onRename={(folder) => { setRenameItem(folder); setShowRename(true) }}
              onDelete={(folder) => { setDeletePaths([folder.path]); setShowDelete(true) }}
              refetchRoot={refetchRoot}
              toast={toast}
            />
          </div>
        )}

        {/* ── Right panel: toolbar + files ────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <RightToolbar
            view={view}
            sortBy={sortBy}
            filter={filter}
            search={search}
            onViewChange={setView}
            onSortChange={setSortBy}
            onFilterChange={setFilter}
            onSearchChange={setSearch}
            onSelectAll={selectAll}
            onNewFolder={() => setShowNewFolder(true)}
            onUpload={() => setShowUpload(true)}
            uploadDisabled={uploadDisabled}
            selectedCount={selectedItems.size}
            fileCount={filteredFiles.length}
          />

          {/* Selection bar */}
          <div className="px-4 pt-3">
            <SelectionBar
              selectedItems={selectedItems}
              clipboard={clipboard}
              currentPath={activeFolderPath ?? currentPath}
              allItems={allItems}
              onCopy={copy}
              onCut={cut}
              onPaste={paste}
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

          {/* File area */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <Spinner size="lg" />
              </div>
            ) : view === 'grid' ? (
              <FileGrid
                folders={filteredFolders}
                files={filteredFiles}
                selectedItems={selectedItems}
                selectionOrder={selectionOrder}
                cutPaths={cutPaths}
                sortBy={sortBy}
                onSelect={(item, e) => toggleSelect(item.path, e)}
                onNavigate={navigate}
                onContextMenu={openMenu}
              />
            ) : (
              <FileList
                folders={filteredFolders}
                files={filteredFiles}
                selectedItems={selectedItems}
                selectionOrder={selectionOrder}
                cutPaths={cutPaths}
                sortBy={sortBy}
                onSelect={(item, e) => toggleSelect(item.path, e)}
                onNavigate={navigate}
                onContextMenu={openMenu}
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
        onCopy={copy}
        onCut={cut}
        onPaste={paste}
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
        onUpload={uploadFiles}
        uploads={uploads}
        uploading={uploading}
      />
      <CopyUrlsModal
        open={showCopyUrls}
        onClose={() => { setShowCopyUrls(false); setCopyUrlItems([]) }}
        items={copyUrlItems}
        selectionOrder={selectionOrder}
        toast={toast}
      />

      {/* Toast notifications */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'px-4 py-2.5 rounded-[8px] text-sm font-medium shadow-xl animate-slideUp pointer-events-auto',
              t.type === 'success' && 'bg-[#064e3b] text-[#10b981] border border-[#10b981]/30',
              t.type === 'error'   && 'bg-[#450a0a] text-[#ef4444] border border-[#ef4444]/30',
              t.type === 'info'    && 'bg-[#1e1b4b] text-[#818cf8] border border-[#4f46e5]/30',
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
