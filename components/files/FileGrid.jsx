'use client'

import FileItem from './FileItem'
import { cn } from '@/lib/utils'

export default function FileGrid({
  folders = [],
  files = [],
  selectedItems,
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
    if (sortBy === 'name')  return a.name.localeCompare(b.name)
    if (sortBy === 'size')  return (b.size ?? 0) - (a.size ?? 0)
    if (sortBy === 'date')  return new Date(b.modified ?? 0) - new Date(a.modified ?? 0)
    if (sortBy === 'type')  return a.name.split('.').pop().localeCompare(b.name.split('.').pop())
    return 0
  })

  const allItems = [...sortedFolders, ...sortedFiles]

  if (allItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-[#161616] border border-[#262626] flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="#6b7280" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7l9 6 9-6"/></svg>
        </div>
        <p className="text-[#a3a3a3] text-sm">This folder is empty</p>
        <p className="text-[#6b7280] text-xs mt-1">Upload files or create a folder to get started</p>
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
          onSelect={(e) => onSelect(item, e)}
          onDoubleClick={() => item.tag === 'folder' ? onNavigate(item.path) : null}
          onContextMenu={(e) => onContextMenu(e, item)}
        />
      ))}
    </div>
  )
}
