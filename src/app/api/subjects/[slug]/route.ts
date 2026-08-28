import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const subject = await db.subject.findUnique({
      where: { slug },
      include: {
        units: {
          orderBy: { sortOrder: 'asc' },
          include: {
            topics: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        books: { orderBy: { rating: 'desc' } },
        notes: { orderBy: { createdAt: 'desc' } },
        cheatsheets: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    // Add progress per topic for demo user
    const topicIds = subject.units.flatMap((u) => u.topics.map((t) => t.id))
    const progress = await db.topicProgress.findMany({
      where: { userId: 'demo-user', topicId: { in: topicIds } },
    })
    const progressMap = new Map(progress.map((p) => [p.topicId, p]))

    const units = subject.units.map((u) => ({
      ...u,
      topics: u.topics.map((t) => ({
        ...t,
        progress: progressMap.get(t.id) ?? null,
      })),
    }))

    return NextResponse.json({ subject: { ...subject, units } })
  } catch (e) {
    console.error('[api/subjects/[slug]] error', e)
    return NextResponse.json({ error: 'Failed to fetch subject' }, { status: 500 })
  }
}
