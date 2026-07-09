// Server-side only.
//
// Tracks which storage backend ("dropbox" | "bunny") is currently active.
// This is app state (like company.json / users.json), not a secret — safe to commit.

import { readFileSync, writeFileSync, existsSync } from 'fs'
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

function writeConfig(config) {
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

export function getActiveProvider() {
  return readConfig().provider
}

export function setActiveProvider(provider) {
  if (!PROVIDERS.includes(provider)) {
    throw new Error(`Unknown storage provider "${provider}"`)
  }
  writeConfig({ provider })
  return provider
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
