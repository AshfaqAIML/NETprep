import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/pyqs/analytics — High-yield historical analytics computed from actual PYQ data
 *
 * Returns:
 *   - unitStats: per-unit question counts, years covered, avg/exam, top topics
 *   - repeatedConcepts: concepts appearing across multiple years
 *   - difficultyDistribution: easy/medium/hard breakdown
 *   - yearDistribution: questions per year per paper
 *   - topicFrequency: most frequently tested topics
 *   - examPattern: current exam cycle configuration
 */
export async function GET() {
  try {
    // Get all official PYQs with topic/unit info
    const pyqs = await db.question.findMany({
      where: {
        sourceType: { in: ['verified_pyq', 'official_pyq'] },
        pyqYear: { gt: 0 },
        status: 'published',
      },
      include: {
        topic: { include: { unit: { include: { subject: true } } } },
      },
    })

    // --- 1. Unit-wise stats (Paper II CS focus) ---
    const unitMap: Record<string, {
      unitId: string
      unitName: string
      unitSlug: string
      subjectName: string
      subjectSlug: string
      paper: string
      totalCount: number
      yearsSet: Set<number>
      topTopics: Map<string, number>
    }> = {}

    for (const q of pyqs) {
      const unit = q.topic?.unit
      if (!unit) continue
      const key = unit.id
      if (!unitMap[key]) {
        unitMap[key] = {
          unitId: unit.id,
          unitName: unit.name,
          unitSlug: unit.slug,
          subjectName: unit.subject.name,
          subjectSlug: unit.subject.slug,
          paper: unit.subject.paper,
          totalCount: 0,
          yearsSet: new Set(),
          topTopics: new Map(),
        }
      }
      unitMap[key].totalCount++
      if (q.pyqYear) unitMap[key].yearsSet.add(q.pyqYear)
      if (q.topic) {
        const cur = unitMap[key].topTopics.get(q.topic.name) ?? 0
        unitMap[key].topTopics.set(q.topic.name, cur + 1)
      }
    }

    // Get distinct years for average calculation
    const allYears = Array.from(new Set(pyqs.map((q) => q.pyqYear).filter(Boolean) as number[]))
    const yearCount = allYears.length || 1

    const unitStats = Object.values(unitMap)
      .map((u) => ({
        unitId: u.unitId,
        unitName: u.unitName,
        unitSlug: u.unitSlug,
        subjectName: u.subjectName,
        subjectSlug: u.subjectSlug,
        paper: u.paper,
        totalQuestions: u.totalCount,
        yearsCovered: Array.from(u.yearsSet).sort((a, b) => a - b),
        yearsCount: u.yearsSet.size,
        avgPerExam: Math.round((u.totalCount / yearCount) * 10) / 10,
        topTopics: Array.from(u.topTopics.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ topicName: name, count })),
      }))
      .sort((a, b) => b.totalQuestions - a.totalQuestions)

    // --- 2. Repeated concepts (topics appearing in 2+ years) ---
    const topicYearMap: Record<string, {
      topicName: string
      topicId: string
      unitName: string
      subjectName: string
      subjectSlug: string
      paper: string
      years: Set<number>
      totalCount: number
    }> = {}

    for (const q of pyqs) {
      if (!q.topic) continue
      const key = q.topic.id
      if (!topicYearMap[key]) {
        topicYearMap[key] = {
          topicName: q.topic.name,
          topicId: q.topic.id,
          unitName: q.topic.unit?.name ?? 'Unknown',
          subjectName: q.topic.unit?.subject.name ?? 'Unknown',
          subjectSlug: q.topic.unit?.subject.slug ?? '',
          paper: q.topic.unit?.subject.paper ?? 'I',
          years: new Set(),
          totalCount: 0,
        }
      }
      if (q.pyqYear) topicYearMap[key].years.add(q.pyqYear)
      topicYearMap[key].totalCount++
    }

    const repeatedConcepts = Object.values(topicYearMap)
      .filter((t) => t.years.size >= 2)
      .map((t) => ({
        ...t,
        years: Array.from(t.years).sort((a, b) => b - a),
        yearsCount: t.years.size,
        lastSeen: Math.max(...t.years),
      }))
      .sort((a, b) => b.yearsCount - a.yearsCount || b.totalCount - a.totalCount)
      .slice(0, 15)

    // --- 3. Difficulty distribution ---
    const difficultyMap: Record<string, { paper: string; easy: number; medium: number; hard: number; total: number }> = {
      I: { paper: 'I', easy: 0, medium: 0, hard: 0, total: 0 },
      II: { paper: 'II', easy: 0, medium: 0, hard: 0, total: 0 },
    }
    for (const q of pyqs) {
      const p = q.paper === 'I' ? 'I' : 'II'
      difficultyMap[p].total++
      if (q.difficulty === 'easy') difficultyMap[p].easy++
      else if (q.difficulty === 'hard') difficultyMap[p].hard++
      else difficultyMap[p].medium++
    }

    // --- 4. Year distribution ---
    const yearDistMap: Record<string, Record<number, number>> = { I: {}, II: {} }
    for (const q of pyqs) {
      if (!q.pyqYear) continue
      const p = q.paper === 'I' ? 'I' : 'II'
      yearDistMap[p][q.pyqYear] = (yearDistMap[p][q.pyqYear] ?? 0) + 1
    }
    const yearDistribution = {
      paper1: Object.entries(yearDistMap.I).map(([year, count]) => ({ year: parseInt(year), count })).sort((a, b) => a.year - b.year),
      paper2: Object.entries(yearDistMap.II).map(([year, count]) => ({ year: parseInt(year), count })).sort((a, b) => a.year - b.year),
    }

    // --- 5. Topic frequency (top 20 most tested topics) ---
    const topicFreq = Object.values(topicYearMap)
      .map((t) => ({
        topicName: t.topicName,
        topicId: t.topicId,
        unitName: t.unitName,
        subjectName: t.subjectName,
        subjectSlug: t.subjectSlug,
        paper: t.paper,
        totalCount: t.totalCount,
        yearsCount: t.years.size,
      }))
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, 20)

    // --- 6. Exam pattern (current active cycle) ---
    const examPattern = await db.examCycle.findFirst({
      where: { isActive: true },
      orderBy: { year: 'desc' },
    })

    // --- 7. Preparation priority engine ---
    // Combine historical frequency + user accuracy to generate priorities
    const userAttempts = await db.attempt.findMany({
      where: { userId: 'demo-user' },
      include: { question: { include: { topic: { include: { unit: true } } } } },
    })

    const userUnitMap: Record<string, { unitName: string; correct: number; total: number; totalTime: number }> = {}
    for (const a of userAttempts) {
      const unit = a.question.topic?.unit
      if (!unit) continue
      if (!userUnitMap[unit.id]) {
        userUnitMap[unit.id] = { unitName: unit.name, correct: 0, total: 0, totalTime: 0 }
      }
      userUnitMap[unit.id].total++
      if (a.isCorrect) userUnitMap[unit.id].correct++
      userUnitMap[unit.id].totalTime += a.timeSpentSec
    }

    // Generate priority list: high frequency + low accuracy = high priority
    const priorities = unitStats
      .filter((u) => u.paper === 'II') // CS Paper II focus
      .map((u) => {
        const userData = userUnitMap[u.unitId]
        const userAccuracy = userData && userData.total >= 3 ? (userData.correct / userData.total) * 100 : null
        const avgTimePerQ = userData && userData.total > 0 ? Math.round(userData.totalTime / userData.total) : null

        // Priority score: higher frequency = higher priority, lower accuracy = higher priority
        let priorityScore = u.totalQuestions * 2 // frequency weight
        if (userAccuracy !== null) {
          priorityScore += (100 - userAccuracy) * 1.5 // lower accuracy → higher priority
        }
        if (avgTimePerQ && avgTimePerQ > 60) {
          priorityScore += 5 // slow questions → slight priority boost
        }

        return {
          unitId: u.unitId,
          unitName: u.unitName,
          paper: u.paper,
          historicalQuestions: u.totalQuestions,
          yearsCovered: u.yearsCount,
          avgPerExam: u.avgPerExam,
          userAccuracy: userAccuracy !== null ? Math.round(userAccuracy) : null,
          userAttempts: userData?.total ?? 0,
          avgTimePerQ: avgTimePerQ,
          priorityScore: Math.round(priorityScore * 10) / 10,
          reason: userAccuracy !== null && userAccuracy < 60
            ? `High historical frequency + low user accuracy (${Math.round(userAccuracy)}%)`
            : userAccuracy !== null && userAccuracy >= 75
              ? 'High historical frequency + strong user performance — maintain with revision'
              : `High historical frequency (${u.totalQuestions} PYQs across ${u.yearsCount} years)`,
        }
      })
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 10)

    return NextResponse.json({
      unitStats,
      repeatedConcepts,
      difficultyDistribution: Object.values(difficultyMap),
      yearDistribution,
      topicFrequency: topicFreq,
      examPattern,
      priorities,
      summary: {
        totalPyqs: pyqs.length,
        totalYears: allYears.length,
        years: allYears.sort((a, b) => a - b),
        paper1Count: pyqs.filter((q) => q.paper === 'I').length,
        paper2Count: pyqs.filter((q) => q.paper === 'II').length,
      },
    })
  } catch (e) {
    console.error('[api/pyqs/analytics] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
