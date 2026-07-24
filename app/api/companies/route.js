import { NextResponse } from 'next/server'
import { readBlobJson, writeBlobJson } from '@/lib/blobStore'

function readStore() {
  return readBlobJson('company', { companies: [] })
}
function writeStore(data) {
  return writeBlobJson('company', data)
}

function genId(prefix = 'co') {
  return prefix + '_' + Math.random().toString(36).slice(2, 10)
}

function toSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

export async function GET() {
  return NextResponse.json(await readStore())
}

export async function POST(request) {
  const body = await request.json()
  const { id, name, email, phone, website, action } = body
  const store = await readStore()

  if (action === 'update' && id) {
    const idx = store.companies.findIndex(c => c.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

    const current = store.companies[idx]
    const normEmail = email ? email.trim().toLowerCase() : current.email
    if (email && store.companies.some(c => c.id !== id && c.email === normEmail)) {
      return NextResponse.json({ error: 'A company with this email already exists' }, { status: 400 })
    }

    let folderId = current.folderId
    let slug = current.slug
    if (name !== undefined && name?.trim() !== current.name) {
      const newSlug = name?.trim() ? toSlug(name.trim()) : null
      if (newSlug && newSlug !== current.slug) {
        const collision = store.companies.some(c => c.id !== id && c.folderId === newSlug)
        folderId = collision ? `${newSlug}_${genId('').slice(0, 4)}` : newSlug
        slug = newSlug
      }
    }

    store.companies[idx] = {
      ...current,
      name: name !== undefined ? (name?.trim() || null) : current.name,
      slug,
      email: normEmail,
      phone: phone !== undefined ? (phone?.trim() || null) : current.phone,
      website: website !== undefined ? (website?.trim() || null) : current.website,
      folderId,
    }
    await writeStore(store)
    return NextResponse.json(store)
  }

  // Create
  const normalEmail = email.trim().toLowerCase()
  if (store.companies.some(c => c.email === normalEmail)) {
    return NextResponse.json({ error: 'A company with this email already exists' }, { status: 400 })
  }

  let folderId = name?.trim() ? (toSlug(name.trim()) || genId()) : genId()
  if (store.companies.some(c => c.folderId === folderId)) {
    folderId = `${folderId}_${genId('').slice(0, 4)}`
  }

  const company = {
    id: genId('co'),
    name: name?.trim() || null,
    slug: name?.trim() ? toSlug(name.trim()) : null,
    email: normalEmail,
    phone: phone?.trim() || null,
    website: website?.trim() || null,
    folderId,
    isActive: true,
    createdAt: new Date().toISOString(),
  }
  store.companies.push(company)
  await writeStore(store)
  return NextResponse.json(store)
}

export async function DELETE(request) {
  const { id } = await request.json()
  const store = await readStore()
  store.companies = store.companies.filter(c => c.id !== id)
  await writeStore(store)

  // Also update users.json to unlink this company
  const usersStore = await readBlobJson('users', { users: [] })
  usersStore.users = usersStore.users.map(u =>
    u.companyId === id ? { ...u, companyId: null } : u
  )
  await writeBlobJson('users', usersStore)

  return NextResponse.json(store)
}
