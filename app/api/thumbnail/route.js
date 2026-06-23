import { NextResponse } from 'next/server'
import { getThumbnail } from '@/lib/storage'

export async function GET(request) {
  try {
    const token = request.headers.get('X-Dropbox-Token') || null
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'path is required' }, { status: 400 })
    }

    const fileBinary = await getThumbnail(path, token)
    return new Response(fileBinary, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
