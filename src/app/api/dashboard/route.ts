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

    return NextResponse.json({
      profile,
      todayTasks,
      recentAttempts,
      recentMock,
      lastNote,
      weakTopics,
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
