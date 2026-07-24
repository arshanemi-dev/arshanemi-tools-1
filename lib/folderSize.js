// Recursively sums file sizes under a folder path via the existing
// GET /api/files?path=X listing endpoint (walked one level at a time — no
// dedicated recursive-listing endpoint exists). Used before a folder delete
// to compute freed bytes for storage-usage reporting: deleteItems()/the
// DELETE response carry no size info, and nested/unexpanded subfolders were
// never loaded into any component state to begin with.
export async function sumFolderBytesRecursive(path) {
  const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`)
  if (!res.ok) return 0
  const { folders = [], files = [] } = await res.json()
  const ownBytes = files.reduce((sum, f) => sum + (f.size || 0), 0)
  const nestedBytes = await Promise.all(folders.map((f) => sumFolderBytesRecursive(f.path)))
  return ownBytes + nestedBytes.reduce((sum, b) => sum + b, 0)
}
