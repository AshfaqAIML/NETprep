import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim() ?? ''
    const limit = parseInt(searchParams.get('limit') ?? '20', 10)

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [], query: q })
    }

    const [notes, cheatSheets, subjects, books, questions, articles] = await Promise.all([
      db.note.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { excerpt: { contains: q } },
            { tags: { contains: q } },
          ],
        },
        take: limit,
        include: { subject: { select: { slug: true, name: true, color: true } } },
      }),
      db.cheatSheet.findMany({
        where: {
          OR: [{ title: { contains: q } }, { summary: { contains: q } }, { tags: { contains: q } }],
        },
        take: limit,
      }),
      db.subject.findMany({
        where: { OR: [{ name: { contains: q } }, { description: { contains: q } }] },
        take: limit,
      }),
      db.book.findMany({
        where: {
          OR: [{ title: { contains: q } }, { author: { contains: q } }, { description: { contains: q } }],
        },
        take: limit,
      }),
      db.question.findMany({
        where: { questionText: { contains: q } },
        take: limit,
        include: { topic: { include: { unit: { include: { subject: true } } } } },
      }),
      db.article.findMany({
        where: {
          OR: [{ title: { contains: q } }, { excerpt: { contains: q } }, { tags: { contains: q } }],
        },
        take: limit,
      }),
    ])

    return NextResponse.json({
      query: q,
      results: {
        notes,
        cheatSheets,
        subjects,
        books,
        questions,
        articles,
      },
      total:
        notes.length +
        cheatSheets.length +
        subjects.length +
        books.length +
        questions.length +
        articles.length,
    })
  } catch (e) {
    console.error('[api/search] error', e)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
