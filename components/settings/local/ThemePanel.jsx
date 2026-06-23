'use client'

import { Check, Sparkles } from 'lucide-react'
import { THEME_PRESETS, saveTheme, applyThemeCssVars } from '@/lib/localStore'
import { cn } from '@/lib/utils'

const LIGHT_TEXT = { indigo: '#fff', emerald: '#fff', rose: '#fff', amber: '#fff', cyan: '#fff', violet: '#fff' }

export default function ThemePanel({ theme, onThemeChange }) {
  function handleSelect(preset) {
    saveTheme(preset)
    applyThemeCssVars(preset)
    onThemeChange(preset)
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Grid of swatches */}
      <div>
        <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-3">
          Accent Colour
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {THEME_PRESETS.map(preset => {
            const sel = theme?.id === preset.id
            return (
              <button
                key={preset.id}
                onClick={() => handleSelect(preset)}
                className={cn(
                  'group flex flex-col items-center gap-2.5 p-3 rounded-[12px] border transition-all',
                  sel
                    ? 'border-[#ffffff20] bg-[#161616] scale-[1.03]'
                    : 'border-[#1e1e1e] bg-[#161616] hover:border-[#2a2a2a] hover:scale-[1.02]'
                )}
              >
                <div className="relative">
                  <div
                    className="w-9 h-9 rounded-full transition-all"
                    style={{
                      backgroundColor: preset.accent,
                      boxShadow: sel ? `0 0 16px ${preset.accent}70` : 'none',
                    }}
                  />
                  <div
                    className="absolute inset-0 rounded-full transition-all"
                    style={{
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2)`,
                    }}
                  />
                  {sel && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check size={15} color="white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className={cn(
                  'text-[10px] font-semibold transition-colors',
                  sel ? 'text-[#f5f5f5]' : 'text-[#6b7280] group-hover:text-[#a3a3a3]'
                )}>
                  {preset.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Live preview */}
      {theme && (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Preview</p>

          <div className="p-4 bg-[#161616] border border-[#1e1e1e] rounded-[12px] flex flex-col gap-3">
            {/* Mini header */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-[4px] flex items-center justify-center" style={{ backgroundColor: theme.accent }}>
                <Sparkles size={10} color="white" />
              </div>
              <div className="h-2 w-20 rounded-full" style={{ backgroundColor: theme.accent, opacity: 0.9 }} />
              <div className="h-2 w-10 rounded-full bg-[#2a2a2a] ml-auto" />
            </div>

            {/* Palette strip */}
            <div className="flex gap-2 items-center">
              {[theme.accent, theme.accentLight, '#0a0a0a', '#111111', '#161616', '#262626', '#a3a3a3'].map((c, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-7 h-7 rounded-[6px] border border-[#ffffff08]"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                  <span className="text-[8px] text-[#4a4a4a] font-mono">{c.slice(1, 4)}</span>
                </div>
              ))}
            </div>

            {/* Mini CTA */}
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[11px] font-semibold text-white"
                style={{ backgroundColor: theme.accent }}
              >
                <Check size={10} />
                {theme.name}
              </div>
              <div
                className="h-5 w-16 rounded-[6px] opacity-20"
                style={{ backgroundColor: theme.accentLight }}
              />
            </div>
          </div>
        </div>
      )}

      <p className="flex items-start gap-2 text-[10px] text-[#4a4a4a] bg-[#0f0f0f] border border-[#1a1a1a] rounded-[8px] px-3 py-2.5 leading-relaxed">
        <Sparkles size={11} className="text-[#4a4a4a] mt-0.5 shrink-0" />
        Theme preference is saved to localStorage. CSS custom properties{' '}
        <code className="text-[#6b7280]">--lt-accent</code> and{' '}
        <code className="text-[#6b7280]">--lt-accent-light</code> are injected on apply.
      </p>

    </div>
  )
}
