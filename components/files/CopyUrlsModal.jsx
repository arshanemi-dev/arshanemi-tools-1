'use client'

import { useState, useEffect } from 'react'
import { Copy, Table2, Braces, List, Check, Pencil, X } from 'lucide-react'
import Modal  from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'

const GROUP_SIZES = [2, 3, 4, 5]
const SORT_OPTIONS = [
  { value: 'selection', label: 'Selection ↑' },
  { value: 'name-asc',  label: 'Name ↑' },
  { value: 'name-desc', label: 'Name ↓' },
  { value: 'date',      label: 'Date' },
]

function useCopied(timeout = 1800) {
  const [copied, setCopied] = useState(null)
  const trigger = (key) => {
    setCopied(key)
    setTimeout(() => setCopied(null), timeout)
  }
  return [copied, trigger]
}

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
          className="w-24 px-1.5 py-0.5 text-xs bg-[#0a0a0a] border border-[#4f46e5] rounded text-[#f5f5f5] focus:outline-none"
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => { setDraft(name); setEditing(true) }}
      className="flex items-center gap-1 group/name"
    >
      <span className="text-xs font-semibold text-[#818cf8]">{name}</span>
      <Pencil size={10} className="text-[#6b7280] opacity-0 group-hover/name:opacity-100 transition-opacity" />
    </button>
  )
}

export default function CopyUrlsModal({ open, onClose, items = [], selectionOrder, toast }) {
  const [groupSize,   setGroupSize]   = useState(3)
  const [sortBy,      setSortBy]      = useState('selection')
  const [groupNames,  setGroupNames]  = useState({})
  const [result,      setResult]      = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [copied,      triggerCopied]  = useCopied()

  // Sort items by selection order when sortBy === 'selection'
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

  // Default group names: "Group 1", "Group 2", …
  const getGroupName = (index) => groupNames[index] ?? `Group ${index + 1}`

  const setGroupName = (index, name) => {
    setGroupNames(prev => ({ ...prev, [index]: name }))
  }

  useEffect(() => {
    if (!open || !urls.length) return
    setLoading(true)
    fetch('/api/urls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: urls, groupSize, sortBy }),
    })
      .then(r => r.json())
      .then(data => setResult(data))
      .catch(e => toast?.(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [open, groupSize, sortBy, urls.length])

  // Reset group names when group size changes
  useEffect(() => { setGroupNames({}) }, [groupSize])

  async function copyText(text, key) {
    try {
      await navigator.clipboard.writeText(text)
      triggerCopied(key)
      toast?.('Copied!', 'success')
    } catch {
      toast?.('Copy failed', 'error')
    }
  }

  // Build groups array with custom names
  const groups = result?.groups ?? []

  // Build named TSV (group names as headers)
  function buildNamedTsv() {
    if (!groups.length) return ''
    const header = Array.from({ length: groupSize }).map((_, i) => getGroupName(i)).join('\t')
    const rows = groups.map(row =>
      Array.from({ length: groupSize }).map((_, ci) => row[ci] ?? '').join('\t')
    )
    return [header, ...rows].join('\n')
  }

  return (
    <Modal open={open} onClose={onClose} title="Copy URLs" size="3xl">
      <div className="flex flex-col gap-5">

        {/* Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Group size */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6b7280] shrink-0">Group by:</span>
            <div className="flex gap-1">
              {GROUP_SIZES.map(n => (
                <button
                  key={n}
                  onClick={() => setGroupSize(n)}
                  className={cn(
                    'w-8 h-7 rounded-[6px] text-sm font-medium transition-all',
                    groupSize === n
                      ? 'bg-[#4f46e5] text-white'
                      : 'bg-[#1c1c1c] text-[#a3a3a3] hover:text-[#f5f5f5] border border-[#333333]'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6b7280] shrink-0">Sort by:</span>
            <div className="flex gap-1 flex-wrap">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={cn(
                    'px-2.5 h-7 rounded-[6px] text-xs font-medium transition-all whitespace-nowrap',
                    sortBy === opt.value
                      ? 'bg-[#4f46e5] text-white'
                      : 'bg-[#1c1c1c] text-[#a3a3a3] hover:text-[#f5f5f5] border border-[#333333]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Counter */}
          <div className="ml-auto text-xs text-[#6b7280]">
            {result
              ? `${result.total} file${result.total !== 1 ? 's' : ''} · ${result.groupCount} group${result.groupCount !== 1 ? 's' : ''}`
              : `${urls.length} file${urls.length !== 1 ? 's' : ''}`}
          </div>
        </div>

        {/* Group name legend */}
        {groups.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#6b7280]">Column names (click to rename):</span>
            {Array.from({ length: groupSize }).map((_, i) => (
              <GroupNameEditor
                key={i}
                index={i}
                name={getGroupName(i)}
                onChange={setGroupName}
              />
            ))}
          </div>
        )}

        {/* Preview table */}
        <div className="overflow-x-auto rounded-[8px] border border-[#262626]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : groups.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#6b7280]">No items</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#111111] border-b border-[#262626]">
                  <th className="px-3 py-2 text-left text-[#6b7280] w-8">#</th>
                  {Array.from({ length: groupSize }).map((_, i) => (
                    <th key={i} className="px-3 py-2 text-left">
                      <span className="text-[#818cf8] font-semibold">{getGroupName(i)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((row, ri) => (
                  <tr key={ri} className="border-b border-[#262626] last:border-0 hover:bg-[#1c1c1c]/50 transition-colors">
                    <td className="px-3 py-2 text-[#6b7280] font-mono font-semibold">{ri + 1}</td>
                    {Array.from({ length: groupSize }).map((_, ci) => {
                      const url = row[ci]
                      // find selection index for this url
                      const selIdx = selectionOrder
                        ? [...(selectionOrder.entries() ?? [])].find(([k]) => {
                            const item = items.find(i => (i.url ?? i) === url)
                            return item && (item.url ?? item) === (items.find(ii => selectionOrder.get(ii.url ?? ii) !== undefined)?.url)
                          })
                        : null

                      return (
                        <td key={ci} className="px-3 py-2">
                          {url ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={`/api/thumbnail?path=${encodeURIComponent(
                                  (() => { try { return new URL(url).pathname } catch { return url } })()
                                )}`}
                                alt=""
                                className="w-8 h-8 object-cover rounded-[4px] bg-[#1c1c1c] shrink-0"
                                loading="lazy"
                                onError={e => { e.currentTarget.style.display = 'none' }}
                              />
                              <span className="text-[#a3a3a3] truncate max-w-[120px]">
                                {url.split('/').pop()?.split('?')[0]}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#333333]">—</span>
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

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="secondary"
            icon={copied === 'tsv' ? <Check size={13} /> : <Table2 size={13} />}
            onClick={() => copyText(buildNamedTsv(), 'tsv')}
            disabled={!result || loading}
            className={copied === 'tsv' ? 'border-[#10b981]/50 text-[#10b981]' : ''}
          >
            {copied === 'tsv' ? 'Copied!' : 'Copy for Excel (named)'}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            icon={copied === 'json' ? <Check size={13} /> : <Braces size={13} />}
            onClick={() => result?.json && copyText(result.json, 'json')}
            disabled={!result || loading}
            className={copied === 'json' ? 'border-[#10b981]/50 text-[#10b981]' : ''}
          >
            {copied === 'json' ? 'Copied!' : 'Copy as JSON'}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            icon={copied === 'list' ? <Check size={13} /> : <List size={13} />}
            onClick={() => copyText(urls.join('\n'), 'list')}
            disabled={!urls.length || loading}
            className={copied === 'list' ? 'border-[#10b981]/50 text-[#10b981]' : ''}
          >
            {copied === 'list' ? 'Copied!' : 'Copy plain list'}
          </Button>

          <Button size="sm" variant="ghost" className="ml-auto" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
