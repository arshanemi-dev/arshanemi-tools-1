'use client'

import { ChevronRight, Home } from 'lucide-react'

export default function Breadcrumb({ path, onNavigate }) {
  const segments = path ? path.split('/').filter(Boolean) : []

  const handleClick = (index) => {
    if (index === -1) {
      onNavigate('')
    } else {
      onNavigate('/' + segments.slice(0, index + 1).join('/'))
    }
  }

  return (
    <nav className="flex items-center gap-1 text-sm min-w-0 flex-1">
      <button
        onClick={() => handleClick(-1)}
        className="flex items-center gap-1 text-[#a3a3a3] hover:text-[#f5f5f5] transition-colors shrink-0 p-1 rounded hover:bg-[#1c1c1c]"
        aria-label="Root"
      >
        <Home size={14} />
      </button>

      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-1 min-w-0">
          <ChevronRight size={14} className="text-[#6b7280] shrink-0" />
          {i === segments.length - 1 ? (
            <span className="text-[#f5f5f5] font-medium truncate max-w-[180px]">{seg}</span>
          ) : (
            <button
              onClick={() => handleClick(i)}
              className="text-[#a3a3a3] hover:text-[#f5f5f5] truncate max-w-[120px] transition-colors p-1 rounded hover:bg-[#1c1c1c]"
            >
              {seg}
            </button>
          )}
        </span>
      ))}
    </nav>
  )
}
