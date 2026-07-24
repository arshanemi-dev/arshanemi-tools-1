/**
 * Seeds this tool's local-mode Vercel Blob namespace
 * (database/<TOOLS_NAME>/<key>.json) from the default JSON files checked
 * into data/. Always OVERWRITES whatever is currently in Blob for these
 * keys — this is a reset-to-defaults script, not a merge.
 *
 * Refuses to run when NEXT_PUBLIC_IS_CONNECT=true: in connected mode this
 * tool reads/writes users, companies, etc. through the admin panel API
 * instead of local Blob storage (see app/api/*\/route.js), so seeding Blob
 * here would write data nothing reads.
 *
 * Run: node scripts/seed.mjs   (auto-loads .env.local / .env / .env.example)
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { writeBlobJson } from '../lib/blobStore.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// Auto-load .env.local → .env → .env.example (first file found wins) —
// mirrors scripts/get-dropbox-refresh-token.mjs in this same folder.
function loadEnvFile() {
  const candidates = ['.env.local', '.env', '.env.example']
  for (const name of candidates) {
    const filePath = resolve(root, name)
    if (!existsSync(filePath)) continue
    const lines = readFileSync(filePath, 'utf-8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      if (key && !(key in process.env)) process.env[key] = val
    }
    console.log(`Loaded env from ${name}`)
    break
  }
}

loadEnvFile()

// key   → Blob key written by lib/blobStore.js (database/<TOOLS_NAME>/<key>.json)
// file  → default data checked into data/, relative to the app root
const SEEDS = [
  { key: 'users', file: 'data/users.json' },
  { key: 'company', file: 'data/company.json' },
  { key: 'files-expiry', file: 'data/files-expiry.json' },
]

async function main() {
  const isConnect = process.env.NEXT_PUBLIC_IS_CONNECT === 'true'
  if (isConnect) {
    console.error('❌ Refusing to seed: NEXT_PUBLIC_IS_CONNECT=true in this env file.')
    console.error('   This tool is wired to the admin panel API in connected mode, not local')
    console.error('   Blob storage — seeding here would overwrite Blob data nothing reads.')
    console.error('   Set NEXT_PUBLIC_IS_CONNECT=false (or remove it) to seed local-mode defaults.')
    process.exit(1)
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN is not set — cannot write to Vercel Blob.')
    process.exit(1)
  }

  const toolsName = process.env.TOOLS_NAME || 'arshanemi-tools-1'
  console.log(`Seeding Vercel Blob namespace: database/${toolsName}/\n`)

  let failed = false
  for (const { key, file } of SEEDS) {
    const filePath = join(root, file)
    if (!existsSync(filePath)) {
      console.warn(`  ⚠ skip ${key} — ${file} not found`)
      continue
    }
    try {
      const data = JSON.parse(readFileSync(filePath, 'utf-8'))
      await writeBlobJson(key, data)
      const count = Array.isArray(data) ? data.length : Object.values(data)[0]?.length ?? 'n/a'
      console.log(`  ✓ ${key} (${file}, ${count} item(s))`)
    } catch (err) {
      failed = true
      console.error(`  ✗ ${key} (${file}) — ${err.message}`)
    }
  }

  if (failed) process.exit(1)
  console.log('\nDone.')
}

main()
