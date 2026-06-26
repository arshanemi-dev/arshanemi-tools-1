'use client'
// CopyUrlsModal — last updated 2026-06-24
// T10: Copy Excel + Copy List buttons show loading spinners while processing

import { useState, useEffect } from 'react'
import { Table2, Braces, List, Check, Pencil, Loader2 } from 'lucide-react'
import Modal   from '@/components/ui/Modal'
import Button  from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { cn }  from '@/lib/utils'

const GROUP_SIZES  = [2, 3, 4, 5]
const SORT_OPTIONS = [
  { value: 'selection', label: 'Selection ↑' },
  { value: 'name-asc',  label: 'Name ↑' },
  { value: 'name-desc', label: 'Name ↓' },
  { value: 'date',      label: 'Date' },
]

/* ─── Editable group column name ─────────────────────────────────── */
function GroupNameEditor({ index, name, onChange }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(name)

  function confirm() {
    onChange(index, draft.trim() || `Group ${index + 1}`)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={confirm}
          onKeyDown={e => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') setEditing(false) }}
          className="w-24 px-1.5 py-0.5 text-xs bg-[var(--lt-bg-base)] border border-[var(--lt-accent)] rounded text-[var(--lt-text-primary)] focus:outline-none"
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => { setDraft(name); setEditing(true) }}
      className="flex items-center gap-1 group/name"
    >
      <span className="text-xs font-semibold text-[var(--lt-accent-light)]">{name}</span>
      <Pencil size={10} className="text-[var(--lt-text-subtle)] opacity-0 group-hover/name:opacity-100 transition-opacity" />
    </button>
  )
}

/* ─── CopyUrlsModal ──────────────────────────────────────────────── */
export default function CopyUrlsModal({ open, onClose, items = [], selectionOrder, toast }) {
  const [groupSize,  setGroupSize]  = useState(3)
  const [sortBy,     setSortBy]     = useState('selection')
  const [groupNames, setGroupNames] = useState({})
  const [result,     setResult]     = useState(null)
  const [loading,    setLoading]    = useState(false)

  // Per-button copy loading state (Task 10)
  const [copying, setCopying] = useState(null) // null | 'excel' | 'json' | 'list'

  // Sort items by selection order
  const sortedItems = (() => {
    const arr = [...items]
    if (sortBy === 'selection' && selectionOrder?.size) {
      arr.sort((a, b) => {
        const ia = selectionOrder.get(a.url ?? a) ?? Infinity
        const ib = selectionOrder.get(b.url ?? b) ?? Infinity
        return ia - ib
      })
    }
    return arr
  })()

  const urls = sortedItems.map(i => i.url ?? i)

  const getGroupName = (index) => groupNames[index] ?? `Group ${index + 1}`
  const setGroupName = (index, name) => setGroupNames(prev => ({ ...prev, [index]: name }))

  useEffect(() => {
    if (!open || !urls.length) return
    setLoading(true)
    fetch('/api/urls', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ items: urls, groupSize, sortBy }),
    })
      .then(r => r.json())
      .then(data => setResult(data))
      .catch(e => toast?.(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [open, groupSize, sortBy, urls.length])

  useEffect(() => { setGroupNames({}) }, [groupSize])

  async function copyText(text, key) {
    setCopying(key)
    try {
      await navigator.clipboard.writeText(text)
      await new Promise(r => setTimeout(r, 400)) // brief visible loader
      toast?.('Copied!', 'success')
    } catch {
      toast?.('Copy failed', 'error')
    } finally {
      setCopying(null)
    }
  }

  const groups = result?.groups ?? []

  function buildNamedTsv() {
    if (!groups.length) return ''
    const header = Array.from({ length: groupSize }).map((_, i) => getGroupName(i)).join('\t')
    const rows   = groups.map(row =>
      Array.from({ length: groupSize }).map((_, ci) => row[ci] ?? '').join('\t')
    )
    return [header, ...rows].join('\n')
  }

  return (
    <Modal open={open} onClose={onClose} title="Copy URLs" size="3xl">
      <div className="flex flex-col gap-5">

        {/* Selection count (Task 10) */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--lt-surface)] rounded-[8px] border border-[var(--lt-divider)]">
          <span className="text-[11px] text-[var(--lt-text-subtle)]">Selected:</span>
          <span className="text-sm font-bold text-[var(--lt-accent-light)]">{urls.length}</span>
          <span className="text-[11px] text-[var(--lt-text-subtle)]">file{urls.length !== 1 ? 's' : ''}</span>
          {result && (
            <>
              <span className="text-[var(--lt-divider-light)]">·</span>
              <span className="text-[11px] text-[var(--lt-text-subtle)]">{result.groupCount} group{result.groupCount !== 1 ? 's' : ''}</span>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Group size */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--lt-text-subtle)] shrink-0">Group by:</span>
            <div className="flex gap-1">
              {GROUP_SIZES.map(n => (
                <button
                  key={n}
                  onClick={() => setGroupSize(n)}
                  className={cn(
                    'w-8 h-7 rounded-[6px] text-sm font-medium transition-all',
                    groupSize === n
                      ? 'bg-[var(--lt-accent)] text-white'
                      : 'bg-[var(--lt-card-hover)] text-[var(--lt-text-muted)] hover:text-[var(--lt-text-primary)] border border-[var(--lt-divider-light)]'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--lt-text-subtle)] shrink-0">Sort by:</span>
            <div className="flex gap-1 flex-wrap">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={cn(
                    'px-2.5 h-7 rounded-[6px] text-xs font-medium transition-all whitespace-nowrap',
                    sortBy === opt.value
                      ? 'bg-[var(--lt-accent)] text-white'
                      : 'bg-[var(--lt-card-hover)] text-[var(--lt-text-muted)] hover:text-[var(--lt-text-primary)] border border-[var(--lt-divider-light)]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Column name legend */}
        {groups.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[var(--lt-text-subtle)]">Column names (click to rename):</span>
            {Array.from({ length: groupSize }).map((_, i) => (
              <GroupNameEditor key={i} index={i} name={getGroupName(i)} onChange={setGroupName} />
            ))}
          </div>
        )}

        {/* Preview table */}
        <div className="overflow-x-auto rounded-[8px] border border-[var(--lt-divider)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : groups.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--lt-text-subtle)]">No items</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--lt-surface)] border-b border-[var(--lt-divider)]">
                  <th className="px-3 py-2 text-left text-[var(--lt-text-subtle)] w-8">#</th>
                  {Array.from({ length: groupSize }).map((_, i) => (
                    <th key={i} className="px-3 py-2 text-left">
                      <span className="text-[var(--lt-accent-light)] font-semibold">{getGroupName(i)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((row, ri) => (
                  <tr key={ri} className="border-b border-[var(--lt-divider)] last:border-0 hover:bg-[var(--lt-card-hover)]/50 transition-colors">
                    <td className="px-3 py-2 text-[var(--lt-text-subtle)] font-mono font-semibold">{ri + 1}</td>
                    {Array.from({ length: groupSize }).map((_, ci) => {
                      const url = row[ci]
                      return (
                        <td key={ci} className="px-3 py-2">
                          {url ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={`/api/thumbnail?path=${encodeURIComponent(
                                  (() => { try { return new URL(url).pathname } catch { return url } })()
                                )}`}
                                alt=""
                                className="w-8 h-8 object-cover rounded-[4px] bg-[var(--lt-card-hover)] shrink-0"
                                loading="lazy"
                                onError={e => { e.currentTarget.style.display = 'none' }}
                              />
                              <span className="text-[var(--lt-text-muted)] truncate max-w-[120px]">
                                {url.split('/').pop()?.split('?')[0]}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[var(--lt-divider-light)]">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Action buttons — with loading spinners (Task 10) */}
        <div className="flex gap-2 flex-wrap items-center">

          {/* Copy Excel */}
          <button
            onClick={() => copyText(buildNamedTsv(), 'excel')}
            disabled={!result || loading || copying === 'excel'}
            className={cn(
              'flex items-center gap-2 px-4 h-9 rounded-[8px] text-xs font-semibold border transition-all',
              copying === 'excel'
                ? 'bg-[#064e3b] border-[#10b981]/40 text-[#10b981]'
                : 'bg-[var(--lt-surface)] border-[var(--lt-divider-light)] text-[var(--lt-text-muted)] hover:border-[var(--lt-accent)] hover:text-[var(--lt-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            {copying === 'excel'
              ? <Loader2 size={13} className="animate-spin" />
              : <Table2 size={13} />}
            {copying === 'excel' ? 'Copying…' : 'Copy Excel'}
          </button>

          {/* Copy List */}
          <button
            onClick={() => copyText(urls.join('\n'), 'list')}
            disabled={!urls.length || loading || copying === 'list'}
            className={cn(
              'flex items-center gap-2 px-4 h-9 rounded-[8px] text-xs font-semibold border transition-all',
              copying === 'list'
                ? 'bg-[#064e3b] border-[#10b981]/40 text-[#10b981]'
                : 'bg-[var(--lt-surface)] border-[var(--lt-divider-light)] text-[var(--lt-text-muted)] hover:border-[var(--lt-accent)] hover:text-[var(--lt-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            {copying === 'list'
              ? <Loader2 size={13} className="animate-spin" />
              : <List size={13} />}
            {copying === 'list' ? 'Copying…' : 'Copy List'}
          </button>

          {/* Copy JSON */}
          <button
            onClick={() => result?.json && copyText(result.json, 'json')}
            disabled={!result || loading || copying === 'json'}
            className={cn(
              'flex items-center gap-2 px-4 h-9 rounded-[8px] text-xs font-semibold border transition-all',
              copying === 'json'
                ? 'bg-[#064e3b] border-[#10b981]/40 text-[#10b981]'
                : 'bg-[var(--lt-surface)] border-[var(--lt-divider-light)] text-[var(--lt-text-muted)] hover:border-[var(--lt-accent-light)] hover:text-[var(--lt-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            {copying === 'json'
              ? <Loader2 size={13} className="animate-spin" />
              : <Braces size={13} />}
            {copying === 'json' ? 'Copying…' : 'Copy JSON'}
          </button>

          <button
            onClick={onClose}
            className="ml-auto px-4 h-9 rounded-[8px] text-xs text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] hover:bg-[var(--lt-card-hover)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
