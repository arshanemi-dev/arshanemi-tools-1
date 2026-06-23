'use client'

import { getAdminToken } from '@/lib/tokenStore'

// Base URL of the admin panel API (set in .env.local)
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
  createdAt: new Date().toISOString(),
}

export const DUMMY_SUBSCRIPTION = {
  status: 'inactive',
  plan: null,
  planId: null,
  currentPeriodEnd: null,
  razorpaySubscriptionId: null,
}

export const DUMMY_PLANS = [
  {
    id: 'plan_free',
    name: 'Free',
    description: 'Basic access. No credit card required.',
    price: 0,
    currency: 'INR',
    interval: 'monthly',
    features: ['5 GB Dropbox storage', 'Basic file manager', 'URL grouping'],
    razorpayPlanId: null,
    popular: false,
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    description: 'For power users who need more.',
    price: 499,
    currency: 'INR',
    interval: 'monthly',
    features: ['50 GB Dropbox storage', 'Unlimited uploads', 'Priority support', 'Bulk URL export', 'Excel / JSON export'],
    razorpayPlanId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_PRO ?? 'plan_pro_id',
    popular: true,
  },
  {
    id: 'plan_business',
    name: 'Business',
    description: 'Teams and agencies.',
    price: 1499,
    currency: 'INR',
    interval: 'monthly',
    features: ['Unlimited storage', '5 team members', 'API access', 'Custom domain', 'Analytics dashboard'],
    razorpayPlanId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_BUSINESS ?? 'plan_biz_id',
    popular: false,
  },
]

// ── Generic admin API helper ──────────────────────────────────────────────────

async function adminFetch(endpoint, options = {}) {
  const token = getAdminToken()
  if (!token || !API_BASE) return null
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {}),
      },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// ── Exported fetchers (always resolve — never throw) ─────────────────────────

export async function fetchTheme() {
  const data = await adminFetch('/api/admin/theme')
  return data ?? DUMMY_THEME
}

export async function fetchUser() {
  const data = await adminFetch('/api/auth/me')
  return data ?? DUMMY_USER
}

export async function fetchSubscription() {
  const data = await adminFetch('/api/admin/subscription')
  return data ?? DUMMY_SUBSCRIPTION
}

export async function fetchPlans() {
  const data = await adminFetch('/api/admin/plans')
  return Array.isArray(data) ? data : DUMMY_PLANS
}
