import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const books = await db.book.findMany({
      orderBy: [{ rating: 'desc' }, { title: 'asc' }],
      include: {
        subject: { select: { slug: true, name: true, color: true, icon: true } },
      },
    })
    return NextResponse.json({ books })
  } catch (e) {
    console.error('[api/books] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
