'use client'
// FolderTree — last updated 2026-06-25
// T1: No Plus in row hover; "New Folder" button always at BOTTOM of open folder
// T2: Pencil + Trash inline (no three-dots); inline rename — no modal
// T5: Beautiful "Create First Folder" card in empty state

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Folder, FolderOpen, ChevronRight, ChevronDown,
  Plus, Pencil, Trash2,
  Loader2, X, Search, RefreshCw, CheckSquare, Check,
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

/* ─── Inline Create Folder Form ───────────────────────────────────── */
function InlineNewFolder({ parentPath, defaultName, onCreated, onCancel }) {
  const [name, setName] = useState(defaultName || '')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

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
    <form
      onSubmit={submit}
      className="flex items-center gap-1.5 px-2 py-1.5 mx-0.5 my-0.5 bg-[var(--lt-accent-muted)] rounded-[8px] border border-[var(--lt-accent)]/30"
      onClick={e => e.stopPropagation()}
    >
      <Folder size={12} className="text-[var(--lt-accent)] shrink-0" fill="rgba(79,70,229,0.18)" />
      <input
        ref={inputRef}
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') onCancel() }}
        placeholder="Folder name…"
        className="flex-1 min-w-0 px-2 py-0.5 text-xs bg-[var(--lt-bg-base)] border border-[var(--lt-accent)]/50 rounded-[5px] text-[var(--lt-text-primary)] placeholder-[var(--lt-text-subtle)] focus:outline-none focus:border-[var(--lt-accent)]"
      />
      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="w-6 h-6 flex items-center justify-center rounded-[5px] bg-[var(--lt-accent)] hover:bg-[var(--lt-accent-hover)] text-white disabled:opacity-40 shrink-0 transition-colors"
      >
        {busy ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="w-6 h-6 flex items-center justify-center rounded-[5px] text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] hover:bg-[var(--lt-divider)] shrink-0 transition-colors"
      >
        <X size={10} />
      </button>
    </form>
  )
}

/* ─── Inline Folder Rename Row (T2) ───────────────────────────────── */
function InlineFolderRename({ level, renameName, onNameChange, onSave, onCancel, busy }) {
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSave() }}
      className="flex items-center gap-1.5 pr-2 py-[4px] rounded-[7px] bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/30"
      style={{ paddingLeft: `${6 + level * 14}px` }}
      onClick={e => e.stopPropagation()}
    >
      {/* arrow spacer */}
      <span className="w-4 h-4 shrink-0" />
      {/* checkbox spacer */}
      <span className="w-3.5 h-3.5 shrink-0" />
      <FolderOpen size={13} className="text-[var(--lt-accent-light)] shrink-0" fill="rgba(129,140,248,0.2)" />
      <input
        ref={inputRef}
        value={renameName}
        onChange={e => onNameChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Escape') { e.preventDefault(); onCancel() }
          if (e.key === 'Enter')  { e.preventDefault(); onSave() }
        }}
        className="flex-1 min-w-0 px-2 py-0.5 text-xs bg-[var(--lt-bg-base)] border border-[var(--lt-accent)] rounded-[5px] text-[var(--lt-text-primary)] placeholder-[var(--lt-text-subtle)] focus:outline-none"
      />
      <button
        type="submit"
        disabled={busy || !renameName.trim()}
        className="w-5 h-5 flex items-center justify-center rounded-[4px] bg-[var(--lt-accent)] text-white disabled:opacity-40 shrink-0 hover:bg-[var(--lt-accent-hover)] transition-colors"
      >
        {busy ? <Loader2 size={9} className="animate-spin" /> : <Check size={9} />}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="w-5 h-5 flex items-center justify-center rounded-[4px] text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] hover:bg-[var(--lt-divider)] shrink-0 transition-colors"
      >
        <X size={9} />
      </button>
    </form>
  )
}

/* ─── "New Folder" bottom button (T1) ────────────────────────────── */
function NewFolderBottomBtn({ level, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ paddingLeft: `${20 + level * 14}px` }}
      className="group/nbtn flex items-center gap-1.5 w-full py-1.5 pr-3 text-[10px] text-[var(--lt-text-subtle)] hover:text-[var(--lt-accent-light)] transition-all rounded-[6px] hover:bg-[var(--lt-accent-muted)]"
    >
      <span className="w-4 h-4 flex items-center justify-center rounded-[4px] border border-[var(--lt-divider)] group-hover/nbtn:border-[var(--lt-accent)]/50 group-hover/nbtn:bg-[var(--lt-accent-muted)]/60 transition-all shrink-0">
        <Plus size={8} />
      </span>
      New Folder
    </button>
  )
}

/* ─── Single Folder Row (T1: no Plus hover; T2: Pencil+Trash direct) */
function FolderRow({
  folder, level,
  isChecked, isExpanded, isActive, isDragOver, isLoading,
  isFilesLoading,
  onCheck, onExpand, onOpen,
  onInlineRename, onDelete,
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
        isActive      && !isDragOver && 'bg-[var(--lt-accent-muted)]',
        isDragOver    && 'bg-[var(--lt-accent)]/20 border border-dashed border-[var(--lt-accent)]/60',
        !isActive     && !isDragOver && 'hover:bg-[var(--lt-card-hover)]',
        isFilesLoading && 'animate-pulse',
      )}
      style={{ paddingLeft: `${6 + level * 14}px` }}
    >
      {/* Expand arrow */}
      <button
        onClick={e => { e.stopPropagation(); onExpand(folder.path) }}
        className="w-4 h-4 flex items-center justify-center shrink-0 text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-muted)]"
      >
        {isLoading
          ? <Loader2 size={10} className="animate-spin text-[var(--lt-accent)]" />
          : isExpanded
          ? <ChevronDown  size={11} />
          : <ChevronRight size={11} />
        }
      </button>

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isChecked}
        onChange={e => { e.stopPropagation(); onCheck(folder.path) }}
        onClick={e => e.stopPropagation()}
        className="w-3.5 h-3.5 accent-[var(--lt-accent)] shrink-0 cursor-pointer"
      />

      {/* Folder icon + name — spinner replaces icon while files load */}
      <button
        onClick={() => onOpen(folder.path)}
        className="flex items-center gap-1.5 flex-1 min-w-0 py-0.5 text-left"
      >
        {isFilesLoading ? (
          <Loader2 size={13} className="text-[var(--lt-accent)] animate-spin shrink-0" />
        ) : isExpanded ? (
          <FolderOpen size={13} className={isActive ? 'text-[var(--lt-accent-light)]' : 'text-[var(--lt-accent)]'} fill={isActive ? 'rgba(129,140,248,0.2)' : 'rgba(79,70,229,0.12)'} />
        ) : (
          <Folder size={13} className={isActive ? 'text-[var(--lt-accent-light)]' : 'text-[var(--lt-accent)]'} fill={isActive ? 'rgba(129,140,248,0.2)' : 'rgba(79,70,229,0.12)'} />
        )}
        <span className={cn(
          'text-xs truncate',
          isActive ? 'text-[var(--lt-accent-light)] font-medium' : 'text-[var(--lt-text-muted)] group-hover/row:text-[var(--lt-text-primary)]'
        )}>
          {folder.name}
        </span>
      </button>

      {/* Hover actions: Pencil (rename) + Trash (delete) — no three-dots, no Plus (T2) */}
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); onInlineRename(folder) }}
          title="Rename"
          className="w-5 h-5 flex items-center justify-center rounded-[4px] text-[var(--lt-text-subtle)] hover:text-[var(--lt-accent-light)] hover:bg-[var(--lt-accent-muted)] transition-colors"
        >
          <Pencil size={10} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(folder) }}
          title="Delete folder"
          className="w-5 h-5 flex items-center justify-center rounded-[4px] text-[var(--lt-text-subtle)] hover:text-[#ef4444] hover:bg-[#450a0a] transition-colors"
        >
          <Trash2 size={10} />
        </button>
      </div>

      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-[var(--lt-accent)]" />
      )}
    </div>
  )
}

/* ─── Recursive Tree Node ─────────────────────────────────────────── */
function TreeNode({
  folder, level, state, dragState,
  newFolderPath, newFolderDefaultName,
  renamingFolderPath, renamingFolderName, renamingBusy,
  onExpand, onCheck, onOpen,
  onInlineRename, onDelete, onNewSub,
  onNewFolderCreated, onNewFolderCancel,
  onRenameNameChange, onSaveRename, onCancelRename,
  onDragStart, onDragOver, onDragLeave, onDrop,
}) {
  const isExpanded    = state.expanded.has(folder.path)
  const isChecked     = state.checked.has(folder.path)
  const isActive      = state.active === folder.path
  const isDragOver    = dragState.dragOverPath === folder.path && dragState.draggedPath !== folder.path
  const isLoading     = state.loadingPaths.has(folder.path)
  const isFilesLoading = state.filesLoading && isActive   // right-panel files are loading for active folder
  const isRenaming    = renamingFolderPath === folder.path
  const children      = state.subfolderMap.get(folder.path) ?? []
  const showNewHere   = newFolderPath === folder.path

  return (
    <div>
      {/* T2: show inline rename form in place of row */}
      {isRenaming ? (
        <InlineFolderRename
          level={level}
          renameName={renamingFolderName}
          onNameChange={onRenameNameChange}
          onSave={onSaveRename}
          onCancel={onCancelRename}
          busy={renamingBusy}
        />
      ) : (
        <FolderRow
          folder={folder} level={level}
          isChecked={isChecked} isExpanded={isExpanded}
          isActive={isActive} isDragOver={isDragOver} isLoading={isLoading}
          isFilesLoading={isFilesLoading}
          onCheck={onCheck} onExpand={onExpand} onOpen={onOpen}
          onInlineRename={onInlineRename} onDelete={onDelete}
          onDragStart={onDragStart} onDragOver={onDragOver}
          onDragLeave={onDragLeave} onDrop={onDrop}
        />
      )}

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
                folder={child} level={level + 1}
                state={state} dragState={dragState}
                newFolderPath={newFolderPath}
                newFolderDefaultName={newFolderDefaultName}
                renamingFolderPath={renamingFolderPath}
                renamingFolderName={renamingFolderName}
                renamingBusy={renamingBusy}
                onExpand={onExpand} onCheck={onCheck} onOpen={onOpen}
                onInlineRename={onInlineRename} onDelete={onDelete} onNewSub={onNewSub}
                onNewFolderCreated={onNewFolderCreated}
                onNewFolderCancel={onNewFolderCancel}
                onRenameNameChange={onRenameNameChange}
                onSaveRename={onSaveRename}
                onCancelRename={onCancelRename}
                onDragStart={onDragStart} onDragOver={onDragOver}
                onDragLeave={onDragLeave} onDrop={onDrop}
              />
            ))}

            {/* T1: New Folder always at bottom when open */}
            {showNewHere ? (
              <div style={{ paddingLeft: `${(level + 1) * 14}px` }} className="px-1 py-0.5">
                <InlineNewFolder
                  parentPath={folder.path}
                  defaultName={newFolderDefaultName}
                  onCreated={onNewFolderCreated}
                  onCancel={onNewFolderCancel}
                />
              </div>
            ) : (
              !isLoading && (
                <NewFolderBottomBtn
                  level={level + 1}
                  onClick={() => onNewSub(folder.path)}
                />
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Root-level "New Folder" button (T2) ────────────────────────── */
function RootNewFolderButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="group/rnf flex items-center gap-2 w-full px-3 py-2 rounded-[8px] border border-dashed border-[var(--lt-divider-light)] hover:border-[var(--lt-accent)]/40 text-[var(--lt-text-subtle)] hover:text-[var(--lt-accent-light)] hover:bg-[var(--lt-accent-muted)] transition-all text-[11px] font-medium"
    >
      <span className="w-5 h-5 flex items-center justify-center rounded-[5px] border border-[var(--lt-divider-light)] group-hover/rnf:border-[var(--lt-accent)]/50 group-hover/rnf:bg-[var(--lt-accent-muted)]/60 transition-all shrink-0">
        <Plus size={10} />
      </span>
      New Folder
    </button>
  )
}

/* ─── Root Folders List ───────────────────────────────────────────── */
function RootFoldersList({
  rootFolders, rootPath, state, dragState,
  newFolderPath, newFolderDefaultName,
  renamingFolderPath, renamingFolderName, renamingBusy,
  onExpand, onCheck, onOpen,
  onInlineRename, onDelete, onNewSub,
  onNewFolderCreated, onNewFolderCancel, onNewRootFolder,
  onRenameNameChange, onSaveRename, onCancelRename,
  onDragStart, onDragOver, onDragLeave, onDrop,
}) {
  const isRootForm = newFolderPath === rootPath

  // T5: beautiful empty state with root-level New Folder at bottom
  if (rootFolders.length === 0) {
    return (
      <div className="flex flex-col">
        <div className="flex flex-col items-center justify-center py-8 px-5 text-center">
          <div className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-[var(--lt-accent-muted)] to-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/20 flex items-center justify-center mb-3 shadow-lg shadow-[var(--lt-accent)]/10">
            <Folder size={26} className="text-[var(--lt-accent)]" fill="rgba(79,70,229,0.2)" />
          </div>
          <p className="text-xs font-semibold text-[var(--lt-text-muted)] mb-1">No folders yet</p>
          <p className="text-[10px] text-[var(--lt-text-subtle)] leading-relaxed">
            Use the button below to create<br />your first folder
          </p>
        </div>

        {/* Root-level new-folder form or button — at bottom even when empty */}
        <div className="px-2 pb-2">
          {isRootForm ? (
            <InlineNewFolder
              parentPath={rootPath}
              defaultName={newFolderDefaultName}
              onCreated={onNewFolderCreated}
              onCancel={onNewFolderCancel}
            />
          ) : (
            <RootNewFolderButton onClick={onNewRootFolder} />
          )}
        </div>
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
          renamingFolderPath={renamingFolderPath}
          renamingFolderName={renamingFolderName}
          renamingBusy={renamingBusy}
          onExpand={onExpand} onCheck={onCheck} onOpen={onOpen}
          onInlineRename={onInlineRename} onDelete={onDelete} onNewSub={onNewSub}
          onNewFolderCreated={onNewFolderCreated}
          onNewFolderCancel={onNewFolderCancel}
          onRenameNameChange={onRenameNameChange}
          onSaveRename={onSaveRename}
          onCancelRename={onCancelRename}
          onDragStart={onDragStart} onDragOver={onDragOver}
          onDragLeave={onDragLeave} onDrop={onDrop}
        />
      ))}

      {/* Root-level: always show New Folder button or inline form at bottom (T2) */}
      <div className="px-1.5 pt-1 pb-1">
        {isRootForm ? (
          <InlineNewFolder
            parentPath={rootPath}
            defaultName={newFolderDefaultName}
            onCreated={onNewFolderCreated}
            onCancel={onNewFolderCancel}
          />
        ) : (
          <RootNewFolderButton onClick={onNewRootFolder} />
        )}
      </div>
    </>
  )
}

/* ─── FolderTree (main export) ────────────────────────────────────── */
export default function FolderTree({
  rootFolders,
  rootPath = '',
  activeFolderPath,
  checkedFolders,
  filesLoading,
  sidebarLoading,
  onFolderOpen,
  onFolderCheck,
  onSelectAllFolders,
  onNewRootFolder,
  onRename,
  onDelete,
  onDeletePaths,
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
  const [search,               setSearch]               = useState('')

  // T2: inline folder rename state
  const [renamingFolderPath, setRenamingFolderPath] = useState(null)
  const [renamingFolderName, setRenamingFolderName] = useState('')
  const [renamingBusy,       setRenamingBusy]       = useState(false)

  const subfolderMapRef = useRef(subfolderMap)
  useEffect(() => { subfolderMapRef.current = subfolderMap }, [subfolderMap])

  // ── Search filter ────────────────────────────────────────────────
  const filteredRootFolders = useMemo(() => {
    if (!search.trim()) return rootFolders
    const q = search.trim().toLowerCase()
    return rootFolders.filter(f => f.name.toLowerCase().includes(q))
  }, [rootFolders, search])

  // ── Load subfolders ──────────────────────────────────────────────
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

  // ── New subfolder (T1: opens form at bottom) ─────────────────────
  const handleNewSub = useCallback((parentPath) => {
    setExpanded(prev => {
      if (prev.has(parentPath)) return prev
      const next = new Set(prev)
      next.add(parentPath)
      loadSubfolders(parentPath)
      return next
    })
    const siblings    = subfolderMapRef.current.get(parentPath) ?? []
    const defaultName = getNextFolderName(siblings.map(f => f.name))
    setNewFolderDefaultName(defaultName)
    setNewFolderPath(parentPath)
  }, [loadSubfolders])

  const handleNewRootFolder = useCallback(() => {
    const defaultName = getNextFolderName(rootFolders.map(f => f.name))
    setNewFolderDefaultName(defaultName)
    setNewFolderPath(rootPath)
  }, [rootFolders, rootPath])

  const handleNewFolderCreated = useCallback(() => {
    const parent = newFolderPath
    setNewFolderPath(null)
    setNewFolderDefaultName('')
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

  // ── T2: Inline folder rename ─────────────────────────────────────
  const doSaveRename = useCallback(async (path, name) => {
    const trimmed = name.trim()
    // find original name
    const allFolders = [
      ...rootFolders,
      ...[...subfolderMapRef.current.values()].flat(),
    ]
    const original = allFolders.find(f => f.path === path)
    if (!trimmed || (original && trimmed === original.name)) {
      setRenamingFolderPath(null)
      setRenamingFolderName('')
      return
    }
    setRenamingBusy(true)
    try {
      const res = await fetch('/api/files', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ path, newName: trimmed }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setRenamingFolderPath(null)
      setRenamingFolderName('')
      // Invalidate parent cache
      const parentPath = path.split('/').slice(0, -1).join('/') || ''
      setSubfolderMap(prev => {
        const next = new Map(prev)
        next.delete(parentPath)
        subfolderMapRef.current = next
        return next
      })
      refetchRoot()
      toast?.('Renamed', 'success')
    } catch (err) {
      toast?.(err.message || 'Rename failed', 'error')
      setRenamingFolderPath(null)
      setRenamingFolderName('')
    } finally {
      setRenamingBusy(false)
    }
  }, [rootFolders, refetchRoot, toast])

  const handleInlineRename = useCallback(async (folder) => {
    // Auto-save any currently open rename first
    if (renamingFolderPath && renamingFolderPath !== folder.path) {
      await doSaveRename(renamingFolderPath, renamingFolderName)
    }
    setRenamingFolderPath(folder.path)
    setRenamingFolderName(folder.name)
  }, [renamingFolderPath, renamingFolderName, doSaveRename])

  const handleSaveRename = useCallback(() => {
    if (renamingFolderPath) doSaveRename(renamingFolderPath, renamingFolderName)
  }, [renamingFolderPath, renamingFolderName, doSaveRename])

  const handleCancelRename = useCallback(() => {
    setRenamingFolderPath(null)
    setRenamingFolderName('')
  }, [])

  const handleDeleteFolder = useCallback((folder) => {
    onDelete(folder)
  }, [onDelete])

  // ── Select-all toggle ─────────────────────────────────────────────
  const allSelected = filteredRootFolders.length > 0 &&
    filteredRootFolders.every(f => checkedFolders.has(f.path))

  const handleSelectAll = useCallback(() => {
    if (!onSelectAllFolders) return
    if (allSelected) {
      onSelectAllFolders([])
    } else {
      onSelectAllFolders(filteredRootFolders.map(f => f.path))
    }
  }, [allSelected, filteredRootFolders, onSelectAllFolders])

  const handleRefresh = useCallback(() => {
    setSubfolderMap(new Map())
    subfolderMapRef.current = new Map()
    refetchRoot()
  }, [refetchRoot])

  const state     = { expanded, checked: checkedFolders, active: activeFolderPath, loadingPaths, subfolderMap, filesLoading }
  const dragState = { draggedPath, dragOverPath }

  return (
    <div className="flex flex-col h-full">

      {/* Header — search · select-all · refresh [ · delete when selected ] */}
      <div className="flex items-center gap-1 px-3 py-2.5 border-b border-[var(--lt-divider)]">
        <div className="relative w-full">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--lt-text-subtle)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search folders…"
            className="w-full pl-6 pr-6 h-7 bg-[var(--lt-surface)] border border-[var(--lt-divider)] rounded-[6px] text-xs text-[var(--lt-text-primary)] placeholder-[var(--lt-text-subtle)] focus:outline-none focus:border-[var(--lt-accent)] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)]"
            >
              <X size={10} />
            </button>
          )}
        </div>
        <button
          onClick={handleSelectAll}
          title={allSelected ? 'Deselect all folders' : 'Select all folders'}
          className={cn(
            'w-6 h-6 flex items-center justify-center rounded-[6px] transition-colors shrink-0',
            allSelected
              ? 'text-[var(--lt-accent-light)] bg-[var(--lt-accent-muted)] hover:bg-[var(--lt-accent-muted)]/70'
              : 'text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] hover:bg-[var(--lt-card-hover)]'
          )}
        >
          <CheckSquare size={12} />
        </button>
        <button
          onClick={handleRefresh}
          title="Refresh folders"
          className="w-6 h-6 flex items-center justify-center rounded-[6px] text-[var(--lt-text-subtle)] hover:text-[var(--lt-accent)] hover:bg-[var(--lt-card-hover)] transition-colors shrink-0"
        >
          <RefreshCw size={12} />
        </button>

        {/* Delete selected folders — always visible, disabled when nothing selected */}
        {onDeletePaths && (
          <button
            onClick={() => checkedFolders.size > 0 && onDeletePaths([...checkedFolders])}
            disabled={checkedFolders.size === 0}
            title={checkedFolders.size > 0 ? `Delete ${checkedFolders.size} selected folder${checkedFolders.size > 1 ? 's' : ''}` : 'Select folders to delete'}
            className={cn(
              'flex items-center gap-1 h-6 px-1.5 rounded-[6px] transition-colors text-[10px] font-semibold shrink-0',
              checkedFolders.size > 0
                ? 'bg-[var(--lt-danger-bg)] text-[var(--lt-danger-text)] hover:bg-[var(--lt-danger-hover)] cursor-pointer'
                : 'bg-[var(--lt-surface)] border border-[var(--lt-divider)] text-[var(--lt-text-subtle)] cursor-not-allowed'
            )}
          >
            <Trash2 size={10} />
            {checkedFolders.size > 0 && <span>{checkedFolders.size}</span>}
          </button>
        )}
      </div>

      {/* Shimmer bar — shown while right-panel files are loading */}
      <div className="h-[2px] overflow-hidden bg-[var(--lt-surface)] shrink-0">
        {filesLoading && (
          <motion.div
            className="h-full w-2/5 bg-gradient-to-r from-transparent via-[var(--lt-accent)] to-transparent"
            animate={{ x: ['-100%', '350%'] }}
            transition={{ repeat: Infinity, duration: 1.3, ease: 'linear' }}
          />
        )}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1.5 px-1.5 space-y-0.5">
        {sidebarLoading ? (
          <div className="py-2 px-1 space-y-0.5">
            {[28, 20, 36, 16, 24, 32].map((w, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2 py-[5px] rounded-[7px] animate-pulse">
                <div className="w-4 h-4 rounded bg-[var(--lt-divider)] shrink-0" />
                <div className="w-3.5 h-3.5 rounded bg-[var(--lt-divider)] shrink-0" />
                <div className="w-3.5 h-3.5 rounded-[3px] bg-[var(--lt-divider)] shrink-0" />
                <div className={`h-2.5 rounded bg-[var(--lt-divider)]`} style={{ width: `${w * 3}px` }} />
              </div>
            ))}
          </div>
        ) : (
        <RootFoldersList
          rootFolders={filteredRootFolders}
          rootPath={rootPath}
          state={state}
          dragState={dragState}
          newFolderPath={newFolderPath}
          newFolderDefaultName={newFolderDefaultName}
          renamingFolderPath={renamingFolderPath}
          renamingFolderName={renamingFolderName}
          renamingBusy={renamingBusy}
          onExpand={handleExpand}
          onCheck={onFolderCheck}
          onOpen={handleOpen}
          onInlineRename={handleInlineRename}
          onDelete={handleDeleteFolder}
          onNewSub={handleNewSub}
          onNewFolderCreated={handleNewFolderCreated}
          onNewFolderCancel={() => { setNewFolderPath(null); setNewFolderDefaultName('') }}
          onNewRootFolder={handleNewRootFolder}
          onRenameNameChange={setRenamingFolderName}
          onSaveRename={handleSaveRename}
          onCancelRename={handleCancelRename}
          onDragStart={handleDragStart}
          onDragOver={path => setDragOverPath(path)}
          onDragLeave={() => setDragOverPath(null)}
          onDrop={handleDrop}
        />
        )}
      </div>

      {/* Footer: loading indicator / checked count */}
      {(filesLoading || checkedFolders.size > 0) && (
        <div className="px-3 py-2 border-t border-[var(--lt-divider)] flex items-center gap-2">
          {filesLoading ? (
            <>
              <Loader2 size={10} className="animate-spin text-[var(--lt-accent)] shrink-0" />
              <span className="text-[10px] text-[var(--lt-accent)]">Loading files…</span>
            </>
          ) : (
            <p className="text-[10px] text-[var(--lt-text-subtle)]">
              {checkedFolders.size} folder{checkedFolders.size > 1 ? 's' : ''} selected
              {checkedFolders.size > 1 && (
                <span className="text-[#f59e0b] ml-1">· multi-view mode</span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
