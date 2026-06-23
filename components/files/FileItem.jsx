'use client'

import {
  Folder, FileText, FileImage, FileVideo, FileAudio,
  File, Archive, Code, FileSpreadsheet, FileType2,
} from 'lucide-react'
import { cn, formatBytes, getFileType, isImage } from '@/lib/utils'

const TYPE_ICONS = {
  image:        FileImage,
  video:        FileVideo,
  audio:        FileAudio,
  pdf:          FileText,
  doc:          FileText,
  spreadsheet:  FileSpreadsheet,
  presentation: FileType2,
  archive:      Archive,
  code:         Code,
  text:         FileText,
  file:         File,
}

function FileTypeIcon({ name, size = 20, className }) {
  const type = getFileType(name)
  const Icon = TYPE_ICONS[type] ?? File
  const colorMap = {
    image: 'text-[#818cf8]', video: 'text-[#f59e0b]', audio: 'text-[#10b981]',
    pdf: 'text-[#ef4444]', doc: 'text-[#3b82f6]', spreadsheet: 'text-[#10b981]',
    presentation: 'text-[#f97316]', archive: 'text-[#a3a3a3]', code: 'text-[#06b6d4]',
  }
  return <Icon size={size} className={cn(colorMap[type] ?? 'text-[#6b7280]', className)} />
}

export default function FileItem({
  item,
  isSelected,
  isCut,
  view = 'grid',
  onSelect,
  onDoubleClick,
  onContextMenu,
}) {
  const isFolder = item.tag === 'folder'

  if (view === 'list') {
    return (
      <div
        onClick={onSelect}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-[8px] cursor-pointer select-none',
          'border transition-all duration-100 group',
          isSelected
            ? 'bg-[#1e1b4b] border-[#4f46e5]/60'
            : 'bg-transparent border-transparent hover:bg-[#1c1c1c] hover:border-[#333333]',
          isCut && 'opacity-50'
        )}
      >
        {/* Thumbnail / icon */}
        <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-[6px] bg-[#161616]">
          {isFolder ? (
            <Folder size={18} className="text-[#4f46e5]" fill="rgba(79,70,229,0.2)" />
          ) : isImage(item.name) ? (
            <img
              src={`/api/thumbnail?path=${encodeURIComponent(item.path)}`}
              alt={item.name}
              className="w-8 h-8 object-cover rounded-[6px]"
              loading="lazy"
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
          ) : (
            <FileTypeIcon name={item.name} size={16} />
          )}
        </div>

        {/* Name */}
        <span className="flex-1 text-sm text-[#f5f5f5] truncate">{item.name}</span>

        {/* Meta */}
        <div className="flex items-center gap-4 shrink-0">
          {item.modified && (
            <span className="text-xs text-[#6b7280] hidden sm:block">
              {new Date(item.modified).toLocaleDateString()}
            </span>
          )}
          {item.size != null && (
            <span className="text-xs text-[#6b7280] w-16 text-right">{formatBytes(item.size)}</span>
          )}
          {isFolder && (
            <span className="text-xs text-[#6b7280] w-16 text-right">Folder</span>
          )}
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      className={cn(
        'relative flex flex-col items-center gap-2 p-3 rounded-[10px] cursor-pointer select-none',
        'border transition-all duration-100 group',
        isSelected
          ? 'bg-[#1e1b4b] border-[#4f46e5]/70'
          : 'bg-[#161616] border-[#262626] hover:bg-[#1c1c1c] hover:border-[#333333]',
        isCut && 'opacity-50'
      )}
    >
      {/* Selected dot */}
      {isSelected && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#4f46e5]" />
      )}

      {/* Thumbnail / icon area */}
      <div className="w-full aspect-square rounded-[8px] flex items-center justify-center overflow-hidden bg-[#111111]">
        {isFolder ? (
          <Folder size={40} className="text-[#4f46e5]" fill="rgba(79,70,229,0.18)" />
        ) : isImage(item.name) ? (
          <img
            src={`/api/thumbnail?path=${encodeURIComponent(item.path)}`}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={e => {
              e.currentTarget.parentElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`
            }}
          />
        ) : (
          <FileTypeIcon name={item.name} size={36} />
        )}
      </div>

      {/* Name */}
      <span className="text-xs text-[#f5f5f5] text-center truncate w-full leading-tight">
        {item.name.length > 22 ? item.name.slice(0, 20) + '…' : item.name}
      </span>

      {/* Size or type badge */}
      {item.size != null ? (
        <span className="text-[10px] text-[#6b7280]">{formatBytes(item.size)}</span>
      ) : isFolder ? (
        <span className="text-[10px] text-[#4f46e5]">Folder</span>
      ) : null}
    </div>
  )
}
