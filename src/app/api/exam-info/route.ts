import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const infos = await db.examInfo.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ examInfo: infos })
  } catch (e) {
    console.error('[api/exam-info] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
