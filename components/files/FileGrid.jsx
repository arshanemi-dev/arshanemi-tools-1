'use client'

import FileItem from './FileItem'

export default function FileGrid({
  folders = [],
  files = [],
  selectedItems,
  selectionOrder,
  cutPaths,
  onSelect,
  onNavigate,
  onContextMenu,
  sortBy,
}) {
  const sortedFolders = [...folders].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    return 0
  })

  const sortedFiles = [...files].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'size') return (b.size ?? 0) - (a.size ?? 0)
    if (sortBy === 'date') return new Date(b.modified ?? 0) - new Date(a.modified ?? 0)
    if (sortBy === 'type') return a.name.split('.').pop().localeCompare(b.name.split('.').pop())
    return 0
  })

  const allItems = [...sortedFolders, ...sortedFiles]

  if (allItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--lt-card)] border border-[var(--lt-divider)] flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke='var(--lt-text-subtle)' strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <p className="text-[var(--lt-text-muted)] text-sm">This folder is empty</p>
        <p className="text-[var(--lt-text-subtle)] text-xs mt-1">Upload files or create a folder to get started</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
      {allItems.map(item => (
        <FileItem
          key={item.id ?? item.path}
          item={item}
          view="grid"
          isSelected={selectedItems.has(item.path)}
          isCut={cutPaths?.has(item.path)}
          selectionIndex={selectionOrder?.get(item.path)}
          onSelect={(e) => onSelect(item, e)}
          onDoubleClick={() => item.tag === 'folder' ? onNavigate(item.path) : null}
          onContextMenu={(e) => onContextMenu(e, item)}
        />
      ))}
    </div>
  )
}
