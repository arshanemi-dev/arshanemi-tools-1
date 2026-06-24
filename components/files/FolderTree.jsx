'use client'
// FolderTree — last updated 2026-06-24
// Tasks covered: T1 search+select-all+refresh, T2 auto-expand on open,
//                T3 upload removed / ctx-menu rename+delete only,
//                T4 auto-name new_folder_N, T5 force-refetch fix,
//                T6 RootFoldersList component

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Folder, FolderOpen, ChevronRight, ChevronDown,
  Plus, MoreVertical, Pencil, Trash2,
  FolderPlus, Loader2, X, Search, RefreshCw, CheckSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

/* ─── Auto-name helper ────────────────────────────────────────────── */
function getNextFolderName(existingNames = []) {
  const used = new Set()
  existingNames.forEach(name => {
    const m = /^new_folder_(\d+)$/i.exec(name)
    if (m) used.add(parseInt(m[1], 10))
  })
  let n = 1
  while (used.has(n)) n++
  return `new_folder_${n}`
}

/* ─── Folder Context Menu: Rename + Delete only (Task 3) ─────────── */
function FolderCtxMenu({ folder, position, onClose, onRename, onDelete }) {
  const ref = useRef(null)

  useEffect(() => {
    const handle = e => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    setTimeout(() => window.addEventListener('mousedown', handle), 0)
    return () => window.removeEventListener('mousedown', handle)
  }, [onClose])

  if (!position) return null
  const x = Math.min(position.x, window.innerWidth  - 170)
  const y = Math.min(position.y, window.innerHeight - 120)

  const Item = ({ icon: Icon, label, onClick, danger }) => (
    <button
      onClick={() => { onClick(); onClose() }}
      className={cn(
        'flex items-center gap-2 w-full px-3 py-1.5 text-xs rounded-[6px] transition-colors cursor-pointer',
        danger
          ? 'text-[#ef4444] hover:bg-[#450a0a]'
          : 'text-[#a3a3a3] hover:text-[#f5f5f5] hover:bg-[#1c1c1c]'
      )}
    >
      <Icon size={12} className="shrink-0" />
      {label}
    </button>
  )

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', left: x, top: y, zIndex: 2000 }}
      className="w-38 bg-[#161616] border border-[#333333] rounded-[10px] shadow-2xl shadow-black/70 p-1 animate-fadeIn"
      onClick={e => e.stopPropagation()}
    >
      <Item icon={Pencil} label="Rename"        onClick={() => onRename(folder)} />
      <div className="my-1 mx-2 h-px bg-[#262626]" />
      <Item icon={Trash2} label="Delete Folder" onClick={() => onDelete(folder)} danger />
    </div>
  )
}

/* ─── Inline Create Folder Form (Task 4: default name) ───────────── */
function InlineNewFolder({ parentPath, defaultName, onCreated, onCancel }) {
  const [name, setName] = useState(defaultName || '')
  const [busy, setBusy]  = useState(false)
  const inputRef          = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  async function submit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy(true)
    try {
      const res = await fetch('/api/files', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'create-folder', path: parentPath, name: trimmed }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      onCreated(trimmed)
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-1 pr-2 py-1">
      <Folder size={11} className="text-[#4f46e5] shrink-0 ml-1" fill="rgba(79,70,229,0.15)" />
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

/* ─── Single Folder Row (Task 3: no Upload button) ───────────────── */
function FolderRow({
  folder, level,
  isChecked, isExpanded, isActive, isDragOver, isLoading,
  onCheck, onExpand, onOpen, onMoreOptions, onNewSub,
  onDragStart, onDragOver, onDragLeave, onDrop,
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
        isActive  && !isDragOver && 'bg-[#1e1b4b]',
        isDragOver && 'bg-[#4f46e5]/20 border border-dashed border-[#4f46e5]/60',
        !isActive && !isDragOver && 'hover:bg-[#1c1c1c]',
      )}
      style={{ paddingLeft: `${6 + level * 14}px` }}
    >
      {/* Expand arrow */}
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

      {/* Folder icon + name (Task 2: clicking opens AND expands) */}
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

      {/* Hover actions: New subfolder + More options only (Task 3: removed Upload) */}
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); onNewSub(folder.path) }}
          title="New subfolder"
          className="w-5 h-5 flex items-center justify-center rounded text-[#6b7280] hover:text-[#f5f5f5] hover:bg-[#262626]"
        >
          <Plus size={10} />
        </button>
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
  folder, level, state, dragState,
  newFolderPath, newFolderDefaultName,
  onExpand, onCheck, onOpen, onMoreOptions, onNewSub,
  onNewFolderCreated, onNewFolderCancel,
  onDragStart, onDragOver, onDragLeave, onDrop,
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
        folder={folder} level={level}
        isChecked={isChecked} isExpanded={isExpanded}
        isActive={isActive} isDragOver={isDragOver} isLoading={isLoading}
        onCheck={onCheck} onExpand={onExpand} onOpen={onOpen}
        onMoreOptions={onMoreOptions} onNewSub={onNewSub}
        onDragStart={onDragStart} onDragOver={onDragOver}
        onDragLeave={onDragLeave} onDrop={onDrop}
      />

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            {/* New folder form at top of children list (Task 4) */}
            {showNewHere && (
              <div style={{ paddingLeft: `${6 + (level + 1) * 14}px` }}>
                <InlineNewFolder
                  parentPath={folder.path}
                  defaultName={newFolderDefaultName}
                  onCreated={onNewFolderCreated}
                  onCancel={onNewFolderCancel}
                />
              </div>
            )}

            {children.map(child => (
              <TreeNode
                key={child.path}
                folder={child} level={level + 1}
                state={state} dragState={dragState}
                newFolderPath={newFolderPath}
                newFolderDefaultName={newFolderDefaultName}
                onExpand={onExpand} onCheck={onCheck} onOpen={onOpen}
                onMoreOptions={onMoreOptions} onNewSub={onNewSub}
                onNewFolderCreated={onNewFolderCreated}
                onNewFolderCancel={onNewFolderCancel}
                onDragStart={onDragStart} onDragOver={onDragOver}
                onDragLeave={onDragLeave} onDrop={onDrop}
              />
            ))}

            {/* Empty subfolder prompt (Task 4) */}
            {!isLoading && children.length === 0 && !showNewHere && (
              <button
                onClick={() => onNewSub(folder.path)}
                style={{ paddingLeft: `${6 + (level + 1) * 14}px` }}
                className="flex items-center gap-1.5 w-full py-1.5 text-[10px] text-[#6b7280] hover:text-[#4f46e5] transition-colors"
              >
                <Plus size={10} /> New folder
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Root Folders List component — created 2026-06-24 ───────────── */
function RootFoldersList({
  rootFolders, state, dragState,
  newFolderPath, newFolderDefaultName,
  onExpand, onCheck, onOpen, onMoreOptions, onNewSub,
  onNewFolderCreated, onNewFolderCancel, onNewRootFolder,
  onDragStart, onDragOver, onDragLeave, onDrop,
}) {
  if (rootFolders.length === 0) {
    return (
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
    )
  }

  return (
    <>
      {rootFolders.map(folder => (
        <TreeNode
          key={folder.path}
          folder={folder} level={0}
          state={state} dragState={dragState}
          newFolderPath={newFolderPath}
          newFolderDefaultName={newFolderDefaultName}
          onExpand={onExpand} onCheck={onCheck} onOpen={onOpen}
          onMoreOptions={onMoreOptions} onNewSub={onNewSub}
          onNewFolderCreated={onNewFolderCreated}
          onNewFolderCancel={onNewFolderCancel}
          onDragStart={onDragStart} onDragOver={onDragOver}
          onDragLeave={onDragLeave} onDrop={onDrop}
        />
      ))}

      {/* Root-level new-folder form */}
      {newFolderPath === '' && (
        <div className="px-1">
          <InlineNewFolder
            parentPath=""
            defaultName={newFolderDefaultName}
            onCreated={onNewFolderCreated}
            onCancel={onNewFolderCancel}
          />
        </div>
      )}
    </>
  )
}

/* ─── FolderTree (main export) ────────────────────────────────────── */
export default function FolderTree({
  rootFolders,
  activeFolderPath,
  checkedFolders,
  onFolderOpen,
  onFolderCheck,
  onSelectAllFolders,
  onNewRootFolder,
  onRename,
  onDelete,
  refetchRoot,
  toast,
}) {
  const [expanded,             setExpanded]             = useState(new Set())
  const [loadingPaths,         setLoadingPaths]         = useState(new Set())
  const [subfolderMap,         setSubfolderMap]         = useState(new Map())
  const [draggedPath,          setDraggedPath]          = useState(null)
  const [dragOverPath,         setDragOverPath]         = useState(null)
  const [newFolderPath,        setNewFolderPath]        = useState(null)
  const [newFolderDefaultName, setNewFolderDefaultName] = useState('')
  const [ctxMenu,              setCtxMenu]              = useState(null)
  const [search,               setSearch]               = useState('')

  // Ref keeps latest subfolderMap available in callbacks — avoids stale-closure (Task 5)
  const subfolderMapRef = useRef(subfolderMap)
  useEffect(() => { subfolderMapRef.current = subfolderMap }, [subfolderMap])

  // ── Search filter ────────────────────────────────────────────────
  const filteredRootFolders = useMemo(() => {
    if (!search.trim()) return rootFolders
    const q = search.trim().toLowerCase()
    return rootFolders.filter(f => f.name.toLowerCase().includes(q))
  }, [rootFolders, search])

  // ── Load subfolders (Task 5: force flag bypasses cache) ──────────
  const loadSubfolders = useCallback(async (path, force = false) => {
    if (!force && subfolderMapRef.current.has(path)) return
    setLoadingPaths(prev => new Set([...prev, path]))
    try {
      const res  = await fetch(`/api/files?path=${encodeURIComponent(path)}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSubfolderMap(prev => {
        const next = new Map(prev)
        next.set(path, data.folders ?? [])
        subfolderMapRef.current = next
        return next
      })
    } catch {
      setSubfolderMap(prev => {
        const next = new Map(prev)
        next.set(path, [])
        subfolderMapRef.current = next
        return next
      })
    } finally {
      setLoadingPaths(prev => { const n = new Set(prev); n.delete(path); return n })
    }
  }, [])

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

  // Task 2: clicking a folder opens it AND expands the tree
  const handleOpen = useCallback((path) => {
    onFolderOpen(path)
    setExpanded(prev => {
      if (prev.has(path)) return prev
      const next = new Set(prev)
      next.add(path)
      loadSubfolders(path)
      return next
    })
  }, [onFolderOpen, loadSubfolders])

  // ── Drag & drop ──────────────────────────────────────────────────
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
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'move', paths: [src], destPath: targetPath }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const parentSrc = src.split('/').slice(0, -1).join('/') || ''
      // Invalidate cache for affected paths and force-reload (Task 5)
      setSubfolderMap(prev => {
        const next = new Map(prev)
        next.delete(parentSrc)
        next.delete(targetPath)
        subfolderMapRef.current = next
        return next
      })
      loadSubfolders(targetPath, true)
      if (parentSrc !== targetPath) loadSubfolders(parentSrc, true)
      refetchRoot()
      toast?.('Moved successfully', 'success')
    } catch (err) {
      toast?.(err.message || 'Move failed', 'error')
    }
  }, [draggedPath, loadSubfolders, refetchRoot, toast])

  // ── New subfolder (Task 4: auto-name) ────────────────────────────
  const handleNewSub = useCallback((parentPath) => {
    // Expand so the form appears inside the folder
    setExpanded(prev => {
      if (prev.has(parentPath)) return prev
      const next = new Set(prev)
      next.add(parentPath)
      loadSubfolders(parentPath)
      return next
    })
    // Compute default name from existing siblings
    const siblings    = subfolderMapRef.current.get(parentPath) ?? []
    const defaultName = getNextFolderName(siblings.map(f => f.name))
    setNewFolderDefaultName(defaultName)
    setNewFolderPath(parentPath)
  }, [loadSubfolders])

  const handleNewRootFolder = useCallback(() => {
    const defaultName = getNextFolderName(rootFolders.map(f => f.name))
    setNewFolderDefaultName(defaultName)
    setNewFolderPath('')
  }, [rootFolders])

  // Task 5: after creation force-reload parent's children immediately
  const handleNewFolderCreated = useCallback(() => {
    const parent = newFolderPath
    setNewFolderPath(null)
    setNewFolderDefaultName('')
    // Clear cache entry then force-reload
    setSubfolderMap(prev => {
      const next = new Map(prev)
      next.delete(parent)
      subfolderMapRef.current = next
      return next
    })
    loadSubfolders(parent, true)
    refetchRoot()
    toast?.('Folder created', 'success')
  }, [newFolderPath, loadSubfolders, refetchRoot, toast])

  // ── Select-all / deselect-all toggle ─────────────────────────────
  const allSelected = filteredRootFolders.length > 0 &&
    filteredRootFolders.every(f => checkedFolders.has(f.path))

  const handleSelectAll = useCallback(() => {
    if (!onSelectAllFolders) return
    if (allSelected) {
      onSelectAllFolders([])   // deselect all
    } else {
      onSelectAllFolders(filteredRootFolders.map(f => f.path))
    }
  }, [allSelected, filteredRootFolders, onSelectAllFolders])

  // ── Full refresh (Task 6) ─────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    setSubfolderMap(new Map())
    subfolderMapRef.current = new Map()
    refetchRoot()
  }, [refetchRoot])

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

      {/* Header — refresh + select-all + new folder (Task 1, 6) */}
      <div className="flex items-center gap-1 px-3 py-2.5 border-b border-[#1e1e1e]">
        <div className="relative w-full">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#6b7280]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search folders…"
            className="w-full pl-6 pr-6 h-7 bg-[#111111] border border-[#262626] rounded-[6px] text-xs text-[#f5f5f5] placeholder-[#6b7280] focus:outline-none focus:border-[#4f46e5] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#f5f5f5]"
            >
              <X size={10} />
            </button>
          )}
        </div>
        <button
          onClick={handleSelectAll}
          title={allSelected ? 'Deselect all folders' : 'Select all folders'}
          className={cn(
            'w-6 h-6 flex items-center justify-center rounded-[6px] transition-colors',
            allSelected
              ? 'text-[#818cf8] bg-[#1e1b4b] hover:bg-[#2d2a6e]'
              : 'text-[#6b7280] hover:text-[#f5f5f5] hover:bg-[#1c1c1c]'
          )}
        >
          <CheckSquare size={12} />
        </button>
        <button
          onClick={handleRefresh}
          title="Refresh folders"
          className="w-6 h-6 flex items-center justify-center rounded-[6px] text-[#6b7280] hover:text-[#4f46e5] hover:bg-[#1c1c1c] transition-colors"
        >
          <RefreshCw size={12} />
        </button>
        <button
          onClick={handleNewRootFolder}
          title="New root folder"
          className="w-6 h-6 flex items-center justify-center rounded-[6px] text-[#6b7280] hover:text-[#f5f5f5] hover:bg-[#1c1c1c] transition-colors"
        >
          <FolderPlus size={13} />
        </button>
      </div>


      {/* Tree (Task 6: RootFoldersList component) */}
      <div className="flex-1 overflow-y-auto py-1.5 px-1.5 space-y-0.5">
        <RootFoldersList
          rootFolders={filteredRootFolders}
          state={state}
          dragState={dragState}
          newFolderPath={newFolderPath}
          newFolderDefaultName={newFolderDefaultName}
          onExpand={handleExpand}
          onCheck={onFolderCheck}
          onOpen={handleOpen}
          onMoreOptions={(e, f) => setCtxMenu({ folder: f, position: { x: e.clientX, y: e.clientY } })}
          onNewSub={handleNewSub}
          onNewFolderCreated={handleNewFolderCreated}
          onNewFolderCancel={() => { setNewFolderPath(null); setNewFolderDefaultName('') }}
          onNewRootFolder={handleNewRootFolder}
          onDragStart={handleDragStart}
          onDragOver={path => setDragOverPath(path)}
          onDragLeave={() => setDragOverPath(null)}
          onDrop={handleDrop}
        />
      </div>

      {/* Footer: checked count */}
      {checkedFolders.size > 0 && (
        <div className="px-3 py-2 border-t border-[#1e1e1e]">
          <p className="text-[10px] text-[#6b7280]">
            {checkedFolders.size} folder{checkedFolders.size > 1 ? 's' : ''} selected
            {checkedFolders.size > 1 && (
              <span className="text-[#f59e0b] ml-1">· multi-view mode</span>
            )}
          </p>
        </div>
      )}

      {/* Context menu (Task 3: only Rename + Delete) */}
      {ctxMenu && (
        <FolderCtxMenu
          folder={ctxMenu.folder}
          position={ctxMenu.position}
          onClose={() => setCtxMenu(null)}
          onRename={onRename}
          onDelete={onDelete}
        />
      )}
    </div>
  )
}
