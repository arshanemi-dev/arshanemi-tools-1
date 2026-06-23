'use client'

import Link from 'next/link'
import { Layers, Github } from 'lucide-react'

export default function Header() {
  return (
    <header className="sticky top-0 z-30 h-14 flex items-center border-b border-[#262626] bg-[#0a0a0a]/90 backdrop-blur-md px-4">
      <div className="flex items-center gap-3 flex-1">
        {/* Logo */}
        <Link href="/files" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-[8px] bg-[#1e1b4b] border border-[#4f46e5]/40 flex items-center justify-center">
            <Layers size={16} className="text-[#818cf8]" />
          </div>
          <span className="font-semibold text-[#f5f5f5] text-sm tracking-tight">
            MultiImage<span className="text-[#4f46e5]">Link</span>
          </span>
        </Link>

        {/* Breadcrumb separator */}
        <span className="text-[#333333] hidden sm:inline">/</span>
        <span className="text-[#6b7280] text-sm hidden sm:inline">File Manager</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <a
          href="https://www.dropbox.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#6b7280] hover:text-[#818cf8] transition-colors hidden md:block"
        >
          Dropbox ↗
        </a>
        <div className="w-px h-4 bg-[#262626] hidden md:block" />
        <div className="w-7 h-7 rounded-full bg-[#1e1b4b] border border-[#4f46e5]/30 flex items-center justify-center">
          <span className="text-[10px] font-bold text-[#818cf8]">A</span>
        </div>
      </div>
    </header>
  )
}
