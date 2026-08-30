import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const history = await db.readingHistory.findMany({
      where: { userId: 'demo-user' },
      orderBy: { date: 'desc' },
      take: 30,
      include: { book: { select: { title: true, slug: true, subject: { select: { name: true, slug: true } } } } },
    })

    // Stats
    const booksStarted = await db.readingProgress.count({ where: { userId: 'demo-user' } })
    const booksCompleted = await db.readingProgress.count({ where: { userId: 'demo-user', isCompleted: true } })
    const totalPagesRead = await db.readingHistory.aggregate({ _sum: { pagesRead: true } })
    const totalHighlights = await db.highlight.count({ where: { userId: 'demo-user' } })
    const totalNotes = await db.bookNote.count({ where: { userId: 'demo-user' } })
    const totalBookmarks = await db.bookBookmark.count({ where: { userId: 'demo-user' } })
    const totalReadingTime = await db.readingHistory.aggregate({ _sum: { durationMin: true } })

    // Currently reading
    const currentlyReading = await db.readingProgress.findMany({
      where: { userId: 'demo-user', isCompleted: false },
      orderBy: { lastReadAt: 'desc' },
      take: 5,
      include: { book: { select: { title: true, slug: true, pageCount: true, subject: { select: { name: true, slug: true, color: true } } } } },
    })

    return NextResponse.json({
      history,
      currentlyReading,
      stats: {
        booksStarted,
        booksCompleted,
        pagesRead: totalPagesRead._sum.pagesRead ?? 0,
        highlights: totalHighlights,
        notes: totalNotes,
        bookmarks: totalBookmarks,
        readingTimeMin: totalReadingTime._sum.durationMin ?? 0,
      },
    })
  } catch (e) {
    console.error('[api/books/history] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
