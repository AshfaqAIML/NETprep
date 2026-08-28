import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const mockTests = await db.mockTest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        subject: { select: { id: true, name: true, slug: true, color: true, icon: true } },
        _count: { select: { questions: true } },
      },
    })
    return NextResponse.json({ mockTests })
  } catch (e) {
    console.error('[api/mock-tests] error', e)
    return NextResponse.json({ error: 'Failed to fetch mock tests' }, { status: 500 })
  }
}
