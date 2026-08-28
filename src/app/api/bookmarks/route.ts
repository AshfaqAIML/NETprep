import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const folder = searchParams.get('folder')

    const where: any = { userId: 'demo-user' }
    if (folder) where.folder = folder

    const bookmarks = await db.bookmark.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Hydrate each bookmark with the underlying item
    const hydrated = await Promise.all(
      bookmarks.map(async (b) => {
        let item: any = null
        if (b.itemType === 'note') {
          item = await db.note.findUnique({
            where: { id: b.itemId },
            select: { id: true, slug: true, title: true, excerpt: true, tags: true, readingTime: true },
          })
        } else if (b.itemType === 'question') {
          item = await db.question.findUnique({
            where: { id: b.itemId },
            select: { id: true, questionText: true, difficulty: true, topicId: true },
          })
        } else if (b.itemType === 'cheatsheet') {
          item = await db.cheatSheet.findUnique({
            where: { id: b.itemId },
            select: { id: true, slug: true, title: true, summary: true },
          })
        } else if (b.itemType === 'book') {
          item = await db.book.findUnique({
            where: { id: b.itemId },
            select: { id: true, slug: true, title: true, author: true, rating: true },
          })
        } else if (b.itemType === 'mocktest') {
          item = await db.mockTest.findUnique({
            where: { id: b.itemId },
            select: { id: true, slug: true, title: true, durationMin: true, totalMarks: true },
          })
        }
        return { ...b, item }
      }),
    )

    return NextResponse.json({ bookmarks: hydrated })
  } catch (e) {
    console.error('[api/bookmarks] GET error', e)
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { itemType, itemId, folder = 'Favorites', note } = body

    if (!itemType || !itemId) {
      return NextResponse.json({ error: 'itemType and itemId are required' }, { status: 400 })
    }

    const existing = await db.bookmark.findUnique({
      where: {
        userId_itemType_itemId: {
          userId: 'demo-user',
          itemType,
          itemId,
        },
      },
    })

    if (existing) {
      // toggle off
      await db.bookmark.delete({ where: { id: existing.id } })
      return NextResponse.json({ bookmarked: false })
    }

    const bookmark = await db.bookmark.create({
      data: { userId: 'demo-user', itemType, itemId, folder, note },
    })
    return NextResponse.json({ bookmarked: true, bookmark })
  } catch (e) {
    console.error('[api/bookmarks] POST error', e)
    return NextResponse.json({ error: 'Failed to toggle bookmark' }, { status: 500 })
  }
}
