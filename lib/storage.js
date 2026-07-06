import { Dropbox } from 'dropbox'
import { getServerDropboxToken } from './dropboxToken'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// 429 and 5xx are transient — safe to retry. 4xx (except 429) are permanent failures.
function isRetryable(err) {
  const status = err?.status
  if (typeof status === 'number') return status === 429 || status >= 500
  return true // no HTTP status = network/connection error
}

// Exponential backoff with jitter: 700ms, ~1400ms, ~2800ms between attempts
async function withRetry(fn, maxAttempts = 3, baseMs = 700) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt === maxAttempts || !isRetryable(err)) throw err
      await sleep(baseMs * 2 ** (attempt - 1) + Math.random() * 300)
    }
  }
}

// Token resolution order:
//  1. `token` param explicitly passed (from X-Dropbox-Token request header)
//  2. DROPBOX_REFRESH_TOKEN auto-refreshed via Dropbox OAuth (server env)
async function getDbx(token) {
  const accessToken = token || await getServerDropboxToken()
  if (!accessToken) throw new Error('No Dropbox access token. Set one in Settings.')
  return new Dropbox({ accessToken, fetch: fetch.bind(globalThis) })
}

export async function listFolder(path, token) {
  const dbx = await getDbx(token)
  const res = await dbx.filesListFolder({ path: path || '' })
  const folders = res.result.entries.filter(e => e['.tag'] === 'folder').map(normalizeFolder)
  const files   = res.result.entries.filter(e => e['.tag'] === 'file').map(normalizeFile)
  return { folders, files }
}

export async function uploadFile(folderPath, filename, buffer, token) {
  const dbx  = await getDbx(token)
  const path = `${folderPath}/${filename}`.replace(/\/\//g, '/')
  const res  = await withRetry(() =>
    dbx.filesUpload({ path, contents: buffer, mode: 'add', autorename: true })
  )
  const url  = await withRetry(() => getSharedLink(res.result.path_display, token))
  return normalizeFile({ ...res.result, url })
}

export async function deleteItems(paths, token) {
  const dbx = await getDbx(token)
  await Promise.all(paths.map(p => dbx.filesDeleteV2({ path: p })))
}

export async function moveItem(fromPath, toPath, token) {
  const dbx = await getDbx(token)
  await dbx.filesMoveV2({ from_path: fromPath, to_path: toPath, autorename: true })
}

export async function copyItem(fromPath, toPath, token) {
  const dbx = await getDbx(token)
  await dbx.filesCopyV2({ from_path: fromPath, to_path: toPath, autorename: true })
}

export async function createFolder(path, token) {
  const dbx = await getDbx(token)
  await dbx.filesCreateFolderV2({ path, autorename: true })
}

export async function ensureFolder(path, token) {
  const dbx = await getDbx(token)
  try {
    await dbx.filesCreateFolderV2({ path, autorename: false })
  } catch {
    // Folder already exists or non-fatal — proceed silently
  }
}

// Convert Dropbox sharing-page URL → direct CDN URL (no redirect, permanent)
function toDirectUrl(url) {
  return url
    .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
    .replace('?dl=0', '')
    .replace('&dl=0', '')
}

// format: 'original' (default) → direct CDN URL, no redirect, permanent
//         'dropbox'            → raw dropbox.com share-page URL (rlkey, dl=0)
export async function getSharedLink(path, token, format = 'original') {
  const dbx = await getDbx(token)
  const toResult = (url) => format === 'dropbox' ? url : toDirectUrl(url)
  try {
    const res = await dbx.sharingCreateSharedLinkWithSettings({
      path,
      settings: { requested_visibility: { '.tag': 'public' } },
    })
    return toResult(res.result.url)
  } catch (e) {
    if (e?.error?.error?.['.tag'] === 'shared_link_already_exists') {
      const existing = await dbx.sharingListSharedLinks({ path, direct_only: true })
      const url = existing.result.links[0]?.url ?? ''
      return toResult(url)
    }
    throw e
  }
}
export async function getThumbnail(path, token) {
  const dbx = await getDbx(token);

  const res = await dbx.filesGetThumbnailV2({
    resource: { '.tag': 'path', path },
    format: { '.tag': 'jpeg' },
    size: { '.tag': 'w256h256' },
  });

  // 1. If running in a pure Node.js environment, this will be present
  if (res.result.fileBinary) {
    return res.result.fileBinary;
  } 
  
  // 2. If running in Edge runtime / Web standard environments, this will be present instead
  if (res.result.fileBlob) {
    const arrayBuffer = await res.result.fileBlob.arrayBuffer();
    return Buffer.from(arrayBuffer); // Convert to buffer so your route handler can read it seamlessly
  }

  throw new Error("Dropbox API did not return any image data assets.");
}

function normalizeFolder(e) {
  return { tag: 'folder', name: e.name, path: e.path_display, id: e.id }
}

function normalizeFile(e) {
  return {
    tag: 'file',
    name: e.name,
    path: e.path_display,
    id: e.id,
    size: e.size,
    modified: e.server_modified,
    url: e.url ?? null,
  }
}
