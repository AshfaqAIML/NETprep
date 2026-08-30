import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getCurrentUserId } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/books/highlights?bookId=xxx — Get highlights for a book
 * POST /api/books/highlights — Create a highlight
 * §22 user isolation — highlights are per-user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await getCurrentUserId(session) // §22 isolation — falls back to demo-user if no session
    const { searchParams } = new URL(req.url)
    const bookId = searchParams.get('bookId')
    const all = searchParams.get('all')

    const where: any = { userId }
    if (bookId) where.bookId = bookId

    const highlights = await db.highlight.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { book: { select: { title: true, slug: true, subject: { select: { name: true, slug: true } } } } },
    })

    return NextResponse.json({ highlights, count: highlights.length })
  } catch (e) {
    console.error('[api/books/highlights GET] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await getCurrentUserId(session) // §22 isolation — falls back to demo-user if no session
    const body = await req.json()
    const { bookId, pageNumber, selectedText, color, positionData } = body

    if (!bookId || !selectedText) {
      return NextResponse.json({ error: 'bookId and selectedText required' }, { status: 400 })
    }

    const highlight = await db.highlight.create({
      data: {
        userId,
        bookId,
        pageNumber: pageNumber ?? 1,
        selectedText,
        color: color ?? 'yellow',
        positionData: positionData ?? '',
      },
    })

    return NextResponse.json({ highlight }, { status: 201 })
  } catch (e) {
    console.error('[api/books/highlights POST] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
