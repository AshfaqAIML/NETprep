import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const bookId = searchParams.get('bookId')

    const where: any = { userId: 'demo-user' }
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
    const body = await req.json()
    const { bookId, pageNumber, title, label } = body

    if (!bookId || !pageNumber) {
      return NextResponse.json({ error: 'bookId and pageNumber required' }, { status: 400 })
    }

    const bookmark = await db.bookBookmark.create({
      data: {
        userId: 'demo-user',
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
