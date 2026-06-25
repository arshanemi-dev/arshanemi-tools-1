import { NextResponse } from 'next/server'
import { editManyExpiryLocal } from '@/lib/filesExpiryStore'

const IS_CONNECT = process.env.NEXT_PUBLIC_IS_CONNECT === 'true'
const ADMIN_URL  = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? ''
const API_TOKEN  = process.env.ADMIN_API_TOKEN ?? ''

export async function PATCH(req) {
  try {
    const { ids, expiryAt } = await req.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }
    if (!expiryAt) {
      return NextResponse.json({ error: 'expiryAt is required' }, { status: 400 })
    }

    if (IS_CONNECT) {
      const res = await fetch(`${ADMIN_URL}/api/admin/files-expiry/bulk-expiry`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_TOKEN}` },
        body: JSON.stringify({ ids, expiryAt }),
      })
      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    }

    const updated = await editManyExpiryLocal(ids, expiryAt)
    return NextResponse.json({ updated })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
