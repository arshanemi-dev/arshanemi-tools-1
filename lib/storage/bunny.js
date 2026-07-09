// Bunny.net Edge Storage adapter — plain HTTP (no SDK needed).
// Docs: https://docs.bunny.net/storage/http  (AccessKey header auth)
//
// Bunny storage has no native mkdir/rename/move/copy — those are emulated below:
//  - "folder" = presence of a zero-byte `.keep` marker object at that path
//  - move/copy = download + re-upload (+ delete original for move), recursively for directories

import { getParentPath, joinPath } from '../utils'

const KEEP_FILE = '.keep'

// ── Config ───────────────────────────────────────────────────────────────────

function baseUrl() {
  const zone = process.env.BUNNY_STORAGE_ZONE
  if (!zone) throw new Error('Bunny.net is not configured. Set BUNNY_STORAGE_ZONE in .env.local.')
  const host = process.env.BUNNY_STORAGE_REGION_HOST || 'storage.bunnycdn.com'
  return `https://${host}/${zone}`
}

function accessKey() {
  const key = process.env.BUNNY_STORAGE_ACCESS_KEY
  if (!key) throw new Error('Bunny.net is not configured. Set BUNNY_STORAGE_ACCESS_KEY in .env.local.')
  return key
}

function objectUrl(path, isDir) {
  const segments = (path || '').split('/').filter(Boolean).map(encodeURIComponent)
  return `${baseUrl()}/${segments.join('/')}${isDir ? '/' : ''}`
}

function pullZoneBase() {
  const base = process.env.BUNNY_PULL_ZONE_URL
  if (!base) {
    throw new Error('BUNNY_PULL_ZONE_URL is not set — attach a Pull Zone to your storage zone and set the env var to get public URLs.')
  }
  return base.replace(/\/+$/, '')
}

function buildPublicUrlSafe(path) {
  try {
    const encoded = (path || '').split('/').filter(Boolean).map(encodeURIComponent).join('/')
    return `${pullZoneBase()}/${encoded}`
  } catch {
    return null
  }
}

const MIME_MAP = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif', heic: 'image/heic',
  mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', mkv: 'video/x-matroska',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  zip: 'application/zip',
  json: 'application/json',
  txt: 'text/plain',
  html: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
}

function guessContentType(name) {
  const ext = name?.split('.').pop()?.toLowerCase() ?? ''
  return MIME_MAP[ext] || 'application/octet-stream'
}

// ── Low-level HTTP helpers ───────────────────────────────────────────────────

async function putBuffer(path, buffer, contentType) {
  const res = await fetch(objectUrl(path, false), {
    method: 'PUT',
    headers: { AccessKey: accessKey(), 'Content-Type': contentType },
    body: buffer,
  })
  if (!res.ok) throw new Error(`Bunny upload failed for ${path}: ${await res.text()}`)
}

async function putMarker(path) {
  await putBuffer(joinPath(path, KEEP_FILE), Buffer.alloc(0), 'application/octet-stream')
}

async function tryDownloadFile(path) {
  const res = await fetch(objectUrl(path, false), { headers: { AccessKey: accessKey() } })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Bunny download failed for ${path}: ${await res.text()}`)
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function deleteOne(path) {
  let res = await fetch(objectUrl(path, false), { method: 'DELETE', headers: { AccessKey: accessKey() } })
  if (res.status === 404) {
    // Might be a directory — directories are deleted recursively by Bunny when the path ends in "/"
    res = await fetch(objectUrl(path, true), { method: 'DELETE', headers: { AccessKey: accessKey() } })
  }
  if (!res.ok && res.status !== 404) {
    throw new Error(`Bunny delete failed for ${path}: ${await res.text()}`)
  }
}

// Appends " (n)" before the extension (mirrors Dropbox's autorename output) when `name`
// already exists as a file or folder inside `parentPath`.
async function resolveUniqueName(parentPath, name) {
  const { files, folders } = await listFolder(parentPath).catch(() => ({ files: [], folders: [] }))
  const existing = new Set([...files, ...folders].map(item => item.name))
  if (!existing.has(name)) return name

  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext  = dot > 0 ? name.slice(dot) : ''

  let n = 1
  let candidate = `${base} (${n})${ext}`
  while (existing.has(candidate)) {
    n += 1
    candidate = `${base} (${n})${ext}`
  }
  return candidate
}

function normalizeFolder(obj, basePath) {
  const path = joinPath(basePath, obj.ObjectName)
  return { tag: 'folder', name: obj.ObjectName, path, id: obj.Guid ?? path }
}

function normalizeFile(obj, basePath) {
  const path = joinPath(basePath, obj.ObjectName)
  return {
    tag: 'file',
    name: obj.ObjectName,
    path,
    id: obj.Guid ?? path,
    size: obj.Length,
    modified: obj.LastChanged,
    url: buildPublicUrlSafe(path),
  }
}

// ── Public API (mirrors lib/storage/dropbox.js) ─────────────────────────────

export async function listFolder(path) {
  const res = await fetch(objectUrl(path, true), {
    headers: { AccessKey: accessKey(), Accept: 'application/json' },
    cache: 'no-store',
  })
  if (res.status === 404) throw new Error(`Path not found: ${path || '/'}`)
  if (!res.ok) throw new Error(`Bunny list failed: ${await res.text()}`)

  const objects = await res.json()
  const folders = objects.filter(o => o.IsDirectory).map(o => normalizeFolder(o, path))
  const files   = objects.filter(o => !o.IsDirectory && o.ObjectName !== KEEP_FILE).map(o => normalizeFile(o, path))
  return { folders, files }
}

export async function uploadFile(folderPath, filename, buffer) {
  const finalName = await resolveUniqueName(folderPath, filename)
  const path = joinPath(folderPath, finalName)
  await putBuffer(path, buffer, guessContentType(finalName))
  return {
    tag: 'file',
    name: finalName,
    path,
    id: path,
    size: buffer.length,
    modified: new Date().toISOString(),
    url: buildPublicUrlSafe(path),
  }
}

export async function deleteItems(paths) {
  await Promise.all(paths.map(p => deleteOne(p)))
}

// No native move/rename — download then re-upload at the new path, then remove the original.
export async function moveItem(fromPath, toPath) {
  await copyRecursive(fromPath, toPath)
  await deleteItems([fromPath])
}

// No native copy — download then re-upload at the new path.
export async function copyItem(fromPath, toPath) {
  await copyRecursive(fromPath, toPath)
}

async function copyRecursive(fromPath, toPath) {
  const buffer = await tryDownloadFile(fromPath)
  if (buffer) {
    await putBuffer(toPath, buffer, guessContentType(toPath))
    return
  }

  // Not a file — treat as a directory and recurse.
  const { folders, files } = await listFolder(fromPath).catch(() => ({ folders: [], files: [] }))
  await putMarker(toPath)
  await Promise.all(files.map(async f => {
    const fileBuffer = await tryDownloadFile(f.path)
    if (fileBuffer) await putBuffer(joinPath(toPath, f.name), fileBuffer, guessContentType(f.name))
  }))
  for (const folder of folders) {
    await copyRecursive(folder.path, joinPath(toPath, folder.name))
  }
}

// Explicit "new folder" action — autorenames on name collision, mirroring Dropbox's createFolder.
export async function createFolder(path) {
  const parent = getParentPath(path)
  const name = path.split('/').filter(Boolean).pop()
  const uniqueName = await resolveUniqueName(parent, name)
  await putMarker(joinPath(parent, uniqueName))
}

// Idempotent "make sure this exact path exists" — used by the auto-provisioning flow.
export async function ensureFolder(path) {
  try {
    await putMarker(path)
  } catch {
    // Non-fatal — folder may already exist, or the provider is briefly unreachable.
  }
}

export async function getSharedLink(path) {
  const encoded = (path || '').split('/').filter(Boolean).map(encodeURIComponent).join('/')
  return `${pullZoneBase()}/${encoded}`
}

export async function getThumbnail(path) {
  const url = await getSharedLink(path)
  const res = await fetch(`${url}?width=256&height=256&aspect_ratio=1:1`)
  if (!res.ok) throw new Error(`Bunny thumbnail fetch failed: ${await res.text()}`)
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
