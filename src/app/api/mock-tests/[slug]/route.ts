import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const mockTest = await db.mockTest.findUnique({
      where: { slug },
      include: {
        subject: true,
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: {
            question: {
              include: {
                topic: { include: { unit: { include: { subject: true } } } },
              },
            },
          },
        },
      },
    })

    if (!mockTest) {
      return NextResponse.json({ error: 'Mock test not found' }, { status: 404 })
    }

    // For exam mode, do not reveal correct answers upfront
    const sanitized = {
      ...mockTest,
      questions: mockTest.questions.map((q) => ({
        ...q,
        question: {
          id: q.question.id,
          questionText: q.question.questionText,
          optionA: q.question.optionA,
          optionB: q.question.optionB,
          optionC: q.question.optionC,
          optionD: q.question.optionD,
          topic: q.question.topic,
          difficulty: q.question.difficulty,
          // correctAnswer & explanation are intentionally omitted; submit endpoint will reveal
        },
      })),
    }

    return NextResponse.json({ mockTest: sanitized })
  } catch (e) {
    console.error('[api/mock-tests/[slug]] error', e)
    return NextResponse.json({ error: 'Failed to fetch mock test' }, { status: 500 })
  }
}
