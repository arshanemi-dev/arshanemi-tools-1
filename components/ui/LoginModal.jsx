'use client'

import { useState, useEffect } from 'react'
import { X, LogIn } from 'lucide-react'
import { saveAuthTokens } from '@/lib/tokenStore'
import { ensureUserFolderFromClient } from '@/lib/userAccess'

const API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? ''

export default function LoginModal() {
  const [open, setOpen]           = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  useEffect(() => {
    const show = () => setOpen(true)
    window.addEventListener('auth:require', show)
    return () => window.removeEventListener('auth:require', show)
  }, [])

  function handleClose() {
    setOpen(false)
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Login failed')
        return
      }
      saveAuthTokens({
        accessToken:  data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn:    data.expiresIn ?? 900,
        user:         data.user,
      })
      if (data.user) ensureUserFolderFromClient(data.user).catch(() => {})
      setOpen(false)
      setIdentifier('')
      setPassword('')
      setError(null)
      window.dispatchEvent(new CustomEvent('auth:success'))
    } catch {
      setError('Cannot reach admin API. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-sm bg-[var(--lt-surface)] border border-[var(--lt-divider)] rounded-[12px] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-[var(--lt-text-primary)]">Please log in</h2>
          <button
            onClick={handleClose}
            className="p-1 text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] transition-colors rounded-[6px] hover:bg-[var(--lt-card-hover)]"
          >
            <X size={15} />
          </button>
        </div>
        <p className="text-xs text-[var(--lt-text-subtle)] mb-5">
          Sign in to your admin account to continue.
        </p>

        {!API_BASE ? (
          <p className="text-xs text-[#f59e0b] bg-[#451a03] border border-[#f59e0b]/30 rounded-[8px] px-3 py-2">
            Admin API not configured. Set{' '}
            <code className="text-[var(--lt-text-primary)] bg-[var(--lt-card-hover)] px-1 py-0.5 rounded">NEXT_PUBLIC_ADMIN_API_URL</code>{' '}
            in <code className="text-[var(--lt-text-primary)] bg-[var(--lt-card-hover)] px-1 py-0.5 rounded">.env.local</code>.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="Email or Mobile"
              autoComplete="username"
              required
              className="w-full px-3 py-2.5 bg-[var(--lt-bg-base)] border border-[var(--lt-divider-light)] rounded-[8px] text-sm text-[var(--lt-text-primary)] placeholder-[var(--lt-text-subtle)] focus:outline-none focus:border-[var(--lt-accent)] transition-colors"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              required
              className="w-full px-3 py-2.5 bg-[var(--lt-bg-base)] border border-[var(--lt-divider-light)] rounded-[8px] text-sm text-[var(--lt-text-primary)] placeholder-[var(--lt-text-subtle)] focus:outline-none focus:border-[var(--lt-accent)] transition-colors"
            />

            {error && (
              <p className="text-xs text-[#ef4444] bg-[#450a0a] border border-[#ef4444]/30 rounded-[8px] px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-[var(--lt-accent)] text-white text-sm font-medium rounded-[8px] hover:bg-[var(--lt-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-1"
            >
              <LogIn size={14} />
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
