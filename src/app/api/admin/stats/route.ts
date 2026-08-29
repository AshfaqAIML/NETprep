import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/admin/stats — Admin dashboard statistics
 */
export async function GET() {
  try {
    const [
      totalQuestions,
      examStyleQuestions,
      practiceQuestions,
      totalNotes,
      totalArticles,
      totalSubjects,
      totalUnits,
      totalTopics,
      totalBookmarks,
      totalAttempts,
      totalMockAttempts,
      totalReports,
      openReports,
      totalUsers,
      totalSources,
      totalExamPapers,
    ] = await Promise.all([
      db.question.count(),
      db.question.count({ where: { sourceType: { in: ['verified_pyq', 'official_pyq'] } } }),
      db.question.count({ where: { sourceType: 'practice' } }),
      db.note.count(),
      db.article.count(),
      db.subject.count(),
      db.unit.count(),
      db.topic.count(),
      db.bookmark.count(),
      db.attempt.count(),
      db.mockTestAttempt.count(),
      db.report.count(),
      db.report.count({ where: { status: 'open' } }),
      db.userProfile.count(),
      db.pYQSource.count(),
      db.examPaper.count(),
    ])

    // Questions by paper
    const byPaper = await db.question.groupBy({
      by: ['paper'],
      _count: true,
    })

    // Questions by sourceType
    const bySourceType = await db.question.groupBy({
      by: ['sourceType'],
      _count: true,
    })

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    const recentAttempts = await db.attempt.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    })

    // PYQs by year
    const pyqsByYear = await db.question.groupBy({
      by: ['pyqYear'],
      where: { sourceType: { in: ['verified_pyq', 'official_pyq'] }, pyqYear: { gt: 0 } },
      _count: true,
      orderBy: { pyqYear: 'desc' },
    })

    return NextResponse.json({
      totals: {
        questions: totalQuestions,
        examStyleQuestions,
        practiceQuestions,
        notes: totalNotes,
        articles: totalArticles,
        subjects: totalSubjects,
        units: totalUnits,
        topics: totalTopics,
        bookmarks: totalBookmarks,
        attempts: totalAttempts,
        mockAttempts: totalMockAttempts,
        reports: totalReports,
        openReports,
        users: totalUsers,
        sources: totalSources,
        examPapers: totalExamPapers,
        recentAttempts,
      },
      byPaper,
      bySourceType,
      pyqsByYear,
    })
  } catch (e) {
    console.error('[api/admin/stats] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
