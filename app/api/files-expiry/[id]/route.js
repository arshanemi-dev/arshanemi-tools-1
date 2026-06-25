import { NextResponse } from 'next/server'
import { editOneLocal } from '@/lib/filesExpiryStore'

const IS_CONNECT = process.env.NEXT_PUBLIC_IS_CONNECT === 'true'
const ADMIN_URL  = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? ''
const API_TOKEN  = process.env.ADMIN_API_TOKEN ?? ''

export async function PATCH(req, { params }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, expiryAt } = body

    if (!name && !expiryAt) {
      return NextResponse.json({ error: 'Provide name or expiryAt to update' }, { status: 400 })
    }

    if (IS_CONNECT) {
      const res = await fetch(`${ADMIN_URL}/api/admin/files-expiry/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_TOKEN}` },
        body: JSON.stringify({ name, expiryAt }),
      })
      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    }

    const record = await editOneLocal(id, { name, expiryAt })
    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    return NextResponse.json({ record })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
