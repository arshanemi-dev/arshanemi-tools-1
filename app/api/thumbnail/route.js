import { NextResponse } from 'next/server'
import { getServerDropboxToken } from '@/lib/dropboxToken'

export async function GET(request) {
  try {
    const userToken = request.headers.get('X-Dropbox-Token');
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 });
    }

    // Prefer user's explicitly configured token; fall back to server refresh token
    const activeToken = userToken || await getServerDropboxToken();

    // Call the Dropbox API directly via native Next.js fetch
    const response = await fetch('https://content.dropboxapi.com/2/files/get_thumbnail_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${activeToken}`,
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
