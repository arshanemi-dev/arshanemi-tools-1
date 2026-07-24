// Local-mode data store — Vercel Blob only, no local disk writes (the Vercel
// serverless filesystem is read-only/ephemeral, so fs.writeFile doesn't
// persist in production). Each tool instance gets its own namespace folder
// (from TOOLS_NAME) so multiple tools can share one Blob store without
// colliding, e.g.
//   database/arshanemi-tools-1/users.json
//   database/arshanemi-tools-1/company.json
import { put, get } from '@vercel/blob'

const TOOLS_NAME = process.env.TOOLS_NAME || 'arshanemi-tools-1'

function toSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'arshanemi-tools-1'
}

function blobPath(key) {
  return `database/${toSlug(TOOLS_NAME)}/${key}.json`
}

// Reads via the SDK's get(), which resolves the store from
// BLOB_READ_WRITE_TOKEN — the same source put() below uses. Do not
// hand-build the blob URL from BLOB_STORE_ID: that env var is independent
// of the token and can point at a different store, silently serving
// whatever unrelated file sits at the same path there.
export async function readBlobJson(key, fallback) {
  try {
    const result = await get(blobPath(key), { access: 'public' })
    if (!result || result.statusCode !== 200) return fallback
    return JSON.parse(await new Response(result.stream).text())
  } catch {
    return fallback
  }
}

export async function writeBlobJson(key, data) {
  await put(blobPath(key), JSON.stringify(data, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
  return data
}
