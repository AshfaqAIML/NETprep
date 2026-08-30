import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/books/library
 * Returns all subjects with their books, grouped for the library view.
 * Includes reading progress for the current user.
 */
export async function GET() {
  try {
    const subjects = await db.subject.findMany({
      where: {
        books: { some: {} },
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        books: {
          orderBy: { bookOrder: 'asc' },
          select: {
            id: true, slug: true, title: true, author: true, coverUrl: true,
            fileUrl: true, pageCount: true, rating: true, distribution: true,
            bookOrder: true, accessLevel: true,
            _count: { select: { chapters: true } },
          },
        },
      },
    })

    // Get reading progress for all books
    const progress = await db.readingProgress.findMany({
      where: { userId: 'demo-user' },
      select: { bookId: true, currentPage: true, totalPages: true, completionPct: true, lastReadAt: true, isCompleted: true },
    })
    const progressMap = new Map(progress.map((p) => [p.bookId, p]))

    // Build subject cards with progress
    const library = subjects.map((s) => {
      const booksWithProgress = s.books.map((b) => ({
        ...b,
        progress: progressMap.get(b.id) ?? null,
      }))
      const readingBooks = booksWithProgress.filter((b) => b.progress && !b.progress.isCompleted)
      const lastRead = readingBooks.sort((a, b) =>
        new Date(b.progress!.lastReadAt).getTime() - new Date(a.progress!.lastReadAt).getTime()
      )[0]

      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        code: s.code,
        icon: s.icon,
        color: s.color,
        bookCount: s.books.length,
        books: booksWithProgress,
        lastReadBook: lastRead ?? null,
        hasProgress: readingBooks.length > 0,
      }
    })

    return NextResponse.json({ subjects: library })
  } catch (e) {
    console.error('[api/books/library] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
