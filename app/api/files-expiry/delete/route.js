import { NextResponse } from 'next/server'
import { deleteManyLocal } from '@/lib/filesExpiryStore'

const IS_CONNECT = process.env.NEXT_PUBLIC_IS_CONNECT === 'true'
const ADMIN_URL  = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? ''
const API_TOKEN  = process.env.ADMIN_API_TOKEN ?? ''

export async function POST(req) {
  try {
    const { ids } = await req.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }

    if (IS_CONNECT) {
      const res = await fetch(`${ADMIN_URL}/api/admin/files-expiry/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_TOKEN}` },
        body: JSON.stringify({ ids }),
      })
      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    }

    await deleteManyLocal(ids)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
