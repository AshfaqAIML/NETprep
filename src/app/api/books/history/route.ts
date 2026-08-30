import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getCurrentUserId } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/books/history — Get reading history + stats for current user
 * POST /api/books/history — Create a reading history entry
 * §22 user isolation — per-user history via getCurrentUserId (falls back to demo-user if unauthenticated, no 401)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = await getCurrentUserId(session) // §22 isolation — falls back to demo-user if no session
    const history = await db.readingHistory.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30,
      include: { book: { select: { title: true, slug: true, subject: { select: { name: true, slug: true } } } } },
    })

    // Stats
    const booksStarted = await db.readingProgress.count({ where: { userId } })
    const booksCompleted = await db.readingProgress.count({ where: { userId, isCompleted: true } })
    const totalPagesRead = await db.readingHistory.aggregate({ where: { userId }, _sum: { pagesRead: true } })
    const totalHighlights = await db.highlight.count({ where: { userId } })
    const totalNotes = await db.bookNote.count({ where: { userId } })
    const totalBookmarks = await db.bookBookmark.count({ where: { userId } })
    const totalReadingTime = await db.readingHistory.aggregate({ where: { userId }, _sum: { durationMin: true } })

    // Currently reading
    const currentlyReading = await db.readingProgress.findMany({
      where: { userId, isCompleted: false },
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await getCurrentUserId(session) // §22 isolation — falls back to demo-user if no session
    const body = await req.json()
    const { bookId, durationMin, pagesRead, startPage, endPage } = body

    if (!bookId) return NextResponse.json({ error: 'bookId required' }, { status: 400 })

    const entry = await db.readingHistory.create({
      data: {
        userId,
        bookId,
        durationMin: durationMin ?? 0,
        pagesRead: pagesRead ?? 0,
        startPage: startPage ?? null,
        endPage: endPage ?? null,
      },
    })

    return NextResponse.json({ history: entry }, { status: 201 })
  } catch (e) {
    console.error('[api/books/history POST] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
