import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/dashboard — aggregations for the dashboard view
export async function GET() {
  try {
    const profile = await db.userProfile.findUnique({ where: { userId: 'demo-user' } })

    const today = new Date().toISOString().split('T')[0]
    const todayTasks = await db.studyTask.findMany({
      where: { userId: 'demo-user', scheduledDate: today },
      orderBy: [{ priority: 'desc' }, { startTime: 'asc' }],
    })

    const recentAttempts = await db.attempt.findMany({
      where: { userId: 'demo-user' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { question: { include: { topic: true } } },
    })

    const recentMock = await db.mockTestAttempt.findFirst({
      where: { userId: 'demo-user' },
      orderBy: { completedAt: 'desc' },
      include: { mockTest: true },
    })

    // last opened note — pick the most-viewed note as a proxy
    const lastNote = await db.note.findFirst({
      orderBy: { views: 'desc' },
      include: { subject: { select: { slug: true, name: true, color: true } } },
    })

    const weakTopics = await db.topicProgress.findMany({
      where: { userId: 'demo-user', confidence: { lt: 60 } },
      include: { topic: { include: { unit: { include: { subject: true } } } } },
      orderBy: { confidence: 'asc' },
      take: 4,
    })

    // --- Generate data-driven recommendations ---
    const recommendations: Array<{ title: string; description: string; action: string; actionTarget: any; priority: 'high' | 'medium' | 'low'; icon: string }> = []

    // Get accuracy stats
    const totalAttempts = await db.attempt.count({ where: { userId: 'demo-user' } })
    const correctAttempts = await db.attempt.count({ where: { userId: 'demo-user', isCorrect: true } })
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

    // Get wrong attempts count
    const wrongCount = await db.attempt.count({ where: { userId: 'demo-user', isCorrect: false } })

    // Get mock attempts count
    const mockCount = await db.mockTestAttempt.count({ where: { userId: 'demo-user' } })

    // Get study sessions in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    const recentSessions = await db.studySession.findMany({
      where: { userId: 'demo-user', date: { gte: sevenDaysAgo } },
    })
    const studyDays = new Set(recentSessions.map((s) => new Date(s.date).toDateString())).size

    // Get topic progress stats
    const totalTopicsCompleted = await db.topicProgress.count({
      where: { userId: 'demo-user', status: 'completed' },
    })
    const needsRevisionCount = await db.topicProgress.count({
      where: { userId: 'demo-user', status: 'needs-revision' },
    })

    // Recommendation 1: If accuracy is low, suggest revision
    if (totalAttempts > 5 && accuracy < 70) {
      recommendations.push({
        title: 'Improve your accuracy',
        description: `Your accuracy is ${accuracy}% (${correctAttempts}/${totalAttempts}). Revise topics where you scored below 60% and reattempt incorrect questions.`,
        action: 'Start Revision Practice',
        actionTarget: { view: 'practice', params: { mode: 'revision' } },
        priority: 'high',
        icon: 'target',
      })
    }

    // Recommendation 2: If there are weak topics, suggest practicing them
    if (weakTopics.length > 0) {
      recommendations.push({
        title: `Practice your ${weakTopics.length} weak topic${weakTopics.length !== 1 ? 's' : ''}`,
        description: `Focus on ${weakTopics[0].topic.name} (${weakTopics[0].confidence}% confidence) and other low-confidence areas.`,
        action: 'Practice Weak Areas',
        actionTarget: { view: 'practice', params: { mode: 'weak' } },
        priority: 'high',
        icon: 'alert',
      })
    }

    // Recommendation 3: If few mock tests taken
    if (mockCount < 3) {
      recommendations.push({
        title: 'Take more mock tests',
        description: `You've attempted ${mockCount} mock test${mockCount !== 1 ? 's' : ''}. Aim for at least 1 per week to build exam stamina and identify gaps.`,
        action: 'Take a Mock Test',
        actionTarget: { view: 'mock-tests', params: {} },
        priority: 'medium',
        icon: 'trophy',
      })
    }

    // Recommendation 4: If study consistency is low
    if (studyDays < 4 && totalAttempts > 0) {
      recommendations.push({
        title: 'Build a study streak',
        description: `You studied on ${studyDays} of the last 7 days. Even 30 minutes daily is more effective than long weekend sessions.`,
        action: 'Open Study Planner',
        actionTarget: { view: 'planner', params: {} },
        priority: 'medium',
        icon: 'flame',
      })
    }

    // Recommendation 5: If topics need revision
    if (needsRevisionCount > 0) {
      recommendations.push({
        title: `${needsRevisionCount} topic${needsRevisionCount !== 1 ? 's' : ''} need revision`,
        description: 'You marked these topics as needing revision. Review them before moving to new topics.',
        action: 'Open Revision Center',
        actionTarget: { view: 'revision', params: {} },
        priority: 'high',
        icon: 'rotate',
      })
    }

    // Recommendation 6: If wrong attempts exist
    if (wrongCount > 0) {
      recommendations.push({
        title: `Review your ${wrongCount} mistake${wrongCount !== 1 ? 's' : ''}`,
        description: 'Reattempting questions you got wrong is one of the most effective ways to improve.',
        action: 'Review Mistakes',
        actionTarget: { view: 'revision', params: {} },
        priority: 'medium',
        icon: 'lightbulb',
      })
    }

    // Recommendation 7: Default — suggest studying next topic
    if (recommendations.length < 3) {
      recommendations.push({
        title: 'Revise with cheat sheets',
        description: 'Quick 10-minute revision of formulas, definitions, and key facts across all subjects.',
        action: 'Open Cheat Sheets',
        actionTarget: { view: 'cheat-sheets', params: {} },
        priority: 'low',
        icon: 'sparkles',
      })
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    return NextResponse.json({
      profile,
      todayTasks,
      recentAttempts,
      recentMock,
      lastNote,
      weakTopics,
      recommendations: recommendations.slice(0, 5),
      examCountdown: profile?.examDate
        ? Math.max(
            0,
            Math.ceil(
              (new Date(profile.examDate).getTime() - Date.now()) / 86400000,
            ),
          )
        : null,
    })
  } catch (e) {
    console.error('[api/dashboard] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
