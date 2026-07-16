// Routes every storage call to whichever provider is active for the request.
// Callers (`app/api/files`, `app/api/upload`, `app/api/thumbnail`) are unchanged —
// they still `import { listFolder, ... } from '@/lib/storage'`.
//
// `provider` (last param on every export) is the caller's per-browser choice, read
// server-side from the `storage_provider` cookie — see lib/localStore.js. When absent,
// falls back to the server's default (lib/storageConfig.js).

import { getActiveProvider } from '../storageConfig'
import * as dropbox from './dropbox'
import * as bunny from './bunny'

const ADAPTERS = { dropbox, bunny }

function adapter(provider) {
  return ADAPTERS[getActiveProvider(provider)] ?? dropbox
}

export async function listFolder(path, token, provider) {
  return adapter(provider).listFolder(path, token)
}

export async function uploadFile(folderPath, filename, buffer, token, provider) {
  return adapter(provider).uploadFile(folderPath, filename, buffer, token)
}

export async function deleteItems(paths, token, provider) {
  return adapter(provider).deleteItems(paths, token)
}

export async function moveItem(fromPath, toPath, token, provider) {
  return adapter(provider).moveItem(fromPath, toPath, token)
}

export async function copyItem(fromPath, toPath, token, provider) {
  return adapter(provider).copyItem(fromPath, toPath, token)
}

export async function createFolder(path, token, provider) {
  return adapter(provider).createFolder(path, token)
}

export async function ensureFolder(path, token, provider) {
  return adapter(provider).ensureFolder(path, token)
}

export async function getSharedLink(path, token, format = 'original', provider) {
  return adapter(provider).getSharedLink(path, token, format)
}

export async function getThumbnail(path, token, provider) {
  return adapter(provider).getThumbnail(path, token)
}
