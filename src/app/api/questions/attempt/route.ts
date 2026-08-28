import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/questions/attempt
// Body: { questionId, selectedAnswer, timeSpentSec, mode }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { questionId, selectedAnswer, timeSpentSec = 0, mode = 'practice' } = body

    if (!questionId || !selectedAnswer) {
      return NextResponse.json(
        { error: 'questionId and selectedAnswer are required' },
        { status: 400 },
      )
    }

    const question = await db.question.findUnique({ where: { id: questionId } })
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const isCorrect = selectedAnswer === question.correctAnswer

    const attempt = await db.attempt.create({
      data: {
        userId: 'demo-user',
        questionId,
        selectedAnswer,
        isCorrect,
        timeSpentSec,
        mode,
      },
    })

    return NextResponse.json({
      attempt,
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    })
  } catch (e) {
    console.error('[api/questions/attempt] error', e)
    return NextResponse.json({ error: 'Failed to record attempt' }, { status: 500 })
  }
}
