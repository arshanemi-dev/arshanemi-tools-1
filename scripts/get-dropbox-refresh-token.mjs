/**
 * One-time script to get a Dropbox offline refresh token.
 * Run: node scripts/get-dropbox-refresh-token.mjs
 *
 * Prerequisites:
 *   1. In Dropbox App Console → your app → Settings
 *      → OAuth 2 → Token access type → set to "Offline"
 *   2. DROPBOX_APP_KEY and DROPBOX_APP_SECRET must be in .env.local (or .env)
 */

import http from 'http'
import { exec } from 'child_process'
import { URL } from 'url'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Auto-load .env.local → .env → .env.example (first file found wins)
function loadEnvFile() {
  const candidates = ['.env.local', '.env', '.env.example']
  for (const name of candidates) {
    const filePath = resolve(process.cwd(), name)
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

const APP_KEY    = process.env.DROPBOX_APP_KEY
const APP_SECRET = process.env.DROPBOX_APP_SECRET
const PORT       = 3099
const REDIRECT   = `http://localhost:${PORT}/callback`

if (!APP_KEY || !APP_SECRET) {
  console.error('ERROR: Set DROPBOX_APP_KEY and DROPBOX_APP_SECRET in your environment first.')
  process.exit(1)
}

const authUrl =
  `https://www.dropbox.com/oauth2/authorize` +
  `?client_id=${APP_KEY}` +
  `&response_type=code` +
  `&token_access_type=offline` +
  `&redirect_uri=${encodeURIComponent(REDIRECT)}`

console.log('\nOpening Dropbox OAuth page in your browser...')
console.log('If it does not open, visit this URL manually:\n')
console.log(authUrl + '\n')

// Try to open the browser
const opener = process.platform === 'win32' ? `start "" "${authUrl}"` :
               process.platform === 'darwin' ? `open "${authUrl}"` : `xdg-open "${authUrl}"`
exec(opener)

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  if (url.pathname !== '/callback') {
    res.end('Not found')
    return
  }

  const code = url.searchParams.get('code')
  if (!code) {
    res.end('No code returned. Try again.')
    server.close()
    return
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://api.dropbox.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: APP_KEY,
      client_secret: APP_SECRET,
      redirect_uri: REDIRECT,
    }),
  })

  const data = await tokenRes.json()

  if (!tokenRes.ok || !data.refresh_token) {
    res.end(`Error: ${JSON.stringify(data)}`)
    console.error('\nFailed to get refresh token:', data)
    server.close()
    return
  }

  res.end('Success! You can close this tab and check your terminal.')
  server.close()

  console.log('\n✓ Got your Dropbox refresh token!\n')
  console.log('Add these to your .env file:\n')
  console.log(`DROPBOX_APP_KEY=${APP_KEY}`)
  console.log(`DROPBOX_APP_SECRET=${APP_SECRET}`)
  console.log(`DROPBOX_REFRESH_TOKEN=${data.refresh_token}`)
  console.log('\nThe refresh token never expires. Store it safely.\n')
})

server.listen(PORT, () => {
  console.log(`Waiting for Dropbox callback on http://localhost:${PORT}/callback ...`)
})
