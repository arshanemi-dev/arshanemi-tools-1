import { NextResponse } from 'next/server'
import { getThumbnail } from '@/lib/storage'

export async function GET(request) {
  try {
    const token = request.headers.get('X-Dropbox-Token')
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 })
    }

    const fileBuffer = await getThumbnail(path, token)

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=59',
      },
    })
  } catch (err) {
    console.error('Thumbnail proxy error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
