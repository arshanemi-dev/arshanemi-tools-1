import { Dropbox } from 'dropbox'

// Token resolution order:
//  1. `token` param explicitly passed (from X-Dropbox-Token request header)
//  2. DROPBOX_ACCESS_TOKEN server env var (optional fallback)
function getDbx(token) {
  const accessToken = token || process.env.DROPBOX_ACCESS_TOKEN
  if (!accessToken) throw new Error('No Dropbox access token. Set one in Settings.')
  return new Dropbox({ accessToken })
}

export async function listFolder(path, token) {
  const dbx = getDbx(token)
  const res = await dbx.filesListFolder({ path: path || '' })
  const folders = res.result.entries.filter(e => e['.tag'] === 'folder').map(normalizeFolder)
  const files   = res.result.entries.filter(e => e['.tag'] === 'file').map(normalizeFile)
  return { folders, files }
}

export async function uploadFile(folderPath, filename, buffer, token) {
  const dbx = getDbx(token)
  const path = `${folderPath}/${filename}`.replace(/\/\//g, '/')
  const res = await dbx.filesUpload({ path, contents: buffer, mode: 'add', autorename: true })
  const url = await getSharedLink(res.result.path_display, token)
  return normalizeFile({ ...res.result, url })
}

export async function deleteItems(paths, token) {
  const dbx = getDbx(token)
  await Promise.all(paths.map(p => dbx.filesDeleteV2({ path: p })))
}

export async function moveItem(fromPath, toPath, token) {
  const dbx = getDbx(token)
  await dbx.filesMoveV2({ from_path: fromPath, to_path: toPath, autorename: true })
}

export async function copyItem(fromPath, toPath, token) {
  const dbx = getDbx(token)
  await dbx.filesCopyV2({ from_path: fromPath, to_path: toPath, autorename: true })
}

export async function createFolder(path, token) {
  const dbx = getDbx(token)
  await dbx.filesCreateFolderV2({ path, autorename: true })
}

export async function getSharedLink(path, token) {
  const dbx = getDbx(token)
  try {
    const res = await dbx.sharingCreateSharedLinkWithSettings({
      path,
      settings: { requested_visibility: { '.tag': 'public' } },
    })
    return res.result.url.replace('?dl=0', '?raw=1').replace('dl=0', 'raw=1')
  } catch (e) {
    if (e?.error?.error?.['.tag'] === 'shared_link_already_exists') {
      const existing = await dbx.sharingListSharedLinks({ path, direct_only: true })
      const url = existing.result.links[0]?.url ?? ''
      return url.replace('?dl=0', '?raw=1').replace('dl=0', 'raw=1')
    }
    throw e
  }
}

export async function getThumbnail(path, token) {
  const dbx = getDbx(token)
  const res = await dbx.filesGetThumbnailV2({
    resource: { '.tag': 'path', path },
    format: { '.tag': 'jpeg' },
    size: { '.tag': 'w256h256' },
  })
  return res.result.fileBinary
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
