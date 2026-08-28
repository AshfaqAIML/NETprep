import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/pyqs/stats — lightweight stats for the Quick Access card
 *
 * Returns:
 *   - totalPyqs
 *   - totalPapers (distinct exam papers)
 *   - latestYear
 *   - subjectBreakdown
 */
export async function GET() {
  try {
    const totalPyqs = await db.question.count({
      where: {
        sourceType: { in: ['official_pyq', 'verified_pyq'] },
        pyqYear: { gt: 0 },
        status: 'published',
      },
    })

    const distinctPapers = await db.question.groupBy({
      by: ['pyqPaperId'],
      where: {
        sourceType: { in: ['official_pyq', 'verified_pyq'] },
        pyqPaperId: { not: '' },
      },
      _count: true,
    })

    const latestYearResult = await db.question.findFirst({
      where: {
        sourceType: { in: ['official_pyq', 'verified_pyq'] },
        pyqYear: { gt: 0 },
      },
      orderBy: { pyqYear: 'desc' },
      select: { pyqYear: true },
    })

    // Subject breakdown — count PYQs per subject
    const subjects = await db.subject.findMany({
      include: {
        units: {
          include: {
            topics: {
              select: {
                _count: {
                  select: {
                    questions: {
                      where: {
                        sourceType: { in: ['official_pyq', 'verified_pyq'] },
                        pyqYear: { gt: 0 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    const subjectBreakdown = subjects
      .map((s) => {
        const count = s.units.reduce(
          (sum, u) => sum + u.topics.reduce((ts, t) => ts + t._count.questions, 0),
          0,
        )
        return { slug: s.slug, name: s.name, code: s.code, paper: s.paper, pyqCount: count }
      })
      .filter((s) => s.pyqCount > 0)
      .sort((a, b) => b.pyqCount - a.pyqCount)

    // Year breakdown
    const yearGroups = await db.question.groupBy({
      by: ['pyqYear'],
      where: {
        sourceType: { in: ['official_pyq', 'verified_pyq'] },
        pyqYear: { gt: 0 },
      },
      _count: true,
      orderBy: { pyqYear: 'desc' },
    })

    return NextResponse.json({
      totalPyqs,
      totalPapers: distinctPapers.length,
      latestYear: latestYearResult?.pyqYear ?? null,
      subjectBreakdown,
      yearBreakdown: yearGroups.map((y) => ({ year: y.pyqYear, count: y._count })),
    })
  } catch (e) {
    console.error('[api/pyqs/stats] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
