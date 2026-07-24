import { NextResponse } from 'next/server'
import { readBlobJson } from '@/lib/blobStore'
import { getActiveProvider, getProviderStatus, PROVIDERS } from '@/lib/storageConfig'
import { ensureFolder } from '@/lib/storage'

// Mirrors lib/userAccess.js's buildUserFolderName — kept local since that module is
// client-oriented (localStorage helpers) and this route only needs the pure slug logic.
function buildUserFolderName(user) {
  const slug = (user.name ?? 'user')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/, '')
    .slice(0, 24)
  return `${slug}_${user.id}`
}

function collectRootPaths(companies, users) {
  const paths = new Set()

  for (const company of companies) {
    if (company.folderId) paths.add(`/tools/${company.folderId}`)
  }

  for (const user of users) {
    if (user.role === 'admin') continue // admins share their company root, already added above
    const folder = buildUserFolderName(user)
    const company = user.companyId ? companies.find(c => c.id === user.companyId) : null
    paths.add(company?.folderId ? `/tools/${company.folderId}/${folder}` : `/${folder}`)
  }

  return [...paths]
}

// Ensures every company root (admin-wise) and every user root (user-wise) exists on
// the given provider. Shallowest paths first so a company root always exists before
// its user subfolders are created — doing this concurrently races parent vs. child creation.
async function provisionAll(provider) {
  const { companies = [] } = await readBlobJson('company', { companies: [] })
  const { users = [] } = await readBlobJson('users', { users: [] })
  const paths = collectRootPaths(companies, users)
    .sort((a, b) => a.split('/').length - b.split('/').length)

  let created = 0
  let failed = 0
  for (const p of paths) {
    try {
      await ensureFolder(p, null, provider)
      created += 1
    } catch {
      failed += 1
    }
  }

  return { total: paths.length, created, failed, paths }
}

// `default` is only a fallback for browsers that haven't picked a provider yet —
// the active choice otherwise lives client-side (see lib/localStore.js).
export async function GET() {
  return NextResponse.json({ default: getActiveProvider(), providers: getProviderStatus() })
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { action } = body
    const cookieProvider = request.cookies.get('storage_provider')?.value || null

    if (action === 'provision-all') {
      const provider = PROVIDERS.includes(body.provider) ? body.provider : cookieProvider
      const status = getProviderStatus()
      if (!provider || !status[provider]?.configured) {
        return NextResponse.json(
          { error: `${status[provider]?.label ?? provider ?? 'This provider'} is not configured yet — add its credentials to .env.local first.` },
          { status: 400 }
        )
      }
      const result = await provisionAll(provider)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
