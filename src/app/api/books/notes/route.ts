import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getCurrentUserId } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/books/notes?bookId=xxx — Get notes for a book
 * POST /api/books/notes — Create a note
 * §22 user isolation — notes are per-user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await getCurrentUserId(session) // §22 isolation — falls back to demo-user if no session
    const { searchParams } = new URL(req.url)
    const bookId = searchParams.get('bookId')

    const where: any = { userId }
    if (bookId) where.bookId = bookId

    const notes = await db.bookNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { book: { select: { title: true, slug: true, subject: { select: { name: true, slug: true } } } } },
    })
    return NextResponse.json({ notes, count: notes.length })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await getCurrentUserId(session) // §22 isolation — falls back to demo-user if no session
    const body = await req.json()
    const { bookId, title, content, pageNumber, highlightId, tags } = body

    if (!bookId || !content) {
      return NextResponse.json({ error: 'bookId and content required' }, { status: 400 })
    }

    const note = await db.bookNote.create({
      data: {
        userId,
        bookId,
        title: title ?? '',
        content,
        pageNumber: pageNumber ?? null,
        highlightId: highlightId ?? null,
        tags: tags ?? '',
      },
    })
    return NextResponse.json({ note }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
