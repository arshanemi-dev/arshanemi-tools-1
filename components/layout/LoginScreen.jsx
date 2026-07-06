'use client'

import { useState } from 'react'
import { Layers, Lock, Eye, EyeOff } from 'lucide-react'
import { saveAuthTokens } from '@/lib/tokenStore'

export default function LoginScreen({ onLogin }) {
  const [identifier, setIdentifier] = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ identifier, password }),
      })
      const data = await res.json()
      if (res.ok && data.accessToken) {
        saveAuthTokens({
          accessToken:  data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn:    data.expiresIn ?? 900,
          user:         data.user,
        })
        onLogin(data.user ?? null)
      } else {
        setError(data.error || 'Invalid credentials')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4" style={{ backgroundColor: 'var(--lt-bg-base)' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-[10px] bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/40 flex items-center justify-center text-[var(--lt-accent-light)]">
            <Layers size={20} />
          </div>
          <span className="text-xl font-bold text-[var(--lt-text-primary)]">
            Arshanemi<span className="text-[var(--lt-accent)]"> MultiImageLink</span>
          </span>
        </div>

        <div className="bg-[var(--lt-card)] border border-[var(--lt-divider)] rounded-[16px] p-6">
          <h1 className="text-lg font-bold text-[var(--lt-text-primary)] mb-1">Sign in</h1>
          <p className="text-sm text-[var(--lt-text-subtle)] mb-6">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Identifier */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-[var(--lt-text-subtle)] uppercase tracking-wider">
                Email or Mobile
              </label>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="username"
                className="w-full px-3 py-2.5 bg-[var(--lt-bg-base)] border border-[var(--lt-divider-light)] rounded-[8px] text-sm text-[var(--lt-text-primary)] placeholder-[var(--lt-text-subtle)] focus:outline-none focus:border-[var(--lt-accent)] focus:bg-[var(--lt-card)] transition-all"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-[var(--lt-text-subtle)] uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 pr-10 bg-[var(--lt-bg-base)] border border-[var(--lt-divider-light)] rounded-[8px] text-sm text-[var(--lt-text-primary)] placeholder-[var(--lt-text-subtle)] focus:outline-none focus:border-[var(--lt-accent)] focus:bg-[var(--lt-card)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-[#ef4444] bg-[#450a0a] border border-[#ef4444]/30 rounded-[8px] px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !identifier || !password}
              className="flex items-center justify-center gap-2 py-2.5 bg-[var(--lt-accent)] text-white text-sm font-semibold rounded-[8px] hover:bg-[var(--lt-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all mt-1"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <Lock size={13} />
                  Sign in
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
