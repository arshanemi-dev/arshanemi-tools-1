'use client'

import { authFetch, isLoggedIn } from '@/lib/tokenStore'

const API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? ''

// ── Dummy fallback data ───────────────────────────────────────────────────────

export const DUMMY_THEME = {
  mode: 'dark',
  accent: '#4f46e5',
  accentLight: '#818cf8',
  background: '#0a0a0a',
  surface: '#111111',
  card: '#161616',
}

export const DUMMY_USER = {
  id: 'demo-user',
  name: 'Demo User',
  email: 'demo@example.com',
  role: 'admin',
  avatar: null,
}

export const DUMMY_SUBSCRIPTION = {
  status: 'inactive',
  plan: null,
  planId: null,
  currentPeriodEnd: null,
}

// ── Generic fetcher ───────────────────────────────────────────────────────────

async function apiFetch(endpoint) {
  if (!isLoggedIn()) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:require'))
    }
    return null
  }
  if (!API_BASE) return null
  try {
    const res = await authFetch(`${API_BASE}${endpoint}`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// ── Public fetchers ───────────────────────────────────────────────────────────

export async function fetchTheme() {
  const data = await apiFetch('/api/admin/theme')
  return data ?? DUMMY_THEME
}

export async function fetchUser() {
  const data = await apiFetch('/api/admin/user')
  return data ?? DUMMY_USER
}

export async function fetchSubscription() {
  const data = await apiFetch('/api/admin/subscription')
  return data ?? DUMMY_SUBSCRIPTION
}
