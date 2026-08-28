import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const subjects = await db.subject.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            units: true,
            notes: true,
            books: true,
            cheatsheets: true,
            pyqs: true,
            articles: true,
          },
        },
      },
    })

    // For each subject, also count questions (questions live under topic → unit → subject)
    const subjectsWithCounts = await Promise.all(
      subjects.map(async (s) => {
        const questionCount = await db.question.count({
          where: { topic: { unit: { subjectId: s.id } } },
        })
        return { ...s, _count: { ...s._count, questions: questionCount } }
      }),
    )

    return NextResponse.json({ subjects: subjectsWithCounts })
  } catch (e) {
    console.error('[api/subjects] error', e)
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
  }
}
