import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const bookId = searchParams.get('bookId')

    const where: any = { userId: 'demo-user' }
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
    const body = await req.json()
    const { bookId, title, content, pageNumber, highlightId, tags } = body

    if (!bookId || !content) {
      return NextResponse.json({ error: 'bookId and content required' }, { status: 400 })
    }

    const note = await db.bookNote.create({
      data: {
        userId: 'demo-user',
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
