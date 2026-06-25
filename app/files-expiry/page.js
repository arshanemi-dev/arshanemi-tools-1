'use client'
import { useEffect, useState, useCallback } from 'react'
import { Clock, Plus, Trash2, Pencil, X, Check, Loader2, AlertTriangle } from 'lucide-react'

function daysRemaining(expiryAt) {
  return Math.ceil((new Date(expiryAt) - new Date()) / 86400000)
}

function StatusBadge({ days }) {
  if (days <= 0)
    return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Expired</span>
  if (days <= 7)
    return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Expiring in {days}d</span>
  return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">{days}d left</span>
}

const EMPTY_ROW = { name: '', expiryAt: '' }

export default function FilesExpiryPage() {
  const [records, setRecords]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(new Set())
  const [modal, setModal]           = useState(null) // null | 'add' | 'editOne' | 'bulkExpiry'
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm]             = useState(EMPTY_ROW)
  const [addRows, setAddRows]       = useState([{ ...EMPTY_ROW }])
  const [bulkDate, setBulkDate]     = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/files-expiry')
      const data = await res.json()
      setRecords(data.records ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

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

  async function handleDelete(ids) {
    if (!confirm(`Delete ${ids.length} record(s)?`)) return
    await fetch('/api/files-expiry/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    setSelected(new Set())
    load()
  }

  function openAdd() { setAddRows([{ ...EMPTY_ROW }]); setError(''); setModal('add') }
  function openEditOne(r) {
    setEditTarget(r)
    setForm({ name: r.name, expiryAt: (r.expiryAt ?? r.expiry_at ?? '').slice(0, 10) })
    setError('')
    setModal('editOne')
  }
  function openBulkExpiry() { setBulkDate(''); setError(''); setModal('bulkExpiry') }

  async function handleAdd() {
    setError('')
    for (const row of addRows) {
      if (!row.name.trim() || !row.expiryAt) { setError('Each row needs a name and expiry date'); return }
    }
    setSaving(true)
    try {
      const res = await fetch('/api/files-expiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: addRows.map(r => ({ name: r.name.trim(), expiryAt: new Date(r.expiryAt).toISOString() })) }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error'); return }
      setModal(null); load()
    } finally { setSaving(false) }
  }

  async function handleEditOne() {
    setError('')
    if (!form.name.trim() || !form.expiryAt) { setError('Name and expiry date are required'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/files-expiry/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), expiryAt: new Date(form.expiryAt).toISOString() }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error'); return }
      setModal(null); load()
    } finally { setSaving(false) }
  }

  async function handleBulkExpiry() {
    setError('')
    if (!bulkDate) { setError('Select an expiry date'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/files-expiry/bulk-expiry', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected], expiryAt: new Date(bulkDate).toISOString() }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error'); return }
      setSelected(new Set()); setModal(null); load()
    } finally { setSaving(false) }
  }

  const allChecked = records.length > 0 && selected.size === records.length
  const someChecked = selected.size > 0

  return (
    <div className="flex flex-col h-full overflow-auto bg-[#0a0a0a] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-[#1e1b4b] border border-[#4f46e5]/40 flex items-center justify-center">
            <Clock size={16} className="text-[#818cf8]" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-[#f5f5f5]">Files Expiry</h1>
            <p className="text-xs text-[#6b7280]">Track and manage file expiry dates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {someChecked && (
            <>
              <button
                onClick={openBulkExpiry}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#4f46e5]/40 text-[#818cf8] bg-[#1e1b4b] rounded-[8px] hover:bg-[#1e1b4b]/80 transition-colors"
              >
                <Clock size={12} />
                Edit Expiry ({selected.size})
              </button>
              <button
                onClick={() => handleDelete([...selected])}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-500/30 text-red-400 bg-red-500/10 rounded-[8px] hover:bg-red-500/20 transition-colors"
              >
                <Trash2 size={12} />
                Delete ({selected.size})
              </button>
            </>
          )}
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#4f46e5] text-white rounded-[8px] hover:bg-[#4338ca] transition-colors"
          >
            <Plus size={12} />
            Add Files
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={20} className="animate-spin text-[#4f46e5]" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16">
          <AlertTriangle size={32} className="mx-auto mb-3 text-[#333333]" />
          <p className="text-sm font-medium text-[#a3a3a3]">No files tracked yet</p>
          <p className="text-xs text-[#6b7280]">Click "Add Files" to start tracking expiry dates</p>
        </div>
      ) : (
        <div className="border border-[#262626] rounded-[10px] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#111111] border-b border-[#262626]">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll}
                    className="rounded border-[#333333] bg-transparent accent-[#4f46e5]" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280]">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280]">Expiry Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280]">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] hidden sm:table-cell">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#6b7280]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1c1c]">
              {records.map(r => {
                const expiryVal = r.expiryAt ?? r.expiry_at
                const days = daysRemaining(expiryVal)
                return (
                  <tr key={r.id} className={selected.has(r.id) ? 'bg-[#1e1b4b]/30' : 'hover:bg-[#111111]'}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleOne(r.id)}
                        className="rounded border-[#333333] bg-transparent accent-[#4f46e5]" />
                    </td>
                    <td className="px-4 py-3 font-medium text-[#f5f5f5] truncate max-w-xs">{r.name}</td>
                    <td className="px-4 py-3 text-[#a3a3a3] text-xs">
                      {new Date(expiryVal).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3"><StatusBadge days={days} /></td>
                    <td className="px-4 py-3 text-[#6b7280] text-xs hidden sm:table-cell">
                      {new Date(r.createdAt ?? r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditOne(r)}
                          className="p-1.5 rounded-[6px] hover:bg-[#1c1c1c] text-[#6b7280] hover:text-[#818cf8] transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete([r.id])}
                          className="p-1.5 rounded-[6px] hover:bg-red-500/10 text-[#6b7280] hover:text-red-400 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add */}
      {modal === 'add' && (
        <Modal title="Add Files to Track" onClose={() => setModal(null)}>
          <div className="space-y-2">
            {addRows.map((row, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" placeholder="File name or path" value={row.name}
                  onChange={e => setAddRows(prev => prev.map((r, j) => j === i ? { ...r, name: e.target.value } : r))}
                  className="flex-1 bg-[#161616] border border-[#262626] rounded-[8px] px-3 py-2 text-sm text-[#f5f5f5] placeholder:text-[#6b7280] focus:outline-none focus:ring-1 focus:ring-[#4f46e5]/60"
                />
                <input type="date" value={row.expiryAt}
                  onChange={e => setAddRows(prev => prev.map((r, j) => j === i ? { ...r, expiryAt: e.target.value } : r))}
                  className="bg-[#161616] border border-[#262626] rounded-[8px] px-3 py-2 text-sm text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-[#4f46e5]/60"
                />
                {addRows.length > 1 && (
                  <button onClick={() => setAddRows(prev => prev.filter((_, j) => j !== i))} className="text-[#6b7280] hover:text-red-400">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => setAddRows(prev => [...prev, { ...EMPTY_ROW }])}
              className="text-xs text-[#818cf8] hover:underline">
              + Add another row
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          <ModalActions onCancel={() => setModal(null)} onSave={handleAdd} saving={saving} saveLabel="Add Files" />
        </Modal>
      )}

      {/* Modal: Edit One */}
      {modal === 'editOne' && (
        <Modal title="Edit File Expiry" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#a3a3a3] mb-1">File Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-[#161616] border border-[#262626] rounded-[8px] px-3 py-2 text-sm text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-[#4f46e5]/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#a3a3a3] mb-1">Expiry Date</label>
              <input type="date" value={form.expiryAt} onChange={e => setForm(f => ({ ...f, expiryAt: e.target.value }))}
                className="w-full bg-[#161616] border border-[#262626] rounded-[8px] px-3 py-2 text-sm text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-[#4f46e5]/60"
              />
            </div>
          </div>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          <ModalActions onCancel={() => setModal(null)} onSave={handleEditOne} saving={saving} saveLabel="Save Changes" />
        </Modal>
      )}

      {/* Modal: Bulk Expiry */}
      {modal === 'bulkExpiry' && (
        <Modal title={`Update Expiry for ${selected.size} File(s)`} onClose={() => setModal(null)}>
          <p className="text-xs text-[#6b7280] mb-3">Set a new expiry date for all selected files.</p>
          <input type="date" value={bulkDate} onChange={e => setBulkDate(e.target.value)}
            className="w-full bg-[#161616] border border-[#262626] rounded-[8px] px-3 py-2 text-sm text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-[#4f46e5]/60"
          />
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          <ModalActions onCancel={() => setModal(null)} onSave={handleBulkExpiry} saving={saving} saveLabel="Update Expiry" />
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-[#262626] rounded-[12px] shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#262626]">
          <h2 className="font-semibold text-[#f5f5f5] text-sm">{title}</h2>
          <button onClick={onClose} className="text-[#6b7280] hover:text-[#f5f5f5]"><X size={16} /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

function ModalActions({ onCancel, onSave, saving, saveLabel = 'Save' }) {
  return (
    <div className="flex justify-end gap-2 mt-4">
      <button onClick={onCancel}
        className="px-4 py-1.5 text-xs border border-[#262626] rounded-[8px] text-[#a3a3a3] hover:bg-[#1c1c1c] transition-colors">
        Cancel
      </button>
      <button onClick={onSave} disabled={saving}
        className="px-4 py-1.5 text-xs bg-[#4f46e5] text-white rounded-[8px] hover:bg-[#4338ca] transition-colors disabled:opacity-60 flex items-center gap-1.5">
        {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
        {saveLabel}
      </button>
    </div>
  )
}
