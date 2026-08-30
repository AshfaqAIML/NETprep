import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getCurrentUserId } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/books/progress?bookId=xxx — Get reading progress for a book
 * PUT /api/books/progress — Update reading progress
 * §22 user isolation — per-user progress via getCurrentUserId (falls back to demo-user if unauthenticated, no 401)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await getCurrentUserId(session) // §22 isolation — falls back to demo-user if no session
    const { searchParams } = new URL(req.url)
    const bookId = searchParams.get('bookId')

    if (bookId) {
      const progress = await db.readingProgress.findUnique({
        where: { userId_bookId: { userId, bookId } },
      })
      return NextResponse.json({ progress })
    }

    // All progress for user
    const allProgress = await db.readingProgress.findMany({
      where: { userId },
      orderBy: { lastReadAt: 'desc' },
    })
    return NextResponse.json({ progress: allProgress })
  } catch (e) {
    console.error('[api/books/progress GET] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await getCurrentUserId(session) // §22 isolation — falls back to demo-user if no session
    const body = await req.json()
    const { bookId, currentPage, totalPages, scrollPosition, completionPct } = body

    if (!bookId) return NextResponse.json({ error: 'bookId required' }, { status: 400 })

    const progress = await db.readingProgress.upsert({
      where: { userId_bookId: { userId, bookId } },
      update: {
        currentPage: currentPage ?? undefined,
        totalPages: totalPages ?? undefined,
        scrollPosition: scrollPosition ?? undefined,
        completionPct: completionPct ?? undefined,
        isCompleted: completionPct >= 100,
        lastReadAt: new Date(),
      },
      create: {
        userId,
        bookId,
        currentPage: currentPage ?? 1,
        totalPages: totalPages ?? null,
        scrollPosition: scrollPosition ?? 0,
        completionPct: completionPct ?? 0,
      },
    })

    return NextResponse.json({ progress })
  } catch (e) {
    console.error('[api/books/progress PUT] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
