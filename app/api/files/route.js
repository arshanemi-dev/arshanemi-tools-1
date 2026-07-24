import { NextResponse } from 'next/server'
import { listFolder, ensureFolder, deleteItems, getSharedLink } from '@/lib/storage'

function getToken(request) {
  return request.headers.get('X-Dropbox-Token') || null
}

// Per-browser storage choice — see lib/localStore.js setStorageProvider().
function getProvider(request) {
  return request.cookies.get('storage_provider')?.value || null
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const path     = searchParams.get('path') ?? ''
    const token    = getToken(request)
    const provider = getProvider(request)
    const data     = await listFolder(path, token, provider)
    return NextResponse.json(data)
  } catch (err) {
    console.log(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const token    = getToken(request)
    const provider = getProvider(request)
    const body     = await request.json()
    const { action } = body

    if (action === 'ensure-folder') {
      const { path } = body
      await ensureFolder(path, token, provider)
      return NextResponse.json({ ok: true })
    }

    if (action === 'get-urls') {
      const { paths, format } = body
      const urls = await Promise.all(paths.map(p => getSharedLink(p, token, format, provider)))
      return NextResponse.json({ urls })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const token    = getToken(request)
    const provider = getProvider(request)
    const { paths } = await request.json()
    await deleteItems(paths, token, provider)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
