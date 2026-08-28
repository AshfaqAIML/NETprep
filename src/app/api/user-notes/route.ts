import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const notes = await db.userNote.findMany({
      where: { userId: 'demo-user' },
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
    })
    return NextResponse.json({ notes })
  } catch (e) {
    console.error('[api/user-notes] GET error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, content = '', tags = '', subjectId, topicId, color = 'default', pinned = false } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const note = await db.userNote.create({
      data: {
        userId: 'demo-user',
        title: title.trim(),
        content,
        tags,
        subjectId: subjectId || null,
        topicId: topicId || null,
        color,
        pinned,
      },
    })
    return NextResponse.json({ note })
  } catch (e) {
    console.error('[api/user-notes] POST error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const note = await db.userNote.update({
      where: { id },
      data: rest,
    })
    return NextResponse.json({ note })
  } catch (e) {
    console.error('[api/user-notes] PATCH error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
