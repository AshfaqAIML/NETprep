import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/pyqs/dashboard — PYQ dashboard with two-paper structure
 *
 * Returns:
 *   - paper1: { totalPyqs, totalPapers, years, solved, accuracy, units: [...] }
 *   - paper2: { totalPyqs, totalPapers, years, solved, accuracy, units: [...] }
 *   - overall: { totalPyqs, totalPapers, totalYears, latestYear, mockTestsAvailable }
 *   - highFrequencyTopics: topics that appear most across PYQs
 */
export async function GET() {
  try {
    // Paper I stats
    const p1Pyqs = await db.question.findMany({
      where: { sourceType: { in: ['verified_pyq', 'official_pyq'] }, paper: 'I', pyqYear: { gt: 0 } },
      include: { topic: { include: { unit: true } } },
    })
    const p1Years = Array.from(new Set(p1Pyqs.map((q) => q.pyqYear).filter(Boolean) as number[])).sort((a, b) => b - a)
    const p1Papers = new Set(p1Pyqs.map((q) => q.pyqPaperId).filter(Boolean)).size

    // Paper I user attempts
    const p1Attempts = await db.attempt.findMany({
      where: { userId: 'demo-user', question: { paper: 'I' } },
      select: { isCorrect: true, questionId: true },
    })
    const p1Solved = new Set(p1Attempts.map((a) => a.questionId)).size
    const p1Correct = p1Attempts.filter((a) => a.isCorrect).length
    const p1Accuracy = p1Attempts.length > 0 ? Math.round((p1Correct / p1Attempts.length) * 100) : 0

    // Paper I unit-wise breakdown
    const p1Units = await db.unit.findMany({
      where: { subject: { slug: 'paper-1' } },
      orderBy: { sortOrder: 'asc' },
      include: {
        topics: {
          include: {
            _count: {
              select: {
                questions: {
                  where: { sourceType: { in: ['verified_pyq', 'official_pyq'] }, pyqYear: { gt: 0 } },
                },
              },
            },
          },
        },
      },
    })
    const p1UnitStats = p1Units
      .map((u) => {
        const pyqCount = u.topics.reduce((sum, t) => sum + t._count.questions, 0)
        return { unitId: u.id, unitName: u.name, unitSlug: u.slug, pyqCount }
      })
      .filter((u) => u.pyqCount > 0)

    // Paper II (CS) stats
    const p2Pyqs = await db.question.findMany({
      where: { sourceType: { in: ['verified_pyq', 'official_pyq'] }, paper: 'II', pyqYear: { gt: 0 } },
      include: { topic: { include: { unit: true } } },
    })
    const p2Years = Array.from(new Set(p2Pyqs.map((q) => q.pyqYear).filter(Boolean) as number[])).sort((a, b) => b - a)
    const p2Papers = new Set(p2Pyqs.map((q) => q.pyqPaperId).filter(Boolean)).size

    const p2Attempts = await db.attempt.findMany({
      where: { userId: 'demo-user', question: { paper: 'II' } },
      select: { isCorrect: true, questionId: true },
    })
    const p2Solved = new Set(p2Attempts.map((a) => a.questionId)).size
    const p2Correct = p2Attempts.filter((a) => a.isCorrect).length
    const p2Accuracy = p2Attempts.length > 0 ? Math.round((p2Correct / p2Attempts.length) * 100) : 0

    // Paper II unit-wise breakdown
    const p2Units = await db.unit.findMany({
      where: { subject: { slug: 'computer-science' } },
      orderBy: { sortOrder: 'asc' },
      include: {
        topics: {
          include: {
            _count: {
              select: {
                questions: {
                  where: { sourceType: { in: ['verified_pyq', 'official_pyq'] }, pyqYear: { gt: 0 } },
                },
              },
            },
          },
        },
      },
    })
    const p2UnitStats = p2Units
      .map((u) => {
        const pyqCount = u.topics.reduce((sum, t) => sum + t._count.questions, 0)
        return { unitId: u.id, unitName: u.name, unitSlug: u.slug, pyqCount }
      })
      .filter((u) => u.pyqCount > 0)

    // High-frequency topics — topics with most PYQs
    const allPyqTopics = await db.topic.findMany({
      where: {
        questions: {
          some: { sourceType: { in: ['verified_pyq', 'official_pyq'] }, pyqYear: { gt: 0 } },
        },
      },
      include: {
        unit: { include: { subject: true } },
        _count: {
          select: {
            questions: {
              where: { sourceType: { in: ['verified_pyq', 'official_pyq'] }, pyqYear: { gt: 0 } },
            },
          },
        },
      },
    })
    const highFreqTopics = allPyqTopics
      .map((t) => ({
        topicId: t.id,
        topicName: t.name,
        topicSlug: t.slug,
        unitName: t.unit.name,
        subjectName: t.unit.subject.name,
        subjectSlug: t.unit.subject.slug,
        paper: t.unit.subject.paper,
        pyqCount: t._count.questions,
      }))
      .sort((a, b) => b.pyqCount - a.pyqCount)
      .slice(0, 10)

    // Mock tests available
    const mockTestsAvailable = await db.mockTest.count()

    // Overall stats
    const allYears = Array.from(new Set([...p1Years, ...p2Years])).sort((a, b) => b - a)
    const totalPyqs = p1Pyqs.length + p2Pyqs.length
    const totalPapers = p1Papers + p2Papers

    // User unit-wise performance (for strong/weak area identification)
    const userAttempts = await db.attempt.findMany({
      where: { userId: 'demo-user' },
      include: { question: { include: { topic: { include: { unit: { include: { subject: true } } } } } } },
    })

    const unitPerformanceMap: Record<string, { unitName: string; subjectName: string; paper: string; correct: number; total: number }> = {}
    for (const a of userAttempts) {
      const unit = a.question.topic?.unit
      if (!unit) continue
      const key = unit.id
      if (!unitPerformanceMap[key]) {
        unitPerformanceMap[key] = {
          unitName: unit.name,
          subjectName: unit.subject.name,
          paper: unit.subject.paper,
          correct: 0,
          total: 0,
        }
      }
      unitPerformanceMap[key].total++
      if (a.isCorrect) unitPerformanceMap[key].correct++
    }

    const unitPerformance = Object.entries(unitPerformanceMap)
      .map(([unitId, data]) => ({
        unitId,
        ...data,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      }))
      .sort((a, b) => a.accuracy - b.accuracy)

    const strongAreas = unitPerformance.filter((u) => u.total >= 3 && u.accuracy >= 75).slice(0, 5)
    const weakAreas = unitPerformance.filter((u) => u.total >= 3 && u.accuracy < 60).slice(0, 5)

    return NextResponse.json({
      paper1: {
        totalPyqs: p1Pyqs.length,
        totalPapers: p1Papers,
        years: p1Years,
        solved: p1Solved,
        remaining: p1Pyqs.length - p1Solved,
        accuracy: p1Accuracy,
        totalAttempts: p1Attempts.length,
        units: p1UnitStats,
      },
      paper2: {
        totalPyqs: p2Pyqs.length,
        totalPapers: p2Papers,
        years: p2Years,
        solved: p2Solved,
        remaining: p2Pyqs.length - p2Solved,
        accuracy: p2Accuracy,
        totalAttempts: p2Attempts.length,
        units: p2UnitStats,
      },
      overall: {
        totalPyqs,
        totalPapers,
        totalYears: allYears.length,
        latestYear: allYears[0] ?? null,
        mockTestsAvailable,
      },
      highFrequencyTopics: highFreqTopics,
      unitPerformance,
      strongAreas,
      weakAreas,
    })
  } catch (e) {
    console.error('[api/pyqs/dashboard] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
