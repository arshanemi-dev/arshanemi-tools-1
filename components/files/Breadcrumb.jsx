'use client'

import { ChevronRight, Home, FolderLock } from 'lucide-react'

export default function Breadcrumb({ path, rootPath = '', onNavigate }) {
  // Show path relative to rootPath so non-admin users see a clean breadcrumb
  const base     = rootPath || ''
  const relative = base && path.startsWith(base) ? path.slice(base.length) : path
  const segments = relative ? relative.split('/').filter(Boolean) : []

  const handleClick = (index) => {
    if (index === -1) {
      onNavigate(base || '')
    } else {
      onNavigate(base + '/' + segments.slice(0, index + 1).join('/'))
    }
  }

  return (
    <nav className="flex items-center gap-1 text-sm min-w-0 flex-1">
      <button
        onClick={() => handleClick(-1)}
        title={base ? `Root: ${base}` : 'Root'}
        className="flex items-center gap-1.5 text-[#a3a3a3] hover:text-[#f5f5f5] transition-colors shrink-0 p-1.5 rounded-[6px] hover:bg-[#1c1c1c]"
        aria-label="Root"
      >
        {base ? <FolderLock size={14} className="text-[#818cf8]" /> : <Home size={14} />}
      </button>

      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-1 min-w-0">
          <ChevronRight size={13} className="text-[#3a3a3a] shrink-0" />
          {i === segments.length - 1 ? (
            <span className="text-[#f5f5f5] font-semibold truncate max-w-[180px]">{seg}</span>
          ) : (
            <button
              onClick={() => handleClick(i)}
              className="text-[#6b7280] hover:text-[#f5f5f5] truncate max-w-[120px] transition-colors p-1 rounded-[4px] hover:bg-[#1c1c1c]"
            >
              {seg}
            </button>
          )}
        </span>
      ))}
    </nav>
  )
}
