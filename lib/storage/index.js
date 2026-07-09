// Routes every storage call to whichever provider is currently active.
// Callers (`app/api/files`, `app/api/upload`, `app/api/thumbnail`) are unchanged —
// they still `import { listFolder, ... } from '@/lib/storage'`.

import { getActiveProvider } from '../storageConfig'
import * as dropbox from './dropbox'
import * as bunny from './bunny'

const ADAPTERS = { dropbox, bunny }

function adapter() {
  return ADAPTERS[getActiveProvider()] ?? dropbox
}

export async function listFolder(path, token) {
  return adapter().listFolder(path, token)
}

export async function uploadFile(folderPath, filename, buffer, token) {
  return adapter().uploadFile(folderPath, filename, buffer, token)
}

export async function deleteItems(paths, token) {
  return adapter().deleteItems(paths, token)
}

export async function moveItem(fromPath, toPath, token) {
  return adapter().moveItem(fromPath, toPath, token)
}

export async function copyItem(fromPath, toPath, token) {
  return adapter().copyItem(fromPath, toPath, token)
}

export async function createFolder(path, token) {
  return adapter().createFolder(path, token)
}

export async function ensureFolder(path, token) {
  return adapter().ensureFolder(path, token)
}

export async function getSharedLink(path, token, format = 'original') {
  return adapter().getSharedLink(path, token, format)
}

export async function getThumbnail(path, token) {
  return adapter().getThumbnail(path, token)
}
