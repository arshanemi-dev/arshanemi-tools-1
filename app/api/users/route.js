import { NextResponse } from 'next/server'
import { readBlobJson, writeBlobJson } from '@/lib/blobStore'

function readStore() {
  return readBlobJson('users', { users: [] })
}
function writeStore(data) {
  return writeBlobJson('users', data)
}

function genId(prefix = 'usr') {
  return prefix + '_' + Math.random().toString(36).slice(2, 10)
}

export async function GET() {
  return NextResponse.json(await readStore())
}

export async function POST(request) {
  const body = await request.json()
  const { id, name, email, role = 'user', companyId = null, action } = body
  const store = await readStore()

  if (action === 'update' && id) {
    store.users = store.users.map(u =>
      u.id === id
        ? { ...u, name: name.trim(), email: email.trim().toLowerCase(), role, companyId: companyId ?? u.companyId }
        : u
    )
    await writeStore(store)
    return NextResponse.json(store)
  }

  const user = {
    id: genId('usr'),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role,
    companyId,
    createdAt: new Date().toISOString(),
  }
  store.users.push(user)
  await writeStore(store)
  return NextResponse.json(store)
}

export async function DELETE(request) {
  const { id } = await request.json()
  const store = await readStore()
  store.users = store.users.filter(u => u.id !== id)
  await writeStore(store)
  return NextResponse.json(store)
}
