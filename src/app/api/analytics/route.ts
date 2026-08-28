import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/analytics — detailed analytics for the analytics view
 *
 * Returns:
 *   - accuracyOverTime: daily accuracy for last 30 days
 *   - studyHoursOverTime: daily study hours for last 30 days
 *   - questionsOverTime: daily question counts for last 30 days
 *   - topicPerformance: per-topic accuracy (top 20)
 *   - difficultyBreakdown: accuracy by difficulty
 *   - mockScoreTrend: mock test scores over time
 *   - insights: auto-generated text insights
 */
export async function GET() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)

    // 1. All attempts in last 30 days
    const attempts = await db.attempt.findMany({
      where: { userId: 'demo-user', createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'asc' },
      include: { question: { include: { topic: true } } },
    })

    // Group by day
    const byDay: Record<string, { correct: number; total: number }> = {}
    for (const a of attempts) {
      const day = new Date(a.createdAt).toISOString().split('T')[0]
      if (!byDay[day]) byDay[day] = { correct: 0, total: 0 }
      byDay[day].total++
      if (a.isCorrect) byDay[day].correct++
    }

    const accuracyOverTime = Object.entries(byDay)
      .map(([date, v]) => ({
        date,
        accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
        questions: v.total,
        correct: v.correct,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // 2. Study sessions last 30 days
    const sessions = await db.studySession.findMany({
      where: { userId: 'demo-user', date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    })
    const studyByDay: Record<string, number> = {}
    for (const s of sessions) {
      const day = new Date(s.date).toISOString().split('T')[0]
      studyByDay[day] = (studyByDay[day] ?? 0) + s.durationMin
    }
    const studyHoursOverTime = Object.entries(studyByDay)
      .map(([date, min]) => ({
        date,
        hours: Math.round((min / 60) * 10) / 10,
        minutes: min,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // 3. Topic performance (all time)
    const topicMap: Record<string, { topicId: string; topicName: string; correct: number; total: number }> = {}
    for (const a of attempts) {
      if (!a.question.topic) continue
      const tid = a.question.topic.id
      if (!topicMap[tid]) {
        topicMap[tid] = {
          topicId: tid,
          topicName: a.question.topic.name,
          correct: 0,
          total: 0,
        }
      }
      topicMap[tid].total++
      if (a.isCorrect) topicMap[tid].correct++
    }
    const topicPerformance = Object.values(topicMap)
      .map((t) => ({
        ...t,
        accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 20)

    // 4. Difficulty breakdown
    const difficultyMap: Record<string, { correct: number; total: number }> = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 },
    }
    for (const a of attempts) {
      const d = a.question.difficulty
      if (difficultyMap[d]) {
        difficultyMap[d].total++
        if (a.isCorrect) difficultyMap[d].correct++
      }
    }
    const difficultyBreakdown = Object.entries(difficultyMap).map(([level, v]) => ({
      level,
      accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
      total: v.total,
      correct: v.correct,
    }))

    // 5. Mock test score trend
    const mockAttempts = await db.mockTestAttempt.findMany({
      where: { userId: 'demo-user' },
      orderBy: { completedAt: 'asc' },
      include: { mockTest: { select: { title: true, slug: true } } },
    })
    const mockScoreTrend = mockAttempts.map((m, i) => ({
      attempt: i + 1,
      title: m.mockTest.title,
      score: m.score,
      totalQuestions: m.totalQuestions,
      accuracy: m.totalQuestions > 0 ? Math.round((m.correctCount / m.totalQuestions) * 100) : 0,
      date: m.completedAt,
    }))

    // 6. Generate insights
    const insights: string[] = []
    const totalQuestions = attempts.length
    const totalCorrect = attempts.filter((a) => a.isCorrect).length
    const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

    // Insight: accuracy trend (first half vs second half)
    if (accuracyOverTime.length >= 4) {
      const half = Math.floor(accuracyOverTime.length / 2)
      const firstHalf = accuracyOverTime.slice(0, half)
      const secondHalf = accuracyOverTime.slice(half)
      const firstAvg = firstHalf.reduce((s, d) => s + d.accuracy, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((s, d) => s + d.accuracy, 0) / secondHalf.length
      const diff = Math.round(secondAvg - firstAvg)
      if (diff > 5) {
        insights.push(`Your accuracy improved by ${diff}% over the last 30 days. Keep up the momentum!`)
      } else if (diff < -5) {
        insights.push(`Your accuracy dropped by ${Math.abs(diff)}% recently. Consider revising fundamentals.`)
      }
    }

    // Insight: weakest topic
    if (topicPerformance.length > 0 && topicPerformance[0].total >= 3) {
      const weakest = topicPerformance[0]
      insights.push(`Your weakest topic is "${weakest.topicName}" with ${weakest.accuracy}% accuracy (${weakest.correct}/${weakest.total} correct).`)
    }

    // Insight: difficulty pattern
    const easyAcc = difficultyBreakdown.find((d) => d.level === 'easy')?.accuracy ?? 0
    const hardAcc = difficultyBreakdown.find((d) => d.level === 'hard')?.accuracy ?? 0
    if (easyAcc > 0 && hardAcc > 0 && easyAcc - hardAcc > 25) {
      insights.push(`You score ${easyAcc}% on easy questions but only ${hardAcc}% on hard ones. Practice more hard-difficulty questions to push your score higher.`)
    }

    // Insight: study consistency
    const studyDays = studyHoursOverTime.filter((d) => d.hours > 0).length
    if (studyDays >= 10) {
      insights.push(`You've been consistent — studied on ${studyDays} of the last 30 days.`)
    } else if (studyDays < 5 && totalQuestions > 0) {
      insights.push(`You've only studied on ${studyDays} days in the last 30. Even 30 minutes daily makes a big difference.`)
    }

    // Insight: mock test performance
    if (mockScoreTrend.length >= 2) {
      const latest = mockScoreTrend[mockScoreTrend.length - 1]
      const previous = mockScoreTrend[mockScoreTrend.length - 2]
      if (latest.accuracy > previous.accuracy) {
        insights.push(`Your latest mock accuracy (${latest.accuracy}%) is better than the previous one (${previous.accuracy}%). You're improving!`)
      }
    }

    return NextResponse.json({
      accuracyOverTime,
      studyHoursOverTime,
      topicPerformance,
      difficultyBreakdown,
      mockScoreTrend,
      insights,
      summary: {
        totalQuestions,
        totalCorrect,
        overallAccuracy,
        studyDays,
        totalStudyHours: Math.round(sessions.reduce((s, sess) => s + sess.durationMin, 0) / 60 * 10) / 10,
        mockTestsTaken: mockAttempts.length,
      },
    })
  } catch (e) {
    console.error('[api/analytics] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
