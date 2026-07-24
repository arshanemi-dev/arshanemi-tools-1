'use client'

/**
 * User & Company storage — always server-side JSON files via API.
 * data/users.json   ← all users
 * data/company.json ← all companies
 *
 * Active-user selection is still per-browser (localStorage only).
 */

import {
  setActiveUserId as lsSetActiveUserId,
  getActiveUserId as lsGetActiveUserId,
} from './localStore'

// ── Shared fetch helper ────────────────────────────────────────────────────────

async function apiFetch(url, options = {}) {
  const res  = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// ── Users ──────────────────────────────────────────────────────────────────────

export async function getUsers() {
  const data = await apiFetch('/api/users')
  return data.users || []
}

export async function addUser(userData) {
  return apiFetch('/api/users', {
    method: 'POST',
    body:   JSON.stringify(userData),
  })
}

export async function updateUser(id, userData) {
  return apiFetch('/api/users', {
    method: 'POST',
    body:   JSON.stringify({ id, ...userData, action: 'update' }),
  })
}

export async function deleteUser(id) {
  return apiFetch('/api/users', {
    method: 'DELETE',
    body:   JSON.stringify({ id }),
  })
}

// Active user is per-browser session (localStorage only)
export function getActiveUserId() { return lsGetActiveUserId() }
export function setActiveUserId(id) { return lsSetActiveUserId(id) }

// No active user chosen yet (fresh browser — nothing in localStorage) or the
// stored id no longer exists (its user was deleted) — fall back to an admin
// if there is one, else the first user, rather than returning null and
// leaving the app looking logged-out/empty despite users.json having a
// perfectly good seeded user in it. Persists the fallback so it stays picked
// on the next load, and so useAuthGate's IS_CONNECT=false branch (which
// hard-blocks the file browser when getActiveUser() is null) doesn't get
// stuck behind a manual "set active" step nobody's told to do.
export function getActiveUser(users = []) {
  const id = lsGetActiveUserId()
  let user = id ? (users.find(u => u.id === id) ?? null) : null

  if (!user && users.length > 0) {
    user = users.find(u => u.role === 'admin') ?? users[0]
    lsSetActiveUserId(user.id)
  }

  return user
}

// ── Companies ──────────────────────────────────────────────────────────────────

export async function getCompanies() {
  const data = await apiFetch('/api/companies')
  return data.companies || []
}

export async function addCompany(companyData) {
  return apiFetch('/api/companies', {
    method: 'POST',
    body:   JSON.stringify(companyData),
  })
}

export async function updateCompany(id, companyData) {
  return apiFetch('/api/companies', {
    method: 'POST',
    body:   JSON.stringify({ id, ...companyData, action: 'update' }),
  })
}

export async function deleteCompany(id) {
  return apiFetch('/api/companies', {
    method: 'DELETE',
    body:   JSON.stringify({ id }),
  })
}

// ── Theme ──────────────────────────────────────────────────────────────────────

export async function getFullTheme() {
  return apiFetch('/api/theme')
}

export async function saveFullTheme(theme) {
  return apiFetch('/api/theme', {
    method: 'POST',
    body:   JSON.stringify(theme),
  })
}
