import { readFileSync } from 'fs'

const envPath = './.env.local'
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx), l.slice(idx + 1)]
    })
)

const { Dropbox } = await import('dropbox')

async function getToken() {
  const res = await fetch('https://api.dropbox.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: env.DROPBOX_REFRESH_TOKEN,
      client_id: env.DROPBOX_APP_KEY,
      client_secret: env.DROPBOX_APP_SECRET,
    }),
  })
  if (!res.ok) throw new Error(`token refresh failed: ${await res.text()}`)
  const data = await res.json()
  return data.access_token
}

const accessToken = await getToken()
console.log('got access token, length', accessToken.length)

async function patchedFetch(...args) {
  const res = await fetch(...args)
  if (typeof res.buffer !== 'function') {
    res.buffer = () => res.arrayBuffer().then(ab => Buffer.from(ab))
  }
  return res
}

const dbx = new Dropbox({ accessToken, fetch: patchedFetch })

const list = await dbx.filesListFolder({ path: '' })
console.log('root entries:', list.result.entries.map(e => `${e['.tag']}:${e.path_display}`))

const firstImage = list.result.entries.find(e => e['.tag'] === 'file' && /\.(jpe?g|png|gif|webp)$/i.test(e.name))

async function findImageRecursive(path, depth = 0) {
  if (depth > 3) return null
  const res = await dbx.filesListFolder({ path })
  for (const e of res.result.entries) {
    if (e['.tag'] === 'file' && /\.(jpe?g|png|gif|webp)$/i.test(e.name)) return e
  }
  for (const e of res.result.entries) {
    if (e['.tag'] === 'folder') {
      const found = await findImageRecursive(e.path_display, depth + 1)
      if (found) return found
    }
  }
  return null
}

const img = firstImage ?? await findImageRecursive('')

if (!img) {
  console.log('No image file found to test thumbnail against.')
  process.exit(0)
}

console.log('Testing thumbnail for:', img.path_display)

try {
  const res = await dbx.filesGetThumbnailV2({
    resource: { '.tag': 'path', path: img.path_display },
    format: { '.tag': 'jpeg' },
    size: { '.tag': 'w256h256' },
  })
  console.log('SUCCESS. Keys on result:', Object.keys(res.result))
  console.log('fileBinary present:', !!res.result.fileBinary)
  console.log('fileBlob present:', !!res.result.fileBlob)
} catch (err) {
  console.log('ERROR calling filesGetThumbnailV2:')
  console.log('name:', err?.name)
  console.log('message:', err?.message)
  console.log('status:', err?.status)
  console.log('error field:', JSON.stringify(err?.error, null, 2))
  console.log('own keys:', Object.keys(err))
  console.log('stack:', err?.stack)
}
