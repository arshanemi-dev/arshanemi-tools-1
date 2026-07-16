'use client'

const KEYS = {
  accessToken:  'access_token',
  refreshToken: 'refresh_token',
  expiresAt:    'token_expires_at',
  user:         'user',
}

// ── Persist ──────────────────────────────────────────────────────────────────

export function saveAuthTokens({ accessToken, refreshToken, expiresIn = 900, user }) {
  if (typeof window === 'undefined') return
  const expiresAt = Date.now() + expiresIn * 1000
  localStorage.setItem(KEYS.accessToken,  accessToken)
  localStorage.setItem(KEYS.refreshToken, refreshToken)
  localStorage.setItem(KEYS.expiresAt,    String(expiresAt))
  if (user) localStorage.setItem(KEYS.user, JSON.stringify(user))
}

export function getAccessToken()  { return typeof window !== 'undefined' ? localStorage.getItem(KEYS.accessToken)  ?? null : null }
export function getRefreshToken() { return typeof window !== 'undefined' ? localStorage.getItem(KEYS.refreshToken) ?? null : null }
export function getStoredUser()   {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(KEYS.user) ?? 'null') } catch { return null }
}

export function isTokenExpired() {
  if (typeof window === 'undefined') return true
  const expiresAt = Number(localStorage.getItem(KEYS.expiresAt) ?? 0)
  return Date.now() > expiresAt - 30_000 // 30-second buffer
}

export function isLoggedIn() {
  return !!getRefreshToken() // refresh token is the source of truth
}

export function clearAuthTokens() {
  if (typeof window === 'undefined') return
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}

// ── Auto-refresh ──────────────────────────────────────────────────────────────
// Singleton promise to prevent concurrent refresh races

let _refreshPromise = null

export async function refreshAccessToken() {
  if (_refreshPromise) return _refreshPromise

  _refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) throw new Error('No refresh token')

    const apiBase = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? ''
    const res = await fetch(`${apiBase}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!res.ok) {
      clearAuthTokens()
      throw new Error('Session expired — please log in again')
    }

    const data = await res.json()
    saveAuthTokens({
      accessToken:  data.accessToken,
      refreshToken, // reuse existing refresh token
      expiresIn:    data.expiresIn ?? 900,
    })
    return data.accessToken
  })()

  try {
    return await _refreshPromise
  } finally {
    _refreshPromise = null
  }
}

// ── Fetch with auto-refresh ───────────────────────────────────────────────────

export async function authFetch(url, options = {}) {
  // Refresh proactively if token is close to expiry
  if (isTokenExpired() && getRefreshToken()) {
    await refreshAccessToken().catch(() => {})
  }

  let token = getAccessToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  let res = await fetch(url, { ...options, headers })

  // If 401, try once to refresh and retry
  if (res.status === 401 && getRefreshToken()) {
    try {
      token = await refreshAccessToken()
      headers.Authorization = `Bearer ${token}`
      res = await fetch(url, { ...options, headers })
    } catch {
      // refresh failed — return original 401
    }
  }

  return res
}
