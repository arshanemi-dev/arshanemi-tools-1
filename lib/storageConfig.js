// Server-side only.
//
// Resolves which storage backend ("dropbox" | "bunny") is active for a request. The
// real switch is per-browser now — lib/localStore.js writes it to localStorage and
// mirrors it into a `storage_provider` cookie, which API routes read and pass in here
// as `override`. data/storage-config.json is only the fallback default for requests
// with no cookie yet (fresh browsers, direct API calls, background provisioning) —
// edit it directly (it's app state, not a secret — safe to commit) to change that default.

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const CONFIG_FILE = join(process.cwd(), 'data', 'storage-config.json')

export const PROVIDERS = ['dropbox', 'bunny']

export const PROVIDER_LABELS = {
  dropbox: 'Dropbox',
  bunny: 'Bunny.net',
}

function readConfig() {
  if (!existsSync(CONFIG_FILE)) return { provider: 'dropbox' }
  try {
    const parsed = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
    return PROVIDERS.includes(parsed?.provider) ? parsed : { provider: 'dropbox' }
  } catch {
    return { provider: 'dropbox' }
  }
}

export function getActiveProvider(override) {
  if (override && PROVIDERS.includes(override)) return override
  return readConfig().provider
}

// ── Configuration status ────────────────────────────────────────────────────

function isDropboxConfigured() {
  // Either a cached/refreshable token via env credentials...
  const hasEnvCreds = Boolean(
    process.env.DROPBOX_APP_KEY && process.env.DROPBOX_APP_SECRET && process.env.DROPBOX_REFRESH_TOKEN
  )
  if (hasEnvCreds) return true

  // ...or a locally-configured token cache file with real values.
  const tokenFile = join(process.cwd(), 'data', 'dropbox-tokens.json')
  if (!existsSync(tokenFile)) return false
  try {
    const { access_token } = JSON.parse(readFileSync(tokenFile, 'utf-8'))
    return Boolean(access_token)
  } catch {
    return false
  }
}

function isBunnyConfigured() {
  return Boolean(process.env.BUNNY_STORAGE_ZONE && process.env.BUNNY_STORAGE_ACCESS_KEY)
}

export function getProviderStatus() {
  return {
    dropbox: {
      label: PROVIDER_LABELS.dropbox,
      configured: isDropboxConfigured(),
    },
    bunny: {
      label: PROVIDER_LABELS.bunny,
      configured: isBunnyConfigured(),
      publicUrlConfigured: Boolean(process.env.BUNNY_PULL_ZONE_URL),
    },
  }
}
