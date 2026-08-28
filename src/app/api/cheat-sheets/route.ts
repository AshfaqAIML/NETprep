import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const cheatSheets = await db.cheatSheet.findMany({
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      include: {
        subject: { select: { slug: true, name: true, color: true, icon: true } },
        topic: { select: { slug: true, name: true } },
      },
    })
    return NextResponse.json({ cheatSheets })
  } catch (e) {
    console.error('[api/cheat-sheets] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
