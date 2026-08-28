import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/questions/[id]/history — per-question attempt history
 *
 * Returns all attempts for a specific question by the demo user:
 *   - attempt date, selected answer, correctness, time spent, mode
 *   - improvement calculation (first vs latest attempt)
 *   - attempt count, average time
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const question = await db.question.findUnique({
      where: { id },
      select: {
        id: true,
        questionText: true,
        correctAnswer: true,
        difficulty: true,
        sourceType: true,
        pyqYear: true,
        pyqSession: true,
        topic: { include: { unit: { include: { subject: true } } } },
      },
    })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const attempts = await db.attempt.findMany({
      where: { userId: 'demo-user', questionId: id },
      orderBy: { createdAt: 'asc' },
    })

    if (attempts.length === 0) {
      return NextResponse.json({
        question,
        attempts: [],
        stats: {
          totalAttempts: 0,
          correctAttempts: 0,
          incorrectAttempts: 0,
          accuracy: 0,
          avgTimePerAttempt: 0,
          firstAttempt: null,
          latestAttempt: null,
          improvement: null,
        },
      })
    }

    const correctCount = attempts.filter((a) => a.isCorrect).length
    const totalTime = attempts.reduce((s, a) => s + a.timeSpentSec, 0)
    const first = attempts[0]
    const latest = attempts[attempts.length - 1]

    // Improvement: did the user go from incorrect → correct?
    let improvement: string | null = null
    if (attempts.length >= 2) {
      if (!first.isCorrect && latest.isCorrect) {
        improvement = `Improved from incorrect to correct over ${attempts.length} attempts`
      } else if (first.isCorrect && !latest.isCorrect) {
        improvement = `Performance declined — was correct initially but incorrect on latest attempt`
      } else if (first.isCorrect && latest.isCorrect) {
        improvement = `Consistently correct across ${attempts.length} attempts`
      } else {
        improvement = `Still incorrect after ${attempts.length} attempts — needs revision`
      }
    }

    return NextResponse.json({
      question,
      attempts: attempts.map((a, i) => ({
        attemptNumber: i + 1,
        id: a.id,
        selectedAnswer: a.selectedAnswer,
        isCorrect: a.isCorrect,
        timeSpentSec: a.timeSpentSec,
        mode: a.mode,
        date: a.createdAt,
      })),
      stats: {
        totalAttempts: attempts.length,
        correctAttempts: correctCount,
        incorrectAttempts: attempts.length - correctCount,
        accuracy: Math.round((correctCount / attempts.length) * 100),
        avgTimePerAttempt: attempts.length > 0 ? Math.round(totalTime / attempts.length) : 0,
        firstAttempt: {
          date: first.createdAt,
          selectedAnswer: first.selectedAnswer,
          isCorrect: first.isCorrect,
        },
        latestAttempt: {
          date: latest.createdAt,
          selectedAnswer: latest.selectedAnswer,
          isCorrect: latest.isCorrect,
        },
        improvement,
      },
    })
  } catch (e) {
    console.error('[api/questions/[id]/history] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
