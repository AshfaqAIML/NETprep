import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const subjectId = searchParams.get('subjectId')
    const topicId = searchParams.get('topicId')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') ?? '50', 10)

    const where: any = {}
    if (subjectId) where.subjectId = subjectId
    if (topicId) where.topicId = topicId
    if (featured === 'true') where.featured = true

    const notes = await db.note.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        subject: { select: { id: true, name: true, slug: true, color: true, icon: true } },
        topic: { select: { id: true, name: true, slug: true } },
      },
    })

    return NextResponse.json({ notes })
  } catch (e) {
    console.error('[api/notes] error', e)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}
