'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

import { useFiles }       from '@/hooks/useFiles'
import { useSelection }   from '@/hooks/useSelection'
import { useClipboard }   from '@/hooks/useClipboard'
import { useContextMenu } from '@/hooks/useContextMenu'
import { useUpload }      from '@/hooks/useUpload'

import Breadcrumb          from './Breadcrumb'
import Toolbar             from './Toolbar'
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

export default function FileExplorer({ path: pathSegments = [] }) {
  const initialPath = pathSegments.length ? '/' + pathSegments.join('/') : ''

  const [currentPath, setCurrentPath] = useState(initialPath)
  const [view, setView]               = useState('grid')
  const [sortBy, setSortBy]           = useState('name')

  const [showNewFolder,   setShowNewFolder]   = useState(false)
  const [showRename,      setShowRename]      = useState(false)
  const [renameItem,      setRenameItem]      = useState(null)
  const [showDelete,      setShowDelete]      = useState(false)
  const [deletePaths,     setDeletePaths]     = useState([])
  const [showUpload,      setShowUpload]      = useState(false)
  const [showCopyUrls,    setShowCopyUrls]    = useState(false)
  const [copyUrlItems,    setCopyUrlItems]    = useState([])
  const [toasts, setToasts]                   = useState([])

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const { folders, files, loading, error, refetch } = useFiles(currentPath)

  const allItems = [...folders, ...files]
  const { selectedItems, toggleSelect, selectAll, clearSelection } = useSelection(allItems)
  const { clipboard, copy, cut, paste, clearClipboard } = useClipboard({
    currentPath, clearSelection, refetch, toast,
  })
  const { menu: ctxMenu, openMenu, closeMenu } = useContextMenu()
  const { uploads, uploading, uploadFiles, clearUploads } = useUpload({
    currentPath, refetch, toast,
  })

  // Cut paths for opacity
  const cutPaths = clipboard?.op === 'cut' ? new Set(clipboard.paths) : new Set()

  // Navigate into folder
  const navigate = useCallback((path) => {
    setCurrentPath(path)
    clearSelection()
    clearClipboard()
  }, [clearSelection, clearClipboard])

  // Delete handler
  const handleDelete = useCallback(async (paths) => {
    try {
      const res = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      clearSelection()
      refetch()
      toast(`Deleted ${paths.length} item${paths.length > 1 ? 's' : ''}`, 'success')
    } catch (e) {
      toast(e.message, 'error')
    }
  }, [clearSelection, refetch, toast])

  // Open CopyUrls modal — fetch shared links for selected files
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

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'Escape')    clearSelection()
      if (e.ctrlKey && e.key === 'a') { e.preventDefault(); selectAll() }
      if (e.ctrlKey && e.key === 'c' && selectedItems.size > 0) copy([...selectedItems])
      if (e.ctrlKey && e.key === 'x' && selectedItems.size > 0) cut([...selectedItems])
      if (e.ctrlKey && e.key === 'v') paste()
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
  }, [selectedItems, allItems, clearSelection, selectAll, copy, cut, paste])

  return (
    <div className="relative min-h-screen bg-[#0a0a0a]">
      <DropZone onDrop={uploadFiles} currentPath={currentPath} />

      {/* Main panel */}
      <div className="max-w-[1600px] mx-auto px-4 py-6">

        {/* Breadcrumb + refetch */}
        <div className="flex items-center gap-3 mb-4">
          <Breadcrumb path={currentPath} onNavigate={navigate} />
          <button
            onClick={refetch}
            className="text-xs text-[#6b7280] hover:text-[#4f46e5] transition-colors ml-auto shrink-0"
            title="Refresh"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Toolbar */}
        <div className="mb-4 p-3 bg-[#111111] border border-[#262626] rounded-[10px]">
          <Toolbar
            view={view}
            sortBy={sortBy}
            onViewChange={setView}
            onSortChange={setSortBy}
            onSelectAll={selectAll}
            onNewFolder={() => setShowNewFolder(true)}
            onUpload={() => setShowUpload(true)}
          />
        </div>

        {/* SelectionBar */}
        <div className="mb-3">
          <SelectionBar
            selectedItems={selectedItems}
            clipboard={clipboard}
            currentPath={currentPath}
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
              const selected = allItems.filter(i => i.tag === 'file' && selectedItems.has(i.path))
              handleCopyUrls(selected)
            }}
            onClearSelection={clearSelection}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-[#ef4444] text-sm mb-2">Failed to load files</p>
            <p className="text-[#6b7280] text-xs mb-4">{error}</p>
            <button onClick={refetch} className="text-[#4f46e5] text-sm hover:underline">Try again</button>
          </div>
        ) : view === 'grid' ? (
          <FileGrid
            folders={folders}
            files={files}
            selectedItems={selectedItems}
            cutPaths={cutPaths}
            sortBy={sortBy}
            onSelect={(item, e) => toggleSelect(item.path, e)}
            onNavigate={navigate}
            onContextMenu={openMenu}
          />
        ) : (
          <FileList
            folders={folders}
            files={files}
            selectedItems={selectedItems}
            cutPaths={cutPaths}
            sortBy={sortBy}
            onSelect={(item, e) => toggleSelect(item.path, e)}
            onNavigate={navigate}
            onContextMenu={openMenu}
          />
        )}
      </div>

      {/* Context menu */}
      <ContextMenu
        menu={ctxMenu}
        clipboard={clipboard}
        onClose={closeMenu}
        onOpen={(item) => navigate(item.path)}
        onRename={(item) => { setRenameItem(item); setShowRename(true) }}
        onCopy={(paths) => copy(paths)}
        onCut={(paths) => cut(paths)}
        onPaste={paste}
        onCopyUrl={(item) => handleCopyUrls([item])}
        onDelete={(paths) => { setDeletePaths(paths); setShowDelete(true) }}
      />

      {/* Modals */}
      <CreateFolderModal
        open={showNewFolder}
        onClose={() => setShowNewFolder(false)}
        currentPath={currentPath}
        onCreated={() => { setShowNewFolder(false); refetch(); toast('Folder created', 'success') }}
        toast={toast}
      />
      <RenameModal
        open={showRename}
        onClose={() => { setShowRename(false); setRenameItem(null) }}
        item={renameItem}
        onRenamed={() => { setShowRename(false); setRenameItem(null); refetch(); toast('Renamed successfully', 'success') }}
        toast={toast}
      />
      <DeleteConfirmModal
        open={showDelete}
        onClose={() => { setShowDelete(false); setDeletePaths([]) }}
        paths={deletePaths}
        onConfirm={async () => {
          setShowDelete(false)
          await handleDelete(deletePaths)
          setDeletePaths([])
        }}
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
        toast={toast}
      />

      {/* Toast stack */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-2.5 rounded-[8px] text-sm font-medium shadow-xl animate-slideUp pointer-events-auto ${
              t.type === 'success' ? 'bg-[#064e3b] text-[#10b981] border border-[#10b981]/30' :
              t.type === 'error'   ? 'bg-[#450a0a] text-[#ef4444] border border-[#ef4444]/30' :
              'bg-[#1e1b4b] text-[#818cf8] border border-[#4f46e5]/30'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
