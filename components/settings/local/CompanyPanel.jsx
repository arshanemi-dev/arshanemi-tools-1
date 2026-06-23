'use client'

import { useState } from 'react'
import {
  Building2, Plus, Pencil, Trash2, Check, X,
  FolderOpen, Users, Globe, Phone, Mail,
} from 'lucide-react'
import { addCompany, updateCompany, deleteCompany, getUsersForCompany } from '@/lib/localStore'
import { cn } from '@/lib/utils'

// ── Inline form ───────────────────────────────────────────────────────────────

const BLANK = { name: '', email: '', phone: '', website: '' }

function CompanyForm({ initial = BLANK, onSave, onCancel, title }) {
  const [f, setF] = useState({ ...initial })
  const [err, setErr] = useState('')
  const ok = f.email.trim().length > 0

  function field(key, label, type = 'text', placeholder = '') {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">{label}</label>
        <input
          type={type}
          value={f[key]}
          onChange={e => setF(p => ({ ...p, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-[8px] text-sm text-[#f5f5f5] placeholder-[#4a4a4a] focus:outline-none focus:border-[#4f46e5] focus:bg-[#0d0d14] transition-all"
        />
      </div>
    )
  }

  function handleSave() {
    setErr('')
    try {
      onSave(f)
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <div className="p-4 bg-[#0f0f1a] border border-[#4f46e5]/30 rounded-[12px] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-[#818cf8] uppercase tracking-wider">{title}</p>
        <button onClick={onCancel} className="p-1 text-[#6b7280] hover:text-[#f5f5f5] transition-colors">
          <X size={14} />
        </button>
      </div>

      {err && (
        <p className="text-xs text-[#ef4444] bg-[#2a0a0a] border border-[#ef4444]/30 rounded-[8px] px-3 py-2">{err}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field('name',    'Company Name',  'text',  'Acme Corp')}
        {field('email',   'Company Email', 'email', 'contact@acme.com')}
        {field('phone',   'Phone',         'text',  '+91 98765 43210')}
        {field('website', 'Website',       'url',   'https://acme.com')}
      </div>

      <p className="text-[10px] text-[#4a4a4a] leading-relaxed">
        Folder ID is auto-derived from the company name (e.g. <span className="text-[#6b7280]">acme_corp</span>).
        If no name is given a random ID is used. Changing the name later updates the folder path for new uploads.
      </p>

      <div className="flex gap-2 pt-1">
        <button
          disabled={!ok}
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#4f46e5] text-white text-sm font-semibold rounded-[8px] hover:bg-[#4338ca] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Check size={13} />
          {title === 'Edit Company' ? 'Save Changes' : 'Create Company'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 text-sm text-[#6b7280] font-medium bg-[#1c1c1c] rounded-[8px] hover:text-[#f5f5f5] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Company row ───────────────────────────────────────────────────────────────

function CompanyRow({ company, onEdit, onDelete }) {
  const members = getUsersForCompany(company.id)

  return (
    <div className="group flex flex-col gap-2.5 p-4 bg-[#161616] border border-[#1e1e1e] hover:border-[#2a2a2a] rounded-[12px] transition-all">

      {/* Top: avatar + name + actions */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-[8px] bg-[#1e1b4b] border border-[#4f46e5]/30 flex items-center justify-center shrink-0">
          <Building2 size={16} className="text-[#818cf8]" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#f5f5f5] truncate">
            {company.name || <span className="italic text-[#4a4a4a]">Unnamed Company</span>}
          </p>
          {company.slug && (
            <p className="text-[10px] text-[#4a4a4a] mt-0.5">@{company.slug}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(company)}
            className="p-1.5 text-[#6b7280] hover:text-[#f5f5f5] hover:bg-[#2a2a2a] rounded-[6px] transition-colors"
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(company)}
            className="p-1.5 text-[#6b7280] hover:text-[#ef4444] hover:bg-[#2a0a0a] rounded-[6px] transition-colors"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-[#4a4a4a]">
        {company.email && (
          <span className="flex items-center gap-1">
            <Mail size={10} className="text-[#4f46e5]" />
            {company.email}
          </span>
        )}
        {company.phone && (
          <span className="flex items-center gap-1">
            <Phone size={10} className="text-[#4f46e5]" />
            {company.phone}
          </span>
        )}
        {company.website && (
          <span className="flex items-center gap-1">
            <Globe size={10} className="text-[#4f46e5]" />
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:text-[#818cf8] truncate max-w-[140px]">
              {company.website.replace(/^https?:\/\//, '')}
            </a>
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users size={10} className="text-[#4f46e5]" />
          {members.length} user{members.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Folder path badge */}
      <div className="flex items-center gap-2">
        <FolderOpen size={10} className="text-[#4a4a4a] shrink-0" />
        <code className="text-[10px] text-[#6b7280] font-mono bg-[#0f0f0f] border border-[#2a2a2a] rounded-[5px] px-2 py-0.5">
          tools/{company.folderId}/
        </code>
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function CompanyPanel({ companies, onRefresh }) {
  const [creating, setCreating] = useState(false)
  const [editing,  setEditing]  = useState(null)

  function handleCreate(data) {
    addCompany(data)  // throws on duplicate email
    setCreating(false)
    onRefresh()
  }

  function handleUpdate(data) {
    updateCompany(editing.id, data)
    setEditing(null)
    onRefresh()
  }

  function handleDelete(company) {
    const members = getUsersForCompany(company.id)
    const warn = members.length > 0
      ? `Delete "${company.name || company.email}"? ${members.length} user(s) will be unlinked.`
      : `Delete "${company.name || company.email}"?`
    if (!window.confirm(warn)) return
    deleteCompany(company.id)
    onRefresh()
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#6b7280]">
          {companies.length} local compan{companies.length !== 1 ? 'ies' : 'y'}
        </p>
        {!creating && !editing && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4f46e5] text-white text-xs font-semibold rounded-[8px] hover:bg-[#4338ca] transition-colors"
          >
            <Plus size={13} />
            Add Company
          </button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <CompanyForm
          title="New Company"
          onSave={handleCreate}
          onCancel={() => setCreating(false)}
        />
      )}

      {/* Empty state */}
      {companies.length === 0 && !creating && (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
          <div className="w-12 h-12 rounded-[10px] bg-[#161616] border border-[#262626] flex items-center justify-center">
            <Building2 size={20} className="text-[#2a2a2a]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#a3a3a3]">No companies yet</p>
            <p className="text-xs text-[#6b7280] mt-1 max-w-xs leading-relaxed">
              Create a company first, then assign users to it. Each company gets its own Dropbox folder.
            </p>
          </div>
        </div>
      )}

      {/* List */}
      {companies.length > 0 && (
        <div className="flex flex-col gap-2">
          {companies.map(c => {
            if (editing?.id === c.id) {
              return (
                <CompanyForm
                  key={c.id}
                  title="Edit Company"
                  initial={{ name: c.name ?? '', email: c.email, phone: c.phone ?? '', website: c.website ?? '' }}
                  onSave={handleUpdate}
                  onCancel={() => setEditing(null)}
                />
              )
            }
            return (
              <CompanyRow
                key={c.id}
                company={c}
                onEdit={setEditing}
                onDelete={handleDelete}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
