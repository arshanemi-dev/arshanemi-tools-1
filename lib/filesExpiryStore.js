import { readBlobJson, writeBlobJson } from './blobStore'

function genId() {
  return 'fe_' + Math.random().toString(36).slice(2, 12)
}

export async function readFilesExpiry() {
  return readBlobJson('files-expiry', [])
}

export async function writeFilesExpiry(records) {
  await writeBlobJson('files-expiry', records)
}

export async function insertManyLocal(items) {
  const records = await readFilesExpiry()
  const now = new Date().toISOString()
  const inserted = []

  for (const { name, expiryAt } of items) {
    const existing = records.findIndex(r => r.name === name)
    if (existing !== -1) {
      // upsert — update expiry
      records[existing].expiryAt = expiryAt
      inserted.push(records[existing])
    } else {
      const record = { id: genId(), name, expiryAt, createdAt: now }
      records.unshift(record)
      inserted.push(record)
    }
  }

  await writeFilesExpiry(records)
  return inserted
}

export async function deleteManyLocal(ids) {
  const records = await readFilesExpiry()
  await writeFilesExpiry(records.filter(r => !ids.includes(r.id)))
}

export async function editOneLocal(id, { name, expiryAt }) {
  const records = await readFilesExpiry()
  const idx = records.findIndex(r => r.id === id)
  if (idx === -1) return null
  if (name !== undefined) records[idx].name = name
  if (expiryAt !== undefined) records[idx].expiryAt = expiryAt
  await writeFilesExpiry(records)
  return records[idx]
}

export async function editManyExpiryLocal(ids, expiryAt) {
  const records = await readFilesExpiry()
  const updated = []
  for (const r of records) {
    if (ids.includes(r.id)) {
      r.expiryAt = expiryAt
      updated.push(r)
    }
  }
  await writeFilesExpiry(records)
  return updated
}
