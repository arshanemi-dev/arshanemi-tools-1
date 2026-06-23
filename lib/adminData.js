'use client'

import { authFetch, isLoggedIn } from '@/lib/tokenStore'

const API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? ''

// ── Dummy fallback data (used when not logged in or API unavailable) ──────────

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
  razorpaySubscriptionId: null,
  planDetails: null,
}

export const DUMMY_PLANS = [
  {
    id: 'plan_free',
    name: 'Free',
    description: 'Basic access. No credit card required.',
    price: 0,
    currency: 'INR',
    interval: 'monthly',
    popular: false,
    features: ['5 GB storage', 'Basic file manager', 'URL grouping'],
    razorpayPlanId: null,
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    description: 'For professionals who need more power.',
    price: 499,
    currency: 'INR',
    interval: 'monthly',
    popular: true,
    features: ['50 GB storage', 'Unlimited uploads', 'Bulk URL export', 'Priority support'],
    razorpayPlanId: null,
  },
  {
    id: 'plan_business',
    name: 'Business',
    description: 'Teams, agencies, and power users.',
    price: 1499,
    currency: 'INR',
    interval: 'monthly',
    popular: false,
    features: ['Unlimited storage', '5 team seats', 'API access', 'Custom domain'],
    razorpayPlanId: null,
  },
]

// ── Generic fetcher — resolves to data or dummy fallback, never throws ────────

async function apiFetch(endpoint) {
  if (!isLoggedIn() || !API_BASE) return null
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

export async function fetchPlans() {
  const data = await apiFetch('/api/admin/plans')
  return Array.isArray(data) ? data : DUMMY_PLANS
}

// ── Create Razorpay subscription ──────────────────────────────────────────────

export async function createSubscription(planId, totalCount = 12) {
  if (!isLoggedIn() || !API_BASE) throw new Error('Not logged in')
  const res = await authFetch(`${API_BASE}/api/admin/subscription`, {
    method: 'POST',
    body: JSON.stringify({ planId, totalCount }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error ?? 'Failed to create subscription')
  }
  return res.json()
}

// ── Cancel subscription ───────────────────────────────────────────────────────

export async function cancelSubscription(cancelAtPeriodEnd = true) {
  if (!isLoggedIn() || !API_BASE) throw new Error('Not logged in')
  const res = await authFetch(`${API_BASE}/api/admin/subscription/cancel`, {
    method: 'POST',
    body: JSON.stringify({ cancelAtPeriodEnd }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error ?? 'Failed to cancel subscription')
  }
  return res.json()
}
