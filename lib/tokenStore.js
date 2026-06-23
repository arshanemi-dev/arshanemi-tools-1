'use client'

// ── Dropbox token (stored in localStorage) ──────────────────────────────────
const DROPBOX_KEY = 'dropbox_access_token'

export function getDropboxToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(DROPBOX_KEY) || null
}

export function setDropboxToken(token) {
  if (typeof window === 'undefined') return
  if (token) localStorage.setItem(DROPBOX_KEY, token)
  else localStorage.removeItem(DROPBOX_KEY)
}

export function clearDropboxToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(DROPBOX_KEY)
}

// ── Admin API token (stored in localStorage) ─────────────────────────────────
const ADMIN_KEY = 'admin_api_token'

export function getAdminToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ADMIN_KEY) || null
}

export function setAdminToken(token) {
  if (typeof window === 'undefined') return
  if (token) localStorage.setItem(ADMIN_KEY, token)
  else localStorage.removeItem(ADMIN_KEY)
}

export function clearAdminToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ADMIN_KEY)
}

// ── Fetch wrapper that auto-injects Dropbox token ────────────────────────────
export function dbxFetch(url, options = {}) {
  const token = getDropboxToken()
  const headers = { ...(options.headers ?? {}) }
  if (token) headers['X-Dropbox-Token'] = token
  return fetch(url, { ...options, headers })
}
