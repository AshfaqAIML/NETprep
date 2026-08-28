import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/revision — revision center aggregations
 *
 * Returns:
 *   - incorrectQuestions: questions the user got wrong (most recent first)
 *   - bookmarkedQuestions: questions the user bookmarked
 *   - weakTopics: topics with low confidence
 *   - dueForReview: topics marked "needs-revision" or "studying" long ago
 *   - revisionStats: summary counts
 */
export async function GET() {
  try {
    // 1. Incorrect questions (distinct, most recent wrong attempt first)
    const wrongAttempts = await db.attempt.findMany({
      where: { userId: 'demo-user', isCorrect: false },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        question: {
          include: {
            topic: { include: { unit: { include: { subject: true } } } },
          },
        },
      },
    })

    // Deduplicate by questionId — keep the most recent attempt
    const seenQuestionIds = new Set<string>()
    const incorrectQuestions = wrongAttempts
      .filter((a) => {
        if (seenQuestionIds.has(a.questionId)) return false
        seenQuestionIds.add(a.questionId)
        return true
      })
      .slice(0, 50)
      .map((a) => ({
        id: a.question.id,
        questionText: a.question.questionText,
        difficulty: a.question.difficulty,
        isPYQ: a.question.isPYQ,
        pyqYear: a.question.pyqYear,
        selectedAnswer: a.selectedAnswer,
        correctAnswer: a.question.correctAnswer,
        explanation: a.question.explanation,
        topic: a.question.topic
          ? {
              id: a.question.topic.id,
              name: a.question.topic.name,
              slug: a.question.topic.slug,
              subject: a.question.topic.unit.subject.name,
              subjectSlug: a.question.topic.unit.subject.slug,
            }
          : null,
        wrongAt: a.createdAt,
      }))

    // 2. Bookmarked questions
    const bookmarkedQuestionRecords = await db.bookmark.findMany({
      where: { userId: 'demo-user', itemType: 'question' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    const bookmarkedQuestionIds = bookmarkedQuestionRecords.map((b) => b.itemId)
    const bookmarkedQuestions = bookmarkedQuestionIds.length > 0
      ? (await db.question.findMany({
          where: { id: { in: bookmarkedQuestionIds } },
          include: {
            topic: { include: { unit: { include: { subject: true } } } },
          },
        })).map((q) => ({
          id: q.id,
          questionText: q.questionText,
          difficulty: q.difficulty,
          isPYQ: q.isPYQ,
          pyqYear: q.pyqYear,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          topic: q.topic
            ? {
                id: q.topic.id,
                name: q.topic.name,
                slug: q.topic.slug,
                subject: q.topic.unit.subject.name,
                subjectSlug: q.topic.unit.subject.slug,
              }
            : null,
        }))
      : []

    // 3. Weak topics (low confidence)
    const weakTopics = await db.topicProgress.findMany({
      where: { userId: 'demo-user', confidence: { lt: 60 } },
      include: { topic: { include: { unit: { include: { subject: true } } } } },
      orderBy: { confidence: 'asc' },
      take: 20,
    })

    // 4. Due for review — topics marked "needs-revision" or "studying" that haven't been touched in 3+ days
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000)
    const dueForReview = await db.topicProgress.findMany({
      where: {
        userId: 'demo-user',
        OR: [
          { status: 'needs-revision' },
          { status: 'studying', updatedAt: { lt: threeDaysAgo } },
        ],
      },
      include: { topic: { include: { unit: { include: { subject: true } } } } },
      orderBy: { updatedAt: 'asc' },
      take: 20,
    })

    // 5. Recently studied topics (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    const recentStudySessions = await db.studySession.findMany({
      where: { userId: 'demo-user', date: { gte: sevenDaysAgo } },
      orderBy: { date: 'desc' },
      take: 30,
    })

    // 6. Stats
    const totalAttempts = await db.attempt.count({ where: { userId: 'demo-user' } })
    const totalWrong = await db.attempt.count({ where: { userId: 'demo-user', isCorrect: false } })
    const totalBookmarkedQuestions = bookmarkedQuestionIds.length
    const totalWeakTopics = weakTopics.length
    const totalDueForReview = dueForReview.length

    return NextResponse.json({
      incorrectQuestions,
      bookmarkedQuestions,
      weakTopics: weakTopics.map((tp) => ({
        topicId: tp.topicId,
        topicName: tp.topic.name,
        unitName: tp.topic.unit.name,
        subjectName: tp.topic.unit.subject.name,
        subjectSlug: tp.topic.unit.subject.slug,
        confidence: tp.confidence,
        status: tp.status,
        lastUpdated: tp.updatedAt,
      })),
      dueForReview: dueForReview.map((tp) => ({
        topicId: tp.topicId,
        topicName: tp.topic.name,
        unitName: tp.topic.unit.name,
        subjectName: tp.topic.unit.subject.name,
        subjectSlug: tp.topic.unit.subject.slug,
        status: tp.status,
        confidence: tp.confidence,
        lastUpdated: tp.updatedAt,
        daysSinceUpdate: Math.floor((Date.now() - tp.updatedAt.getTime()) / 86400000),
      })),
      recentActivity: recentStudySessions.map((s) => ({
        date: s.date,
        duration: s.durationMin,
        topic: s.topic,
        activity: s.activity,
      })),
      stats: {
        totalAttempts,
        totalWrong,
        totalBookmarkedQuestions,
        totalWeakTopics,
        totalDueForReview,
        revisionQueueSize: incorrectQuestions.length + totalBookmarkedQuestions + totalDueForReview,
      },
    })
  } catch (e) {
    console.error('[api/revision] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
