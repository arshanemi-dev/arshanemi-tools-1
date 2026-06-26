'use client'

import { useState, useEffect } from 'react'
import { Calendar, Zap, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const QUICK_OPTIONS = [
  { key: '1w', label: '1 Week'   },
  { key: '1m', label: '1 Month'  },
  { key: '3m', label: '3 Months' },
  { key: '6m', label: '6 Months' },
  { key: '1y', label: '1 Year'   },
]

function resolveQuickDate(key) {
  const d = new Date()
  switch (key) {
    case '1w': d.setDate(d.getDate() + 7);          break
    case '1m': d.setMonth(d.getMonth() + 1);        break
    case '3m': d.setMonth(d.getMonth() + 3);        break
    case '6m': d.setMonth(d.getMonth() + 6);        break
    case '1y': d.setFullYear(d.getFullYear() + 1);  break
  }
  return d.toISOString()
}

function formatPreview(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function ExpiryPicker({ initialValue, onChange }) {
  // mode: null = nothing chosen yet (no default)
  const [mode,      setMode]      = useState(null)   // 'date' | 'quick' | null
  const [quickKey,  setQuickKey]  = useState(null)   // key of selected quick option
  const [dateInput, setDateInput] = useState('')     // YYYY-MM-DD for <input type="date">
  const [isoValue,  setIsoValue]  = useState(null)   // the resolved ISO string shown in preview

  // Pre-fill when editing an existing expiry (never called for new entries)
  useEffect(() => {
    if (!initialValue) return
    setMode('date')
    setDateInput(initialValue.slice(0, 10))
    setIsoValue(initialValue)
    // Don't call onChange here — parent already holds the initialValue
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function emit(iso) {
    setIsoValue(iso)
    onChange(iso)
  }

  function handleModeClick(next) {
    if (mode === next) return
    // Reset the other mode's state when switching
    if (next === 'date') {
      setQuickKey(null)
      setDateInput('')
    } else {
      setQuickKey(null)
      setDateInput('')
    }
    setMode(next)
    emit(null)
  }

  function handleDateChange(val) {
    setDateInput(val)
    emit(val ? new Date(val).toISOString() : null)
  }

  function handleQuickClick(key) {
    if (quickKey === key) {
      // Second click deselects
      setQuickKey(null)
      emit(null)
    } else {
      setQuickKey(key)
      emit(resolveQuickDate(key))
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-2.5">

      {/* ── Mode selector ─────────────────────────────────────── */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleModeClick('date')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-[7px] border transition-all',
            mode === 'date'
              ? 'bg-[#1e1b4b] border-[#4f46e5]/60 text-[#818cf8]'
              : 'bg-transparent border-[#2a2a2a] text-[#555] hover:border-[#333] hover:text-[#a3a3a3]'
          )}
        >
          <Calendar size={11} />
          Pick Date
        </button>

        <button
          type="button"
          onClick={() => handleModeClick('quick')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-[7px] border transition-all',
            mode === 'quick'
              ? 'bg-[#1e1b4b] border-[#4f46e5]/60 text-[#818cf8]'
              : 'bg-transparent border-[#2a2a2a] text-[#555] hover:border-[#333] hover:text-[#a3a3a3]'
          )}
        >
          <Zap size={11} />
          Quick Pick
        </button>
      </div>

      {/* ── Date input ────────────────────────────────────────── */}
      {mode === 'date' && (
        <input
          type="date"
          value={dateInput}
          min={today}
          onChange={e => handleDateChange(e.target.value)}
          className="w-full bg-[#161616] border border-[#262626] rounded-[8px] px-3 py-2 text-sm text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-[#4f46e5]/60"
        />
      )}

      {/* ── Quick pick pills ──────────────────────────────────── */}
      {mode === 'quick' && (
        <div className="flex flex-wrap gap-2">
          {QUICK_OPTIONS.map(opt => {
            const active = quickKey === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleQuickClick(opt.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-[7px] border transition-all',
                  active
                    ? 'bg-[#4f46e5] border-[#4f46e5] text-white'
                    : 'bg-[#111111] border-[#262626] text-[#a3a3a3] hover:border-[#4f46e5]/50 hover:text-[#818cf8]'
                )}
              >
                {active && <Check size={10} className="shrink-0" />}
                {opt.label}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Preview ───────────────────────────────────────────── */}
      {isoValue && (
        <p className="text-[10px] text-[#6b7280] flex items-center gap-1">
          Expires on:
          <span className="text-[#818cf8] font-medium">{formatPreview(isoValue)}</span>
        </p>
      )}
    </div>
  )
}
