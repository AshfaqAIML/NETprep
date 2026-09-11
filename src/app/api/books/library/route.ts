import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getCurrentUserId } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/books/library
 * Returns all subjects with their books, grouped for the library view.
 * Includes reading progress for the current user.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = await getCurrentUserId(session)
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

    // Get reading progress for current user (§22 isolation)
    const progress = await db.readingProgress.findMany({
      where: { userId },
      select: { bookId: true, currentPage: true, totalPages: true, completionPct: true, lastReadAt: true, isCompleted: true },
    })
    const progressMap = new Map(progress.map((p) => [p.bookId, p]))

    // Build subject cards with progress — hide legacy Paper I cards without PDF (trueman/kvs) per request
    const HIDDEN_SLUGS = ['trueman-paper-1', 'kvs-madaan-paper-1']
    const library = subjects.map((s) => {
      const visibleBooks = s.books.filter((b) => !HIDDEN_SLUGS.includes(b.slug) && !!b.fileUrl)
      const booksWithProgress = visibleBooks.map((b) => ({
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
        paper: s.paper,
        icon: s.icon,
        color: s.color,
        bookCount: visibleBooks.length,
        books: booksWithProgress,
        lastReadBook: lastRead ?? null,
        hasProgress: readingBooks.length > 0,
      }
    }).filter((s) => s.bookCount > 0)

    return NextResponse.json({ subjects: library })
  } catch (e) {
    console.error('[api/books/library] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
