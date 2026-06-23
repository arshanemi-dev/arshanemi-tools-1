'use client'

import { useState, useEffect } from 'react'
import { Copy, Table2, Braces, List, Check } from 'lucide-react'
import Modal  from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'

const GROUP_SIZES = [2, 3, 4, 5]
const SORT_OPTIONS = [
  { value: 'name-asc',  label: 'Name ↑' },
  { value: 'name-desc', label: 'Name ↓' },
  { value: 'date',      label: 'Date' },
  { value: 'count',     label: 'Count' },
]

function useCopied(timeout = 1800) {
  const [copied, setCopied] = useState(null)
  const trigger = (key) => {
    setCopied(key)
    setTimeout(() => setCopied(null), timeout)
  }
  return [copied, trigger]
}

export default function CopyUrlsModal({ open, onClose, items = [], toast }) {
  const [groupSize, setGroupSize] = useState(3)
  const [sortBy, setSortBy]       = useState('name-asc')
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [copied, triggerCopied]   = useCopied()

  const urls = items.map(i => i.url ?? i)

  // Fetch grouped result from API
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

  async function copyText(text, key) {
    try {
      await navigator.clipboard.writeText(text)
      triggerCopied(key)
      toast?.('Copied!', 'success')
    } catch {
      toast?.('Copy failed', 'error')
    }
  }

  const groups = result?.groups ?? []

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
              ? `${result.total} image${result.total !== 1 ? 's' : ''} · ${result.groupCount} group${result.groupCount !== 1 ? 's' : ''} of ${groupSize}`
              : `${urls.length} image${urls.length !== 1 ? 's' : ''}`}
          </div>
        </div>

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
                    <th key={i} className="px-3 py-2 text-left text-[#6b7280]">Col {i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((row, ri) => (
                  <tr key={ri} className="border-b border-[#262626] last:border-0 hover:bg-[#1c1c1c]/50 transition-colors">
                    <td className="px-3 py-2 text-[#6b7280] font-mono">{ri + 1}</td>
                    {Array.from({ length: groupSize }).map((_, ci) => {
                      const url = row[ci]
                      return (
                        <td key={ci} className="px-3 py-2">
                          {url ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={`/api/thumbnail?path=${encodeURIComponent(
                                  new URL(url).pathname
                                )}`}
                                alt=""
                                className="w-8 h-8 object-cover rounded-[4px] bg-[#1c1c1c]"
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
            onClick={() => result?.tsv && copyText(result.tsv, 'tsv')}
            disabled={!result || loading}
            className={copied === 'tsv' ? 'border-[#10b981]/50 text-[#10b981]' : ''}
          >
            {copied === 'tsv' ? 'Copied!' : 'Copy for Excel'}
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
