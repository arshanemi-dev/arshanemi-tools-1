import { NextResponse } from 'next/server'
import { listFolder, createFolder, ensureFolder, copyItem, moveItem, deleteItems, getSharedLink } from '@/lib/storage'
import { getParentPath } from '@/lib/utils'

function getToken(request) {
  return request.headers.get('X-Dropbox-Token') || null
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const path  = searchParams.get('path') ?? ''
    const token = getToken(request)
    const data  = await listFolder(path, token)
    return NextResponse.json(data)
  } catch (err) {
    console.log(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const token = getToken(request)
    const body  = await request.json()
    const { action } = body

    if (action === 'create-folder') {
      const { path, name } = body
      const fullPath = path ? `${path}/${name}` : `/${name}`
      await createFolder(fullPath, token)
      return NextResponse.json({ ok: true })
    }

    if (action === 'ensure-folder') {
      const { path } = body
      await ensureFolder(path, token)
      return NextResponse.json({ ok: true })
    }

    if (action === 'copy') {
      const { paths, destPath } = body
      await Promise.all(
        paths.map(p => {
          const filename = p.split('/').pop()
          return copyItem(p, `${destPath}/${filename}`, token)
        })
      )
      return NextResponse.json({ ok: true })
    }

    if (action === 'move') {
      const { paths, destPath } = body
      await Promise.all(
        paths.map(p => {
          const filename = p.split('/').pop()
          return moveItem(p, `${destPath}/${filename}`, token)
        })
      )
      return NextResponse.json({ ok: true })
    }

    if (action === 'get-urls') {
      const { paths } = body
      const urls = await Promise.all(paths.map(p => getSharedLink(p, token)))
      return NextResponse.json({ urls })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const token = getToken(request)
    const { paths } = await request.json()
    await deleteItems(paths, token)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const token = getToken(request)
    const { path, newName } = await request.json()
    const parent = getParentPath(path)
    const toPath = parent ? `${parent}/${newName}` : `/${newName}`
    await moveItem(path, toPath, token)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
