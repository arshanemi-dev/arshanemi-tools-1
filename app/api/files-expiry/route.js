import { NextResponse } from 'next/server'
import { readFilesExpiry, insertManyLocal } from '@/lib/filesExpiryStore'

const IS_CONNECT = process.env.NEXT_PUBLIC_IS_CONNECT === 'true'
const ADMIN_URL  = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? ''
const API_TOKEN  = process.env.ADMIN_API_TOKEN ?? ''

function adminHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${API_TOKEN}` }
}

export async function GET() {
  try {
    if (IS_CONNECT) {
      const res = await fetch(`${ADMIN_URL}/api/admin/files-expiry`, { headers: adminHeaders() })
      const data = await res.json()
      // normalise admin shape {records:[{id,name,expiry_at,created_at}]} → local shape
      const records = (data.records ?? []).map(r => ({
        id:        r.id,
        name:      r.name,
        expiryAt:  r.expiry_at,
        createdAt: r.created_at,
      }))
      return NextResponse.json({ records })
    }
    const records = await readFilesExpiry()
    return NextResponse.json({ records })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const items = body.items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items array is required' }, { status: 400 })
    }
    for (const item of items) {
      if (!item.name || !item.expiryAt) {
        return NextResponse.json({ error: 'Each item needs name and expiryAt' }, { status: 400 })
      }
    }

    if (IS_CONNECT) {
      const res = await fetch(`${ADMIN_URL}/api/admin/files-expiry`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    }

    const inserted = await insertManyLocal(items)
    return NextResponse.json({ inserted }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
