import { NextResponse } from 'next/server'
import { sortUrls, groupLinks, toExcelTSV, toJSON } from '@/lib/groupLinks'

export async function POST(request) {
  try {
    const { items, groupSize = 3, sortBy = 'name-asc' } = await request.json()

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items array is required' }, { status: 400 })
    }

    const sorted = sortUrls(items, sortBy)
    const groups = groupLinks(sorted, groupSize)
    const tsv    = toExcelTSV(groups)
    const json   = toJSON(groups)

    return NextResponse.json({
      groups,
      tsv,
      json,
      total: items.length,
      groupCount: groups.length,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
