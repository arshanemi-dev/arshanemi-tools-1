'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Layers, Settings, Clock, CalendarClock } from 'lucide-react'
import { isLoggedIn } from '@/lib/tokenStore'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useSelectedFiles } from '@/context/SelectedFilesContext'
import ExpiryModal from '@/components/ui/ExpiryModal'
import FilesExpiryManagerModal from '@/components/ui/FilesExpiryManagerModal'

export default function Header() {
  const pathname  = usePathname()
  const [loggedIn,        setLoggedIn]        = useState(false)
  const [showExpiryModal, setShowExpiryModal] = useState(false)   // bulk edit for selected files
  const [showManager,     setShowManager]     = useState(false)   // full expiry manager

  const { selectedFiles } = useSelectedFiles()

  useEffect(() => { setLoggedIn(isLoggedIn()) }, [])

  async function handleBulkSaveExpiry(expiryAt) {
    await fetch('/api/files-expiry', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        items: selectedFiles.map(f => ({ name: f.name, expiryAt })),
      }),
    })
  }

  return (
    <>
      <header className="sticky top-0 z-30 h-14 flex items-center border-b border-[#262626] bg-[#0a0a0a]/90 backdrop-blur-md px-4">
        <div className="flex items-center gap-3 flex-1">
          <Link href="/files" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-[8px] bg-[#1e1b4b] border border-[#4f46e5]/40 flex items-center justify-center">
              <Layers size={16} className="text-[#818cf8]" />
            </div>
            <span className="font-semibold text-[#f5f5f5] text-sm tracking-tight">
              MultiImage<span className="text-[#4f46e5]">Link</span>
            </span>
          </Link>

          <span className="text-[#333333] hidden sm:inline">/</span>
          <span className="text-[#6b7280] text-sm hidden sm:inline">File Manager</span>
        </div>

        <div className="flex items-center gap-2">

          {/* ── Bulk "Edit Expiry" — only when files are selected ── */}
          {selectedFiles.length > 0 && (
            <button
              onClick={() => setShowExpiryModal(true)}
              className="flex items-center gap-1.5 px-3 h-7 text-xs rounded-[8px] bg-[#1e1b4b] border border-[#4f46e5]/40 text-[#818cf8] hover:bg-[#2d2a6e] transition-colors"
            >
              <Clock size={12} />
              Edit Expiry ({selectedFiles.length})
            </button>
          )}
          
          <div className="w-px h-4 bg-[#262626] hidden md:block" />

          <Link
            href="/settings"
            title="Settings"
            className={cn(
              'p-1.5 rounded-[6px] transition-colors',
              pathname?.startsWith('/settings')
                ? 'text-[#818cf8] bg-[#1e1b4b]'
                : 'text-[#6b7280] hover:text-[#f5f5f5] hover:bg-[#1c1c1c]'
            )}
          >
            <Settings size={15} />
          </Link>

          <div className="w-7 h-7 rounded-full bg-[#1e1b4b] border border-[#4f46e5]/30 flex items-center justify-center relative">
            <span className="text-[10px] font-bold text-[#818cf8]">
              {loggedIn ? '✓' : 'A'}
            </span>
            {loggedIn && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#10b981] rounded-full border border-[#0a0a0a]" />
            )}
          </div>
        </div>
      </header>

      {/* Bulk expiry modal for currently selected files */}
      {showExpiryModal && (
        <ExpiryModal
          files={selectedFiles}
          onSave={handleBulkSaveExpiry}
          onClose={() => setShowExpiryModal(false)}
        />
      )}

      {/* Global expiry manager modal */}
      {showManager && (
        <FilesExpiryManagerModal onClose={() => setShowManager(false)} />
      )}
    </>
  )
}
