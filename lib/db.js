// Folder metadata — static fallback only (no database required).
// The data/stored.js file is the single source of truth for folder metadata.
export async function getAllFolderMeta() {
  const { stored } = await import('@/data/stored')
  return stored
}
