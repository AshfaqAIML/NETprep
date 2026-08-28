import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const subjectSlug = searchParams.get('subject')
    const unitSlug = searchParams.get('unit')
    const topicId = searchParams.get('topicId')
    const difficulty = searchParams.get('difficulty')
    const isPYQ = searchParams.get('pyq')
    const mode = searchParams.get('mode') ?? 'practice'
    const limit = parseInt(searchParams.get('limit') ?? '20', 10)

    const where: any = { status: 'published' }
    if (topicId) where.topicId = topicId
    if (difficulty) where.difficulty = difficulty
    if (isPYQ === 'true') where.isPYQ = true
    if (subjectSlug || unitSlug) {
      where.topic = {
        unit: {
          ...(subjectSlug ? { subject: { slug: subjectSlug } } : {}),
          ...(unitSlug ? { slug: unitSlug } : {}),
        },
      }
    }

    let questions
    if (mode === 'weak') {
      // Pick questions from topics where demo user has low confidence
      const weakProgress = await db.topicProgress.findMany({
        where: { userId: 'demo-user', confidence: { lt: 50 } },
        take: 5,
      })
      const weakTopicIds = weakProgress.map((p) => p.topicId)
      if (weakTopicIds.length === 0) {
        questions = await db.question.findMany({
          where: { status: 'published' },
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { topic: { include: { unit: { include: { subject: true } } } } },
        })
      } else {
        questions = await db.question.findMany({
          where: { status: 'published', topicId: { in: weakTopicIds } },
          take: limit,
          include: { topic: { include: { unit: { include: { subject: true } } } } },
        })
      }
    } else if (mode === 'revision') {
      // Pick questions the demo user previously got wrong
      const wrongAttempts = await db.attempt.findMany({
        where: { userId: 'demo-user', isCorrect: false },
        take: 30,
        orderBy: { createdAt: 'desc' },
        distinct: ['questionId'],
      })
      const wrongIds = wrongAttempts.map((a) => a.questionId)
      if (wrongIds.length === 0) {
        questions = await db.question.findMany({
          where: { status: 'published' },
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { topic: { include: { unit: { include: { subject: true } } } } },
        })
      } else {
        questions = await db.question.findMany({
          where: { id: { in: wrongIds }, status: 'published' },
          take: limit,
          include: { topic: { include: { unit: { include: { subject: true } } } } },
        })
      }
    } else {
      questions = await db.question.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { topic: { include: { unit: { include: { subject: true } } } } },
      })
    }

    return NextResponse.json({ questions, count: questions.length })
  } catch (e) {
    console.error('[api/questions] error', e)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}
