import { NextResponse } from 'next/server'
import { getThumbnail } from '@/lib/storage'

export async function GET(request) {
  try {
    const token = request.headers.get('X-Dropbox-Token');
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 });
    }

    const activeToken = process.env.DROPBOX_ACCESS_TOKEN || token;
    if (!activeToken) {
      return NextResponse.json({ error: 'Missing Dropbox Token' }, { status: 401 });
    }

    // 1. Call the Dropbox API directly via native Next.js fetch
    const response = await fetch('https://content.dropboxapi.com/2/files/get_thumbnail_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${activeToken}`,
        // Dropbox expects arguments passed through this custom header
        'Dropbox-API-Arg': JSON.stringify({
          resource: { '.tag': 'path', path: path },
          format: { '.tag': 'jpeg' },
          size: { '.tag': 'w256h256' }
        })
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dropbox API error: ${errorText}`);
    }

    // 2. Get the raw binary data cleanly using standard web API methods
    const arrayBuffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=59',
      },
    });

  } catch (err) {
    console.error("Dropbox proxy error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
