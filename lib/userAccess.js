'use client'

import { getCompanyById } from '@/lib/localStore'

// ── Root path ─────────────────────────────────────────────────────────────────

const ROOT_KEY = 'lt_user_root_path'

export function getUserRootPath() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(ROOT_KEY) ?? ''
}

export function setUserRootPath(path) {
  if (typeof window === 'undefined') return
  if (path) localStorage.setItem(ROOT_KEY, path)
  else localStorage.removeItem(ROOT_KEY)
}

export function clearUserRootPath() {
  if (typeof window !== 'undefined') localStorage.removeItem(ROOT_KEY)
}

// ── Folder name helpers ───────────────────────────────────────────────────────

export function buildUserFolderName(user) {
  const slug = (user.name ?? 'user')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/, '')
    .slice(0, 24)
  return `${slug}_${user.id}`
}

// Returns the full Dropbox root path for a user.
// Structure: /tools/<company.folderId>/<user_folder_name>
// Admin users with no company get an empty root (see all).
export function buildUserRootPath(user) {
  if (!user) return ''

  if (user.role === 'admin') {
    const company = getCompanyById(user.companyId)
    if (company?.folderId) {
      return `/tools/${company.folderId}`
    }
  }

  const userFolder = buildUserFolderName(user)

  if (user.companyId) {
    const company = getCompanyById(user.companyId)
    if (company?.folderId) {
      return `/tools/${company.folderId}/${userFolder}`
    }
  }

  // No company — fall back to a top-level personal folder
  return `/${userFolder}`
}

// ── Ensure user folder via API (client-side) ──────────────────────────────────

export async function ensureUserFolderFromClient(user) {
  if (!user) return ''

  if (user.role === 'admin') {
    clearUserRootPath()
    return ''
  }

  const rootPath = buildUserRootPath(user)

  try {
    await fetch('/api/files', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'ensure-folder', path: rootPath }),
    })
  } catch {
    // Ignore network / Dropbox errors — folder may already exist
  }

  setUserRootPath(rootPath)
  return rootPath
}
