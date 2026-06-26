'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  X, Clock, Plus, Trash2, Pencil, Check, Loader2, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── helpers ────────────────────────────────────────────────────── */
function daysRemaining(iso) {
  return Math.ceil((new Date(iso) - new Date()) / 86400000)
}

function StatusBadge({ days }) {
  if (days <= 0)
    return <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">Expired</span>
  if (days <= 7)
    return <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">{days}d</span>
  return <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--lt-accent-muted)] text-[var(--lt-accent-light)]">{days}d</span>
}

const EMPTY_ROW = { name: '', expiryAt: '' }

/* ═══════════════════════════════════════════════════════════════════
   FilesExpiryManagerModal
   Props:
     onClose  — close the modal
═════════════════════════════════════════════════════════════════════ */
export default function FilesExpiryManagerModal({ onClose }) {
  const [records, setRecords]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(new Set())
  const [panel, setPanel]         = useState(null)  // null | 'add' | 'editOne' | 'bulkExpiry'
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm]   = useState({ name: '', expiryAt: '' })
  const [addRows, setAddRows]     = useState([{ ...EMPTY_ROW }])
  const [bulkDate, setBulkDate]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  /* ── fetch ─────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/files-expiry')
      const data = await res.json()
      setRecords(data.records ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  /* ── selection ─────────────────────────────────────────────────── */
  function toggleAll(e) {
    setSelected(e.target.checked ? new Set(records.map(r => r.id)) : new Set())
  }
  function toggleOne(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  /* ── delete ─────────────────────────────────────────────────────── */
  async function handleDelete(ids) {
    if (!confirm(`Delete ${ids.length} record(s)?`)) return
    await fetch('/api/files-expiry/delete', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ids }),
    })
    setSelected(new Set())
    load()
  }

  /* ── add ────────────────────────────────────────────────────────── */
  async function handleAdd() {
    setError('')
    for (const row of addRows) {
      if (!row.name.trim() || !row.expiryAt) { setError('Each row needs a name and expiry date'); return }
    }
    setSaving(true)
    try {
      const res = await fetch('/api/files-expiry', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          items: addRows.map(r => ({ name: r.name.trim(), expiryAt: new Date(r.expiryAt).toISOString() })),
        }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error'); return }
      setPanel(null)
      setAddRows([{ ...EMPTY_ROW }])
      load()
    } finally { setSaving(false) }
  }

  /* ── edit one ───────────────────────────────────────────────────── */
  function openEditOne(r) {
    setEditTarget(r)
    setEditForm({ name: r.name, expiryAt: (r.expiryAt ?? r.expiry_at ?? '').slice(0, 10) })
    setError('')
    setPanel('editOne')
  }

  async function handleEditOne() {
    setError('')
    if (!editForm.name.trim() || !editForm.expiryAt) { setError('Name and expiry date are required'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/files-expiry/${editTarget.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: editForm.name.trim(), expiryAt: new Date(editForm.expiryAt).toISOString() }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error'); return }
      setPanel(null)
      load()
    } finally { setSaving(false) }
  }

  /* ── bulk expiry ────────────────────────────────────────────────── */
  async function handleBulkExpiry() {
    setError('')
    if (!bulkDate) { setError('Select an expiry date'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/files-expiry/bulk-expiry', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ids: [...selected], expiryAt: new Date(bulkDate).toISOString() }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error'); return }
      setSelected(new Set())
      setPanel(null)
      load()
    } finally { setSaving(false) }
  }

  const allChecked  = records.length > 0 && selected.size === records.length
  const someChecked = selected.size > 0

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--lt-surface)] border border-[var(--lt-divider)] rounded-[14px] shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--lt-divider)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[7px] bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/40 flex items-center justify-center">
              <Clock size={14} className="text-[var(--lt-accent-light)]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--lt-text-primary)]">Files Expiry Manager</h2>
              <p className="text-[10px] text-[var(--lt-text-subtle)]">Track and manage file expiry dates</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--lt-divider)] shrink-0">
          {someChecked && (
            <>
              <button
                onClick={() => { setBulkDate(''); setError(''); setPanel('bulkExpiry') }}
                className="flex items-center gap-1.5 px-2.5 h-7 text-xs rounded-[7px] bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/40 text-[var(--lt-accent-light)] hover:bg-[#2d2a6e] transition-colors"
              >
                <Clock size={11} />
                Edit Expiry ({selected.size})
              </button>
              <button
                onClick={() => handleDelete([...selected])}
                className="flex items-center gap-1.5 px-2.5 h-7 text-xs rounded-[7px] bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 size={11} />
                Delete ({selected.size})
              </button>
              <div className="w-px h-4 bg-[var(--lt-divider)] mx-1" />
            </>
          )}
          <button
            onClick={() => { setAddRows([{ ...EMPTY_ROW }]); setError(''); setPanel('add') }}
            className="flex items-center gap-1.5 px-2.5 h-7 text-xs rounded-[7px] bg-[var(--lt-accent)] text-white hover:bg-[var(--lt-accent-hover)] transition-colors"
          >
            <Plus size={11} />
            Add Files
          </button>
          <span className="ml-auto text-[10px] text-[var(--lt-text-subtle)]">{records.length} record{records.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Records list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={18} className="animate-spin text-[var(--lt-accent)]" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <AlertTriangle size={24} className="text-[var(--lt-divider-light)] mb-2" />
              <p className="text-sm text-[var(--lt-text-muted)] font-medium">No files tracked yet</p>
              <p className="text-xs text-[var(--lt-text-subtle)]">Click "Add Files" to start tracking</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[var(--lt-surface)] border-b border-[var(--lt-divider)]">
                <tr>
                  <th className="w-8 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="rounded border-[#333] bg-transparent accent-[var(--lt-accent)]"
                    />
                  </th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-[var(--lt-text-subtle)]">File Name</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-[var(--lt-text-subtle)] w-32">Expiry</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-[var(--lt-text-subtle)] w-16">Status</th>
                  <th className="px-3 py-2.5 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--lt-card)]">
                {records.map(r => {
                  const expiryVal = r.expiryAt ?? r.expiry_at
                  const days      = daysRemaining(expiryVal)
                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        'group transition-colors',
                        selected.has(r.id) ? 'bg-[var(--lt-accent-muted)]/30' : 'hover:bg-[var(--lt-card)]'
                      )}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleOne(r.id)}
                          className="rounded border-[#333] bg-transparent accent-[var(--lt-accent)]"
                        />
                      </td>
                      <td className="px-3 py-2 text-[var(--lt-text-primary)] font-medium truncate max-w-[260px]">
                        {r.name}
                      </td>
                      <td className="px-3 py-2 text-[var(--lt-text-muted)]">
                        {new Date(expiryVal).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge days={days} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditOne(r)}
                            title="Edit"
                            className="w-6 h-6 flex items-center justify-center rounded-[5px] text-[var(--lt-text-subtle)] hover:text-[var(--lt-accent-light)] hover:bg-[var(--lt-accent-muted)] transition-colors"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={() => handleDelete([r.id])}
                            title="Delete"
                            className="w-6 h-6 flex items-center justify-center rounded-[5px] text-[var(--lt-text-subtle)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Inline panels (slide up from bottom of modal) ──────────── */}

        {/* Panel: Add Files */}
        {panel === 'add' && (
          <InlinePanel title="Add Files to Track" onClose={() => setPanel(null)}>
            <div className="space-y-2 mb-3">
              {addRows.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="File name or path"
                    value={row.name}
                    onChange={e => setAddRows(prev => prev.map((r, j) => j === i ? { ...r, name: e.target.value } : r))}
                    className="flex-1 bg-[var(--lt-bg-base)] border border-[var(--lt-divider)] rounded-[7px] px-3 py-1.5 text-xs text-[var(--lt-text-primary)] placeholder:text-[#4b4b4b] focus:outline-none focus:ring-1 focus:ring-[var(--lt-accent)]/50"
                  />
                  <input
                    type="date"
                    value={row.expiryAt}
                    onChange={e => setAddRows(prev => prev.map((r, j) => j === i ? { ...r, expiryAt: e.target.value } : r))}
                    className="bg-[var(--lt-bg-base)] border border-[var(--lt-divider)] rounded-[7px] px-3 py-1.5 text-xs text-[var(--lt-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--lt-accent)]/50"
                  />
                  {addRows.length > 1 && (
                    <button
                      onClick={() => setAddRows(prev => prev.filter((_, j) => j !== i))}
                      className="text-[var(--lt-text-subtle)] hover:text-red-400 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setAddRows(prev => [...prev, { ...EMPTY_ROW }])}
                className="text-[10px] text-[var(--lt-accent)] hover:text-[var(--lt-accent-light)] transition-colors"
              >
                + Add another row
              </button>
            </div>
            {error && <p className="text-[10px] text-red-400 mb-2">{error}</p>}
            <PanelActions onCancel={() => setPanel(null)} onSave={handleAdd} saving={saving} saveLabel="Add Files" />
          </InlinePanel>
        )}

        {/* Panel: Edit One */}
        {panel === 'editOne' && (
          <InlinePanel title="Edit File Expiry" onClose={() => setPanel(null)}>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[10px] text-[var(--lt-text-subtle)] mb-1">File Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-[var(--lt-bg-base)] border border-[var(--lt-divider)] rounded-[7px] px-3 py-1.5 text-xs text-[var(--lt-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--lt-accent)]/50"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--lt-text-subtle)] mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={editForm.expiryAt}
                  onChange={e => setEditForm(f => ({ ...f, expiryAt: e.target.value }))}
                  className="w-full bg-[var(--lt-bg-base)] border border-[var(--lt-divider)] rounded-[7px] px-3 py-1.5 text-xs text-[var(--lt-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--lt-accent)]/50"
                />
              </div>
            </div>
            {error && <p className="text-[10px] text-red-400 mb-2">{error}</p>}
            <PanelActions onCancel={() => setPanel(null)} onSave={handleEditOne} saving={saving} saveLabel="Save Changes" />
          </InlinePanel>
        )}

        {/* Panel: Bulk Edit Expiry */}
        {panel === 'bulkExpiry' && (
          <InlinePanel title={`Update Expiry for ${selected.size} File(s)`} onClose={() => setPanel(null)}>
            <div className="flex items-end gap-3 mb-3">
              <div className="flex-1">
                <label className="block text-[10px] text-[var(--lt-text-subtle)] mb-1">New Expiry Date</label>
                <input
                  type="date"
                  value={bulkDate}
                  onChange={e => setBulkDate(e.target.value)}
                  className="w-full bg-[var(--lt-bg-base)] border border-[var(--lt-divider)] rounded-[7px] px-3 py-1.5 text-xs text-[var(--lt-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--lt-accent)]/50"
                />
              </div>
            </div>
            {error && <p className="text-[10px] text-red-400 mb-2">{error}</p>}
            <PanelActions onCancel={() => setPanel(null)} onSave={handleBulkExpiry} saving={saving} saveLabel="Update Expiry" />
          </InlinePanel>
        )}
      </div>
    </div>
  )
}

/* ── sub-components ──────────────────────────────────────────────── */
function InlinePanel({ title, onClose, children }) {
  return (
    <div className="border-t border-[var(--lt-divider)] bg-[var(--lt-surface)] rounded-b-[14px] px-5 py-4 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[var(--lt-text-primary)]">{title}</span>
        <button onClick={onClose} className="text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] transition-colors">
          <X size={13} />
        </button>
      </div>
      {children}
    </div>
  )
}

function PanelActions({ onCancel, onSave, saving, saveLabel = 'Save' }) {
  return (
    <div className="flex justify-end gap-2">
      <button
        onClick={onCancel}
        className="px-3 py-1.5 text-xs border border-[var(--lt-divider)] rounded-[7px] text-[var(--lt-text-muted)] hover:bg-[var(--lt-card-hover)] transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="px-3 py-1.5 text-xs bg-[var(--lt-accent)] text-white rounded-[7px] hover:bg-[var(--lt-accent-hover)] transition-colors disabled:opacity-60 flex items-center gap-1.5"
      >
        {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
        {saveLabel}
      </button>
    </div>
  )
}
