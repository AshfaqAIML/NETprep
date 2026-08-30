import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getCurrentUserId } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/books/bookmarks?bookId=xxx — Get bookmarks for a book
 * POST /api/books/bookmarks — Create a bookmark
 * §22 user isolation — bookmarks are per-user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await getCurrentUserId(session) // §22 isolation — falls back to demo-user if no session
    const { searchParams } = new URL(req.url)
    const bookId = searchParams.get('bookId')

    const where: any = { userId }
    if (bookId) where.bookId = bookId

    const bookmarks = await db.bookBookmark.findMany({
      where,
      orderBy: { pageNumber: 'asc' },
      include: { book: { select: { title: true, slug: true, subject: { select: { name: true, slug: true } } } } },
    })
    return NextResponse.json({ bookmarks, count: bookmarks.length })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await getCurrentUserId(session) // §22 isolation — falls back to demo-user if no session
    const body = await req.json()
    const { bookId, pageNumber, title, label } = body

    if (!bookId || !pageNumber) {
      return NextResponse.json({ error: 'bookId and pageNumber required' }, { status: 400 })
    }

    const bookmark = await db.bookBookmark.create({
      data: {
        userId,
        bookId,
        pageNumber,
        title: title ?? `Page ${pageNumber}`,
        label: label ?? null,
      },
    })
    return NextResponse.json({ bookmark }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
