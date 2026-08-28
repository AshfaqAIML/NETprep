import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const resources = await db.resource.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    })
    return NextResponse.json({ resources })
  } catch (e) {
    console.error('[api/resources] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
