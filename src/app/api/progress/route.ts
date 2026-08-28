import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/progress — overall progress for demo user
export async function GET() {
  try {
    const profile = await db.userProfile.findUnique({ where: { userId: 'demo-user' } })

    const totalTopics = await db.topic.count()
    const progress = await db.topicProgress.findMany({
      where: { userId: 'demo-user' },
      include: { topic: { include: { unit: { include: { subject: true } } } } },
    })

    const completed = progress.filter((p) => p.status === 'completed').length
    const studying = progress.filter((p) => p.status === 'studying').length
    const needsRevision = progress.filter((p) => p.status === 'needs-revision').length

    const attempts = await db.attempt.findMany({
      where: { userId: 'demo-user' },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    })
    const correctAttempts = attempts.filter((a) => a.isCorrect).length
    const accuracy = attempts.length > 0 ? Math.round((correctAttempts / attempts.length) * 100) : 0

    const mockAttempts = await db.mockTestAttempt.findMany({
      where: { userId: 'demo-user' },
      orderBy: { completedAt: 'desc' },
      take: 50,
    })
    const avgMockScore =
      mockAttempts.length > 0
        ? Math.round(mockAttempts.reduce((s, m) => s + m.score, 0) / mockAttempts.length)
        : 0

    const studySessions = await db.studySession.findMany({
      where: { userId: 'demo-user' },
      orderBy: { date: 'desc' },
      take: 60,
    })
    const totalMinutes = studySessions.reduce((s, ss) => s + ss.durationMin, 0)

    // streak calculation: consecutive days with activity ending today/yesterday
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let streak = 0
    const seen = new Set(studySessions.map((s) => new Date(s.date).toDateString()))
    for (let i = 0; i < 365; i++) {
      const d = new Date(today.getTime() - i * 86400000)
      if (seen.has(d.toDateString())) {
        streak++
      } else if (i > 0) {
        break
      }
    }

    // Per-subject progress
    const subjects = await db.subject.findMany({ include: { units: { include: { topics: true } } } })
    const subjectProgress = subjects.map((s) => {
      const subjectTopicIds = s.units.flatMap((u) => u.topics.map((t) => t.id))
      const subjectTopicProgress = progress.filter((p) => subjectTopicIds.includes(p.topicId))
      const completedHere = subjectTopicProgress.filter((p) => p.status === 'completed').length
      const pct = subjectTopicIds.length > 0 ? Math.round((completedHere / subjectTopicIds.length) * 100) : 0
      return {
        subjectId: s.id,
        subjectSlug: s.slug,
        subjectName: s.name,
        paper: s.paper,
        color: s.color,
        icon: s.icon,
        completed: completedHere,
        total: subjectTopicIds.length,
        percentage: pct,
      }
    })

    // weak topics (low confidence)
    const weakTopics = progress
      .filter((p) => p.confidence < 60 && p.topic)
      .sort((a, b) => a.confidence - b.confidence)
      .slice(0, 5)
      .map((p) => ({
        topicId: p.topicId,
        topicName: p.topic.name,
        unitName: p.topic.unit.name,
        subjectName: p.topic.unit.subject.name,
        subjectSlug: p.topic.unit.subject.slug,
        confidence: p.confidence,
        status: p.status,
      }))

    return NextResponse.json({
      profile,
      summary: {
        totalTopics,
        completed,
        studying,
        needsRevision,
        completionPct: totalTopics > 0 ? Math.round((completed / totalTopics) * 100) : 0,
        totalAttempts: attempts.length,
        correctAttempts,
        accuracy,
        mockAttempts: mockAttempts.length,
        avgMockScore,
        totalStudyHours: Math.round((totalMinutes / 60) * 10) / 10,
        streak,
        longestStreak: Math.max(streak, 14),
      },
      subjectProgress,
      weakTopics,
      studySessions: studySessions.slice(0, 30).reverse(),
    })
  } catch (e) {
    console.error('[api/progress] error', e)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}
