import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/mock-tests/submit
// Body: { mockTestId, answers: { questionId: "A"|"B"|"C"|"D" }, timeSpentSec }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { mockTestId, answers = {}, timeSpentSec = 0 } = body

    if (!mockTestId) {
      return NextResponse.json({ error: 'mockTestId is required' }, { status: 400 })
    }

    const mockTest = await db.mockTest.findUnique({
      where: { id: mockTestId },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: { question: true },
        },
      },
    })

    if (!mockTest) {
      return NextResponse.json({ error: 'Mock test not found' }, { status: 404 })
    }

    let correct = 0
    let incorrect = 0
    let skipped = 0
    const topicWise: Record<string, { correct: number; total: number; topicName: string }> = {}

    for (const mtq of mockTest.questions) {
      const q = mtq.question
      const selected = answers[q.id]
      const topicName = q.topicId ? q.topicId : 'general'

      if (!selected) {
        skipped++
        // also record as an attempt for analytics
        await db.attempt.create({
          data: {
            userId: 'demo-user',
            questionId: q.id,
            selectedAnswer: 'X',
            isCorrect: false,
            timeSpentSec: 0,
            mode: 'mock',
          },
        })
        continue
      }

      const isCorrect = selected === q.correctAnswer
      if (isCorrect) correct++
      else incorrect++

      await db.attempt.create({
        data: {
          userId: 'demo-user',
          questionId: q.id,
          selectedAnswer: selected,
          isCorrect,
          timeSpentSec: 0,
          mode: 'mock',
        },
      })
    }

    const total = mockTest.questions.length
    const score = correct * 2 // 2 marks per question (UGC NET pattern)
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
    const accuracy = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0

    // topic-wise breakdown using fetched topic names
    const topicIds = Array.from(
      new Set(mockTest.questions.map((q) => q.question.topicId).filter(Boolean) as string[]),
    )
    const topics = await db.topic.findMany({
      where: { id: { in: topicIds } },
      select: { id: true, name: true },
    })
    const topicNameMap = new Map(topics.map((t) => [t.id, t.name]))

    for (const mtq of mockTest.questions) {
      const q = mtq.question
      const tid = q.topicId ?? 'general'
      const tname = topicNameMap.get(tid) ?? 'General'
      if (!topicWise[tid]) topicWise[tid] = { correct: 0, total: 0, topicName: tname }
      topicWise[tid].total++
      const selected = answers[q.id]
      if (selected === q.correctAnswer) topicWise[tid].correct++
    }

    const attempt = await db.mockTestAttempt.create({
      data: {
        userId: 'demo-user',
        mockTestId,
        answers: JSON.stringify(answers),
        score,
        totalQuestions: total,
        correctCount: correct,
        incorrectCount: incorrect,
        skippedCount: skipped,
        timeSpentSec,
      },
    })

    // record a study session
    await db.studySession.create({
      data: {
        userId: 'demo-user',
        durationMin: Math.max(1, Math.round(timeSpentSec / 60)),
        activity: 'mock',
        topic: mockTest.title,
      },
    })

    // Build detailed result with per-question feedback
    const detailedQuestions = mockTest.questions.map((mtq, idx) => ({
      index: idx + 1,
      questionId: mtq.question.id,
      questionText: mtq.question.questionText,
      options: {
        A: mtq.question.optionA,
        B: mtq.question.optionB,
        C: mtq.question.optionC,
        D: mtq.question.optionD,
      },
      correctAnswer: mtq.question.correctAnswer,
      selectedAnswer: answers[mtq.question.id] ?? null,
      isCorrect: answers[mtq.question.id] === mtq.question.correctAnswer,
      wasSkipped: !answers[mtq.question.id],
      explanation: mtq.question.explanation,
      topic: topicNameMap.get(mtq.question.topicId ?? '') ?? null,
      difficulty: mtq.question.difficulty,
    }))

    return NextResponse.json({
      attempt,
      result: {
        total,
        correct,
        incorrect,
        skipped,
        score,
        percentage,
        accuracy,
        timeSpentSec,
        avgTimePerQuestion: total > 0 ? Math.round(timeSpentSec / total) : 0,
        topicWise: Object.values(topicWise).sort((a, b) => a.correct / a.total - b.correct / b.total),
        questions: detailedQuestions,
      },
    })
  } catch (e) {
    console.error('[api/mock-tests/submit] error', e)
    return NextResponse.json({ error: 'Failed to submit mock test' }, { status: 500 })
  }
}
