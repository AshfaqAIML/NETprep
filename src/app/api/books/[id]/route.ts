import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const book = await db.book.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      omit: { fileData: true } as any,
      include: { subject: { select: { slug: true, name: true, color: true, icon: true } } },
    })
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    return NextResponse.json({ book })
  } catch (e) {
    console.error('[api/books/[id]] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
