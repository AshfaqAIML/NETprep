import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/pyqs — Enhanced PYQ library API
 *
 * Query params:
 *   subject      — subject slug (e.g. "paper-1", "computer-science")
 *   year         — e.g. 2023
 *   session      — June | December
 *   shift        — Shift 1 | Shift 2
 *   paper        — 1 | 2 (Paper I or Paper II)
 *   topicId      — specific topic
 *   difficulty   — easy | medium | hard
 *   sourceType   — official_pyq | verified_pyq | practice | mock
 *   attempted    — "true" for attempted, "false" for unattempted
 *   correct      — "true" for correct, "false" for incorrect
 *   bookmarked   — "true" for bookmarked only
 *   search       — search question text
 *   limit        — max results (default 100)
 *
 * Also returns metadata: available years, sessions, shifts, subjects for filter UI
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const subjectSlug = searchParams.get('subject')
    const year = searchParams.get('year')
    const session = searchParams.get('session')
    const shift = searchParams.get('shift')
    const paper = searchParams.get('paper')
    const topicId = searchParams.get('topicId')
    const difficulty = searchParams.get('difficulty')
    const sourceType = searchParams.get('sourceType')
    const attempted = searchParams.get('attempted')
    const correct = searchParams.get('correct')
    const bookmarked = searchParams.get('bookmarked')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') ?? '100', 10)

    // Build the where clause
    const where: any = { status: 'published' }

    // Source type filter — default to official + verified PYQs
    if (sourceType) {
      where.sourceType = sourceType
    } else {
      where.sourceType = { in: ['official_pyq', 'verified_pyq'] }
    }

    // Subject filter
    if (subjectSlug && subjectSlug !== 'all') {
      where.topic = { unit: { subject: { slug: subjectSlug } } }
    }

    // Paper filter
    if (paper) {
      if (paper === '1') {
        where.topic = { ...where.topic, unit: { ...where.topic?.unit, subject: { slug: 'paper-1' } } }
      } else if (paper === '2') {
        where.topic = { ...where.topic, unit: { ...where.topic?.unit, subject: { paper: 'II' } } }
      }
    }

    // Year filter
    if (year && year !== 'all') {
      where.pyqYear = parseInt(year, 10)
    } else {
      // Only show questions that have a pyqYear when no specific filter
      if (!sourceType || sourceType === 'official_pyq' || sourceType === 'verified_pyq') {
        where.pyqYear = { gt: 0 }
      }
    }

    if (session && session !== 'all') {
      where.pyqSession = session
    }

    if (shift && shift !== 'all') {
      where.pyqShift = shift
    }

    if (topicId && topicId !== 'all') {
      where.topicId = topicId
    }

    if (difficulty && difficulty !== 'all') {
      where.difficulty = difficulty
    }

    if (search) {
      where.OR = [
        { questionText: { contains: search } },
        { tags: { contains: search } },
      ]
    }

    // User-specific filters (attempted, correct, bookmarked)
    if (attempted === 'true' || correct === 'true' || correct === 'false') {
      const userAttempts = await db.attempt.findMany({
        where: { userId: 'demo-user' },
        select: { questionId: true, isCorrect: true },
      })
      const attemptMap = new Map(userAttempts.map((a) => [a.questionId, a.isCorrect]))

      if (attempted === 'true') {
        where.id = { in: Array.from(attemptMap.keys()) }
      } else if (correct === 'true') {
        const correctIds = Array.from(attemptMap.entries()).filter(([, c]) => c).map(([id]) => id)
        where.id = { in: correctIds }
      } else if (correct === 'false') {
        const wrongIds = Array.from(attemptMap.entries()).filter(([, c]) => !c).map(([id]) => id)
        where.id = { in: wrongIds }
      }
    }

    if (bookmarked === 'true') {
      const bookmarks = await db.bookmark.findMany({
        where: { userId: 'demo-user', itemType: 'question' },
        select: { itemId: true },
      })
      where.id = { in: bookmarks.map((b) => b.itemId) }
    }

    const questions = await db.question.findMany({
      where,
      orderBy: [{ pyqYear: 'desc' }, { pyqSession: 'desc' }, { pyqQuestionNumber: 'asc' }],
      take: limit,
      include: {
        topic: { include: { unit: { include: { subject: true } } } },
      },
    })

    // Get filter metadata — available years, sessions, shifts for the current subject/sourceType
    const allPyqs = await db.question.findMany({
      where: {
        sourceType: { in: ['official_pyq', 'verified_pyq'] },
        pyqYear: { gt: 0 },
        ...(subjectSlug && subjectSlug !== 'all'
          ? { topic: { unit: { subject: { slug: subjectSlug } } } }
          : {}),
      },
      select: {
        pyqYear: true,
        pyqSession: true,
        pyqShift: true,
        difficulty: true,
        topicId: true,
      },
    })

    const years = Array.from(new Set(allPyqs.map((q) => q.pyqYear).filter(Boolean) as number[])).sort((a, b) => b - a)
    const sessions = Array.from(new Set(allPyqs.map((q) => q.pyqSession).filter(Boolean) as string[])).sort()
    const shifts = Array.from(new Set(allPyqs.map((q) => q.pyqShift).filter(Boolean) as string[])).sort()

    // Get subjects that have PYQs
    const subjectsWithPyqs = await db.subject.findMany({
      where: {
        units: {
          some: {
            topics: {
              some: {
                questions: {
                  some: {
                    sourceType: { in: ['official_pyq', 'verified_pyq'] },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    // Stats
    const totalPyqs = await db.question.count({
      where: { sourceType: { in: ['official_pyq', 'verified_pyq'] }, pyqYear: { gt: 0 } },
    })
    const totalPractice = await db.question.count({
      where: { sourceType: 'practice' },
    })

    // Latest year
    const latestYear = years.length > 0 ? years[0] : null

    // Distinct papers (exam papers)
    const distinctPapers = await db.question.groupBy({
      by: ['pyqPaperId'],
      where: {
        sourceType: { in: ['official_pyq', 'verified_pyq'] },
        pyqPaperId: { not: '' },
      },
      _count: true,
    })

    return NextResponse.json({
      questions,
      count: questions.length,
      filters: {
        years,
        sessions,
        shifts,
        subjects: subjectsWithPyqs,
      },
      stats: {
        totalPyqs,
        totalPractice,
        latestYear,
        totalPapers: distinctPapers.length,
      },
    })
  } catch (e) {
    console.error('[api/pyqs] error', e)
    return NextResponse.json({ error: 'Failed to fetch PYQs' }, { status: 500 })
  }
}
