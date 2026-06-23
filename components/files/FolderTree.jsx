'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Folder, FolderOpen, ChevronRight, ChevronDown,
  Plus, MoreVertical, Pencil, Trash2, Copy, Move,
  FolderPlus, Upload, Loader2, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

/* ─── Folder Context Menu ─────────────────────────────────────────── */
function FolderCtxMenu({ folder, position, onClose, onRename, onDelete, onNewSub, onCopyPath }) {
  const ref = useRef(null)

  useEffect(() => {
    const handle = e => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    setTimeout(() => window.addEventListener('mousedown', handle), 0)
    return () => window.removeEventListener('mousedown', handle)
  }, [onClose])

  if (!position) return null

  const x = Math.min(position.x, window.innerWidth  - 180)
  const y = Math.min(position.y, window.innerHeight - 220)

  const Item = ({ icon: Icon, label, onClick, danger }) => (
    <button
      onClick={() => { onClick(); onClose() }}
      className={cn(
        'flex items-center gap-2 w-full px-3 py-1.5 text-sm rounded-[6px] transition-colors cursor-pointer',
        danger
          ? 'text-[#ef4444] hover:bg-[#450a0a]'
          : 'text-[#a3a3a3] hover:text-[#f5f5f5] hover:bg-[#1c1c1c]'
      )}
    >
      <Icon size={13} className="shrink-0" />
      {label}
    </button>
  )

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', left: x, top: y, zIndex: 2000 }}
      className="w-48 bg-[#161616] border border-[#333333] rounded-[10px] shadow-2xl shadow-black/70 p-1 animate-fadeIn"
      onClick={e => e.stopPropagation()}
    >
      <Item icon={FolderPlus} label="New Subfolder"  onClick={() => onNewSub(folder)} />
      <Item icon={Pencil}     label="Rename"         onClick={() => onRename(folder)} />
      <Item icon={Copy}       label="Copy Path"      onClick={() => onCopyPath(folder)} />
      <div className="my-1 mx-2 h-px bg-[#262626]" />
      <Item icon={Trash2}     label="Delete Folder"  onClick={() => onDelete(folder)} danger />
    </div>
  )
}

/* ─── Inline Create Folder Form ───────────────────────────────────── */
function InlineNewFolder({ parentPath, onCreated, onCancel }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  async function submit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy(true)
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-folder', path: parentPath, name: trimmed }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      onCreated()
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-1 pl-6 pr-2 py-1">
      <input
        ref={inputRef}
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') onCancel() }}
        placeholder="Folder name…"
        className="flex-1 min-w-0 px-2 py-1 text-xs bg-[#0a0a0a] border border-[#4f46e5] rounded-[6px] text-[#f5f5f5] placeholder-[#6b7280] focus:outline-none"
      />
      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="w-6 h-6 flex items-center justify-center rounded bg-[#4f46e5] text-white disabled:opacity-40 shrink-0"
      >
        {busy ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="w-6 h-6 flex items-center justify-center rounded text-[#6b7280] hover:text-[#f5f5f5] shrink-0"
      >
        <X size={10} />
      </button>
    </form>
  )
}

/* ─── Single Folder Row ───────────────────────────────────────────── */
function FolderRow({
  folder,
  level,
  isChecked,
  isExpanded,
  isActive,
  isDragOver,
  isLoading,
  uploadEnabled,
  showNewFolder,
  onCheck,
  onExpand,
  onOpen,
  onMoreOptions,
  onNewSub,
  onUpload,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, folder)}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); onDragOver(folder.path) }}
      onDragLeave={onDragLeave}
      onDrop={e => { e.preventDefault(); e.stopPropagation(); onDrop(e, folder.path) }}
      className={cn(
        'group/row flex items-center gap-1.5 pr-2 py-[5px] rounded-[7px] cursor-pointer select-none',
        'transition-all duration-100 relative',
        isActive && !isDragOver && 'bg-[#1e1b4b]',
        isDragOver && 'bg-[#4f46e5]/20 border border-dashed border-[#4f46e5]/60',
        !isActive && !isDragOver && 'hover:bg-[#1c1c1c]',
      )}
      style={{ paddingLeft: `${6 + level * 14}px` }}
    >
      {/* Expand / collapse arrow */}
      <button
        onClick={e => { e.stopPropagation(); onExpand(folder.path) }}
        className="w-4 h-4 flex items-center justify-center shrink-0 text-[#6b7280] hover:text-[#a3a3a3]"
      >
        {isLoading
          ? <Loader2 size={10} className="animate-spin text-[#4f46e5]" />
          : isExpanded
          ? <ChevronDown size={11} />
          : <ChevronRight size={11} />
        }
      </button>

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isChecked}
        onChange={e => { e.stopPropagation(); onCheck(folder.path) }}
        onClick={e => e.stopPropagation()}
        className="w-3.5 h-3.5 accent-[#4f46e5] shrink-0 cursor-pointer"
      />

      {/* Folder icon + name */}
      <button
        onClick={() => onOpen(folder.path)}
        className="flex items-center gap-1.5 flex-1 min-w-0 py-0.5 text-left"
      >
        {isExpanded
          ? <FolderOpen size={13} className={isActive ? 'text-[#818cf8]' : 'text-[#4f46e5]'} fill={isActive ? 'rgba(129,140,248,0.2)' : 'rgba(79,70,229,0.12)'} />
          : <Folder     size={13} className={isActive ? 'text-[#818cf8]' : 'text-[#4f46e5]'} fill={isActive ? 'rgba(129,140,248,0.2)' : 'rgba(79,70,229,0.12)'} />
        }
        <span className={cn(
          'text-xs truncate',
          isActive ? 'text-[#c7d2fe] font-medium' : 'text-[#a3a3a3] group-hover/row:text-[#f5f5f5]'
        )}>
          {folder.name}
        </span>
      </button>

      {/* Hover actions */}
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
        {/* Upload to this folder */}
        {uploadEnabled && (
          <button
            onClick={e => { e.stopPropagation(); onUpload(folder.path) }}
            title="Upload to this folder"
            className="w-5 h-5 flex items-center justify-center rounded text-[#4f46e5] hover:text-white hover:bg-[#4f46e5] transition-colors"
          >
            <Upload size={10} />
          </button>
        )}

        {/* New subfolder */}
        <button
          onClick={e => { e.stopPropagation(); onNewSub(folder.path) }}
          title="New subfolder"
          className="w-5 h-5 flex items-center justify-center rounded text-[#6b7280] hover:text-[#f5f5f5] hover:bg-[#262626]"
        >
          <Plus size={10} />
        </button>

        {/* More options */}
        <button
          onClick={e => { e.stopPropagation(); onMoreOptions(e, folder) }}
          title="More options"
          className="w-5 h-5 flex items-center justify-center rounded text-[#6b7280] hover:text-[#f5f5f5] hover:bg-[#262626]"
        >
          <MoreVertical size={10} />
        </button>
      </div>

      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-[#4f46e5]" />
      )}
    </div>
  )
}

/* ─── Recursive Tree Node ─────────────────────────────────────────── */
function TreeNode({
  folder,
  level,
  state,        // { expanded, checked, active, loadingPaths, subfolderMap }
  dragState,    // { draggedPath, dragOverPath }
  newFolderPath,
  uploadEnabled,
  onExpand,
  onCheck,
  onOpen,
  onMoreOptions,
  onNewSub,
  onUpload,
  onNewFolderCreated,
  onNewFolderCancel,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}) {
  const isExpanded  = state.expanded.has(folder.path)
  const isChecked   = state.checked.has(folder.path)
  const isActive    = state.active === folder.path
  const isDragOver  = dragState.dragOverPath === folder.path && dragState.draggedPath !== folder.path
  const isLoading   = state.loadingPaths.has(folder.path)
  const children    = state.subfolderMap.get(folder.path) ?? []
  const showNewHere = newFolderPath === folder.path

  return (
    <div>
      <FolderRow
        folder={folder}
        level={level}
        isChecked={isChecked}
        isExpanded={isExpanded}
        isActive={isActive}
        isDragOver={isDragOver}
        isLoading={isLoading}
        uploadEnabled={uploadEnabled && isActive}
        onCheck={onCheck}
        onExpand={onExpand}
        onOpen={onOpen}
        onMoreOptions={onMoreOptions}
        onNewSub={onNewSub}
        onUpload={onUpload}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      />

      {/* Children */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            {children.map(child => (
              <TreeNode
                key={child.path}
                folder={child}
                level={level + 1}
                state={state}
                dragState={dragState}
                newFolderPath={newFolderPath}
                uploadEnabled={uploadEnabled}
                onExpand={onExpand}
                onCheck={onCheck}
                onOpen={onOpen}
                onMoreOptions={onMoreOptions}
                onNewSub={onNewSub}
                onUpload={onUpload}
                onNewFolderCreated={onNewFolderCreated}
                onNewFolderCancel={onNewFolderCancel}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              />
            ))}

            {/* Inline new-folder form */}
            {showNewHere && (
              <div style={{ paddingLeft: `${6 + (level + 1) * 14}px` }}>
                <InlineNewFolder
                  parentPath={folder.path}
                  onCreated={onNewFolderCreated}
                  onCancel={onNewFolderCancel}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── FolderTree (main export) ────────────────────────────────────── */
export default function FolderTree({
  rootFolders,          // FolderItem[] loaded by parent
  activeFolderPath,     // string — the open/active folder
  checkedFolders,       // Set<string>
  uploadEnabled,        // true when exactly 1 folder is active/checked
  onFolderOpen,         // (path) => void
  onFolderCheck,        // (path) => void
  onFolderUpload,       // (path) => void
  onNewRootFolder,      // () => void
  onRename,             // (folder) => void
  onDelete,             // (folder) => void
  refetchRoot,          // () => void
  toast,
}) {
  const [expanded,     setExpanded]     = useState(new Set())
  const [loadingPaths, setLoadingPaths] = useState(new Set())
  const [subfolderMap, setSubfolderMap] = useState(new Map()) // path → FolderItem[]
  const [draggedPath,  setDraggedPath]  = useState(null)
  const [dragOverPath, setDragOverPath] = useState(null)
  const [newFolderPath, setNewFolderPath] = useState(null) // which parent to add under
  const [ctxMenu,      setCtxMenu]      = useState(null)   // { folder, position }

  // Load subfolders for a folder when expanded
  const loadSubfolders = useCallback(async (path) => {
    if (subfolderMap.has(path)) return // already loaded
    setLoadingPaths(prev => new Set([...prev, path]))
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSubfolderMap(prev => new Map([...prev, [path, data.folders ?? []]]))
    } catch {
      setSubfolderMap(prev => new Map([...prev, [path, []]]))
    } finally {
      setLoadingPaths(prev => { const n = new Set(prev); n.delete(path); return n })
    }
  }, [subfolderMap])

  const handleExpand = useCallback((path) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
        loadSubfolders(path)
      }
      return next
    })
  }, [loadSubfolders])

  // Drag & drop — move folder
  const handleDragStart = (e, folder) => {
    setDraggedPath(folder.path)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', folder.path)
  }

  const handleDrop = useCallback(async (e, targetPath) => {
    const src = draggedPath
    setDraggedPath(null)
    setDragOverPath(null)
    if (!src || src === targetPath || targetPath.startsWith(src + '/')) return
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move', paths: [src], destPath: targetPath }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      // Invalidate subfolder cache for affected paths
      setSubfolderMap(prev => {
        const next = new Map(prev)
        const parentSrc = src.split('/').slice(0, -1).join('/') || ''
        next.delete(parentSrc)
        next.delete(targetPath)
        return next
      })
      refetchRoot()
      toast?.('Moved successfully', 'success')
    } catch (err) {
      toast?.(err.message || 'Move failed', 'error')
    }
  }, [draggedPath, refetchRoot, toast])

  // New subfolder
  const handleNewSub = (parentPath) => {
    if (!expanded.has(parentPath)) {
      setExpanded(prev => new Set([...prev, parentPath]))
      loadSubfolders(parentPath)
    }
    setNewFolderPath(parentPath)
  }

  const handleNewFolderCreated = useCallback(() => {
    const parent = newFolderPath
    setNewFolderPath(null)
    // Invalidate subfolder cache so it reloads on next expand
    setSubfolderMap(prev => { const n = new Map(prev); n.delete(parent); return n })
    loadSubfolders(parent)
    refetchRoot()
    toast?.('Folder created', 'success')
  }, [newFolderPath, loadSubfolders, refetchRoot, toast])

  // Copy path to clipboard
  const handleCopyPath = async (folder) => {
    try {
      await navigator.clipboard.writeText(folder.path)
      toast?.('Path copied', 'success')
    } catch {
      toast?.('Copy failed', 'error')
    }
  }

  const state = {
    expanded,
    checked:     checkedFolders,
    active:      activeFolderPath,
    loadingPaths,
    subfolderMap,
  }

  const dragState = { draggedPath, dragOverPath }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#1e1e1e]">
        <span className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider flex-1">Folders</span>
        <button
          onClick={onNewRootFolder}
          title="New root folder"
          className="w-6 h-6 flex items-center justify-center rounded-[6px] text-[#6b7280] hover:text-[#f5f5f5] hover:bg-[#1c1c1c] transition-colors"
        >
          <FolderPlus size={13} />
        </button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1.5 px-1.5 space-y-0.5">
        {rootFolders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Folder size={28} className="text-[#333333] mb-3" />
            <p className="text-xs text-[#6b7280]">No folders yet</p>
            <button
              onClick={onNewRootFolder}
              className="mt-3 text-xs text-[#4f46e5] hover:text-[#818cf8] transition-colors"
            >
              + Create first folder
            </button>
          </div>
        ) : (
          rootFolders.map(folder => (
            <TreeNode
              key={folder.path}
              folder={folder}
              level={0}
              state={state}
              dragState={dragState}
              newFolderPath={newFolderPath}
              uploadEnabled={uploadEnabled}
              onExpand={handleExpand}
              onCheck={onFolderCheck}
              onOpen={onFolderOpen}
              onMoreOptions={(e, f) => setCtxMenu({ folder: f, position: { x: e.clientX, y: e.clientY } })}
              onNewSub={handleNewSub}
              onUpload={onFolderUpload}
              onNewFolderCreated={handleNewFolderCreated}
              onNewFolderCancel={() => setNewFolderPath(null)}
              onDragStart={handleDragStart}
              onDragOver={path => setDragOverPath(path)}
              onDragLeave={() => setDragOverPath(null)}
              onDrop={handleDrop}
            />
          ))
        )}

        {/* Root-level new-folder form */}
        {newFolderPath === '' && (
          <InlineNewFolder
            parentPath=""
            onCreated={handleNewFolderCreated}
            onCancel={() => setNewFolderPath(null)}
          />
        )}
      </div>

      {/* Footer: checked count */}
      {checkedFolders.size > 0 && (
        <div className="px-3 py-2 border-t border-[#1e1e1e]">
          <p className="text-[10px] text-[#6b7280]">
            {checkedFolders.size} folder{checkedFolders.size > 1 ? 's' : ''} selected
            {checkedFolders.size > 1 && <span className="text-[#f59e0b] ml-1">· upload disabled</span>}
          </p>
        </div>
      )}

      {/* Context menu */}
      {ctxMenu && (
        <FolderCtxMenu
          folder={ctxMenu.folder}
          position={ctxMenu.position}
          onClose={() => setCtxMenu(null)}
          onRename={onRename}
          onDelete={onDelete}
          onNewSub={f => { handleNewSub(f.path); setCtxMenu(null) }}
          onCopyPath={handleCopyPath}
        />
      )}
    </div>
  )
}
