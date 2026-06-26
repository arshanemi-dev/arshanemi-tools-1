'use client'

import { CheckSquare, FolderPlus, Upload, Grid3X3, List, ArrowUpDown } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'date', label: 'Date' },
  { value: 'size', label: 'Size' },
  { value: 'type', label: 'Type' },
]

export default function Toolbar({
  view,
  sortBy,
  onViewChange,
  onSortChange,
  onSelectAll,
  onNewFolder,
  onUpload,
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Left actions */}
      <Button
        size="sm"
        variant="ghost"
        icon={<CheckSquare size={14} />}
        onClick={onSelectAll}
        title="Select All (Ctrl+A)"
      >
        Select All
      </Button>

      <div className="w-px h-6 bg-[var(--lt-divider)]" />

      <Button
        size="sm"
        variant="ghost"
        icon={<FolderPlus size={14} />}
        onClick={onNewFolder}
        title="New Folder"
      >
        New Folder
      </Button>

      <Button
        size="sm"
        variant="primary"
        icon={<Upload size={14} />}
        onClick={onUpload}
        title="Upload Files"
      >
        Upload
      </Button>

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-1">
        {/* Sort dropdown */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 h-8 text-sm rounded-[8px] bg-[var(--lt-card-hover)] border border-[var(--lt-divider-light)] text-[var(--lt-text-muted)] hover:text-[var(--lt-text-primary)] hover:border-[var(--lt-accent)] transition-all cursor-pointer">
            <ArrowUpDown size={13} />
            <span>{SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? 'Sort'}</span>
          </button>
          <div className="absolute right-0 top-full mt-1 py-1 w-36 bg-[var(--lt-card)] border border-[var(--lt-divider-light)] rounded-[8px] shadow-xl z-30 hidden group-hover:block">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onSortChange(opt.value)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm transition-colors',
                  sortBy === opt.value
                    ? 'text-[var(--lt-accent-light)] bg-[var(--lt-accent-muted)]'
                    : 'text-[var(--lt-text-muted)] hover:text-[var(--lt-text-primary)] hover:bg-[var(--lt-card-hover)]'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-[var(--lt-card-hover)] border border-[var(--lt-divider-light)] rounded-[8px] p-0.5">
          <button
            onClick={() => onViewChange('grid')}
            className={cn(
              'p-1.5 rounded-[6px] transition-all',
              view === 'grid'
                ? 'bg-[var(--lt-accent)] text-white'
                : 'text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)]'
            )}
            title="Grid view"
          >
            <Grid3X3 size={14} />
          </button>
          <button
            onClick={() => onViewChange('list')}
            className={cn(
              'p-1.5 rounded-[6px] transition-all',
              view === 'list'
                ? 'bg-[var(--lt-accent)] text-white'
                : 'text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)]'
            )}
            title="List view"
          >
            <List size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
