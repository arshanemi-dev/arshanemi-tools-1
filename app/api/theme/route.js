import { NextResponse } from 'next/server'
import { readBlobJson, writeBlobJson } from '@/lib/blobStore'

// Local-mode theme persistence — same Vercel Blob store as companies/users,
// so a saved theme survives across browsers/deployments instead of living
// only in this browser's localStorage (see context/ThemeContext.jsx, which
// still keeps a localStorage cache for an instant, flash-free first paint).
const DEFAULT_FULL_THEME = {
  mode:       'light',
  fontFamily: 'System',
  fontScale:  1.0,
  dark:  { accent: '#4f46e5', accentLight: '#818cf8', accentHover: '#4338ca', accentMuted: '#1e1b4b' },
  light: { accent: '#4f46e5', accentLight: '#6366f1', accentHover: '#4338ca', accentMuted: '#e0e7ff' },
}

export async function GET() {
  const theme = await readBlobJson('theme', DEFAULT_FULL_THEME)
  return NextResponse.json(theme)
}

export async function POST(request) {
  const theme = await request.json()
  await writeBlobJson('theme', theme)
  return NextResponse.json(theme)
}
