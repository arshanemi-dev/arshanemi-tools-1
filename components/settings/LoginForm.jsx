'use client'

import { useState } from 'react'
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { saveAuthTokens } from '@/lib/tokenStore'
import { ensureUserFolderFromClient } from '@/lib/userAccess'
import Button from '@/components/ui/Button'

const API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? ''

export default function LoginForm({ onSuccess }) {
  const [identifier, setIdentifier] = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)

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

      onSuccess?.(data.user)
    } catch (err) {
      setError('Cannot reach admin API. Check NEXT_PUBLIC_ADMIN_API_URL in .env.local.')
    } finally {
      setLoading(false)
    }
  }

  if (!API_BASE) {
    return (
      <div className="flex items-start gap-3 p-4 bg-[#451a03] border border-[#f59e0b]/30 rounded-[10px]">
        <AlertCircle size={16} className="text-[#f59e0b] mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-[#f59e0b]">Admin API not configured</p>
          <p className="text-xs text-[var(--lt-text-muted)] mt-1">
            Set <code className="text-[var(--lt-text-primary)] bg-[var(--lt-card-hover)] px-1 py-0.5 rounded">NEXT_PUBLIC_ADMIN_API_URL</code> in{' '}
            <code className="text-[var(--lt-text-primary)] bg-[var(--lt-card-hover)] px-1 py-0.5 rounded">.env.local</code> to enable login.
            Dummy theme, user and plan data will be used until then.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--lt-text-subtle)] font-medium">Email or Mobile</label>
        <input
          type="text"
          value={identifier}
          onChange={e => setIdentifier(e.target.value)}
          placeholder="admin@example.com"
          autoComplete="username"
          required
          className="w-full px-3 py-2.5 bg-[var(--lt-surface)] border border-[var(--lt-divider-light)] rounded-[8px] text-sm text-[var(--lt-text-primary)] placeholder-[var(--lt-text-subtle)] focus:outline-none focus:border-[var(--lt-accent)] transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--lt-text-subtle)] font-medium">Password</label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="w-full px-3 pr-9 py-2.5 bg-[var(--lt-surface)] border border-[var(--lt-divider-light)] rounded-[8px] text-sm text-[var(--lt-text-primary)] placeholder-[var(--lt-text-subtle)] focus:outline-none focus:border-[var(--lt-accent)] transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPass(s => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] transition-colors"
          >
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-[#ef4444] bg-[#450a0a] border border-[#ef4444]/30 rounded-[8px] px-3 py-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" disabled={loading} icon={<LogIn size={14} />}>
        {loading ? 'Signing in…' : 'Sign in to Admin Panel'}
      </Button>

      <p className="text-xs text-[var(--lt-text-subtle)] text-center">
        Connecting to{' '}
        <span className="text-[var(--lt-accent-light)]">{API_BASE}</span>
      </p>
    </form>
  )
}
