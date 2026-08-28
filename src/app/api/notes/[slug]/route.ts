import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const note = await db.note.findUnique({
      where: { slug },
      include: {
        subject: true,
        topic: { include: { unit: { include: { subject: true } } } },
      },
    })
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

    // increment views
    await db.note.update({
      where: { id: note.id },
      data: { views: { increment: 1 } },
    })

    // related: other notes in same subject
    const related = note.subjectId
      ? await db.note.findMany({
          where: { subjectId: note.subjectId, id: { not: note.id } },
          take: 4,
          orderBy: { views: 'desc' },
        })
      : []

    return NextResponse.json({ note, related })
  } catch (e) {
    console.error('[api/notes/[slug]] error', e)
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 })
  }
}
