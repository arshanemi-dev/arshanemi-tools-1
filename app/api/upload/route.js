import { NextResponse } from 'next/server'
import { uploadFile } from '@/lib/storage'

export async function POST(request) {
  try {
    const token    = request.headers.get('X-Dropbox-Token') || null
    const formData = await request.formData()
    const folderPath = formData.get('folderPath') ?? ''
    const files    = formData.getAll('files')

    const uploaded = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        return uploadFile(folderPath, file.name, buffer, token)
      })
    )

    return NextResponse.json({ uploaded })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
