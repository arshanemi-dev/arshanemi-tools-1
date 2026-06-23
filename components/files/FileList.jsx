'use client'

import FileItem from './FileItem'

export default function FileList({
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
        <p className="text-[#a3a3a3] text-sm">This folder is empty</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-1.5 text-xs text-[#6b7280] border-b border-[#262626] mb-1">
        <div className="w-8 shrink-0" />
        <span className="flex-1">Name</span>
        <span className="hidden sm:block text-right">Source</span>
        <span className="hidden sm:block w-24 text-right">Modified</span>
        <span className="w-16 text-right">Size</span>
      </div>

      {allItems.map(item => (
        <FileItem
          key={item.id ?? item.path}
          item={item}
          view="list"
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
