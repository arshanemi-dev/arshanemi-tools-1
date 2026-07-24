'use client'
// FolderTree — last updated 2026-07-23
// Browse-only: expand/collapse, checkbox multi-view, search, select-all,
// refresh, delete. Create/rename/drag-move removed — not part of the
// catalog's billed feature set (see data/tools.js's link-generator entry).

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Folder, FolderOpen, ChevronRight, ChevronDown,
  Trash2, Loader2, X, Search, RefreshCw, CheckSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

/* ─── Single Folder Row ────────────────────────────────────────────── */
function FolderRow({
  folder, level,
  isChecked, isExpanded, isActive, isLoading,
  isFilesLoading,
  onCheck, onExpand, onOpen, onDelete,
}) {
  return (
    <div
      className={cn(
        'group/row flex items-center gap-1.5 pr-2 py-[5px] rounded-[7px] cursor-pointer select-none',
        'transition-all duration-100 relative',
        isActive  && 'bg-[var(--lt-accent-muted)]',
        !isActive && 'hover:bg-[var(--lt-card-hover)]',
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

      {/* Hover action: Trash (delete) */}
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
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
  folder, level, state,
  onExpand, onCheck, onOpen, onDelete,
}) {
  const isExpanded     = state.expanded.has(folder.path)
  const isChecked      = state.checked.has(folder.path)
  const isActive       = state.active === folder.path
  const isLoading       = state.loadingPaths.has(folder.path)
  const isFilesLoading  = state.filesLoading && isActive   // right-panel files are loading for active folder
  const children        = state.subfolderMap.get(folder.path) ?? []

  return (
    <div>
      <FolderRow
        folder={folder} level={level}
        isChecked={isChecked} isExpanded={isExpanded}
        isActive={isActive} isLoading={isLoading}
        isFilesLoading={isFilesLoading}
        onCheck={onCheck} onExpand={onExpand} onOpen={onOpen}
        onDelete={onDelete}
      />

      <AnimatePresence>
        {isExpanded && children.length > 0 && (
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
                state={state}
                onExpand={onExpand} onCheck={onCheck} onOpen={onOpen} onDelete={onDelete}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Root Folders List ───────────────────────────────────────────── */
function RootFoldersList({
  rootFolders, state,
  onExpand, onCheck, onOpen, onDelete,
}) {
  if (rootFolders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-5 text-center">
        <div className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-[var(--lt-accent-muted)] to-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/20 flex items-center justify-center mb-3 shadow-lg shadow-[var(--lt-accent)]/10">
          <Folder size={26} className="text-[var(--lt-accent)]" fill="rgba(79,70,229,0.2)" />
        </div>
        <p className="text-xs font-semibold text-[var(--lt-text-muted)] mb-1">No folders yet</p>
        <p className="text-[10px] text-[var(--lt-text-subtle)] leading-relaxed">
          Nothing here yet
        </p>
      </div>
    )
  }

  return (
    <>
      {rootFolders.map(folder => (
        <TreeNode
          key={folder.path}
          folder={folder} level={0}
          state={state}
          onExpand={onExpand} onCheck={onCheck} onOpen={onOpen} onDelete={onDelete}
        />
      ))}
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
  onDelete,
  onDeletePaths,
  refetchRoot,
}) {
  const [expanded,     setExpanded]     = useState(new Set())
  const [loadingPaths, setLoadingPaths] = useState(new Set())
  const [subfolderMap, setSubfolderMap] = useState(new Map())
  const [search,       setSearch]       = useState('')

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

  const state = { expanded, checked: checkedFolders, active: activeFolderPath, loadingPaths, subfolderMap, filesLoading }

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
            state={state}
            onExpand={handleExpand}
            onCheck={onFolderCheck}
            onOpen={handleOpen}
            onDelete={handleDeleteFolder}
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
