import { NextResponse } from 'next/server'

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || ''

export async function POST(request) {
  const { identifier, password } = await request.json()

  if (!identifier || !password) {
    return NextResponse.json({ error: 'Identifier and password required' }, { status: 400 })
  }

  // ── Connected mode: proxy to admin panel ───────────────────────────────────
  if (ADMIN_URL) {
    try {
      const res = await fetch(`${ADMIN_URL}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ identifier, password }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        return NextResponse.json(
          { error: data.error || 'Invalid credentials' },
          { status: res.status || 401 }
        )
      }

      return NextResponse.json({
        ok:           true,
        accessToken:  data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn:    data.expiresIn ?? 900,
        user:         data.user,
      })
    } catch {
      return NextResponse.json(
        { error: 'Admin API unreachable. Check NEXT_PUBLIC_ADMIN_API_URL.' },
        { status: 503 }
      )
    }
  }

  // ── Fallback: local env credentials (no ADMIN_URL set) ────────────────────
  const validUser = process.env.ADMIN_USER || 'admin'
  const validPass = process.env.ADMIN_PASS || 'admin123'

  if (identifier === validUser && password === validPass) {
    const accessToken = Buffer.from(`${identifier}:${Date.now()}`).toString('base64')
    return NextResponse.json({
      ok:           true,
      accessToken,
      refreshToken: accessToken,
      expiresIn:    900,
      user: { id: 'local', name: identifier, email: '', role: 'admin' },
    })
  }

  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
}
