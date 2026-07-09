import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getActiveProvider, setActiveProvider, getProviderStatus, PROVIDERS } from '@/lib/storageConfig'
import { ensureFolder } from '@/lib/storage'

function readJson(name, fallbackKey) {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), 'data', name), 'utf8'))[fallbackKey] ?? []
  } catch {
    return []
  }
}

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
// whichever provider is currently active. Shallowest paths first so a company root
// always exists before its user subfolders are created — doing this concurrently
// races parent vs. child creation.
async function provisionAll() {
  const companies = readJson('company.json', 'companies')
  const users = readJson('users.json', 'users')
  const paths = collectRootPaths(companies, users)
    .sort((a, b) => a.split('/').length - b.split('/').length)

  let created = 0
  let failed = 0
  for (const p of paths) {
    try {
      await ensureFolder(p)
      created += 1
    } catch {
      failed += 1
    }
  }

  return { total: paths.length, created, failed, paths }
}

export async function GET() {
  return NextResponse.json({ active: getActiveProvider(), providers: getProviderStatus() })
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'switch') {
      const { provider } = body
      if (!PROVIDERS.includes(provider)) {
        return NextResponse.json({ error: `Unknown storage provider "${provider}"` }, { status: 400 })
      }
      const status = getProviderStatus()
      if (!status[provider]?.configured) {
        return NextResponse.json(
          { error: `${status[provider]?.label ?? provider} is not configured yet — add its credentials to .env.local first.` },
          { status: 400 }
        )
      }
      setActiveProvider(provider)

      // Fire-and-forget: make sure every company/user folder exists on the newly
      // active provider without making the caller wait for the whole sweep.
      provisionAll().catch(err => console.error('Background provisioning after switch failed:', err))

      return NextResponse.json({ active: provider, providers: getProviderStatus() })
    }

    if (action === 'provision-all') {
      const result = await provisionAll()
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
