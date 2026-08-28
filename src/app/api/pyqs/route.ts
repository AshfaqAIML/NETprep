import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const subjectSlug = searchParams.get('subject')
    const year = searchParams.get('year')

    const where: any = {}
    if (year) where.year = parseInt(year, 10)
    if (subjectSlug) where.subject = { slug: subjectSlug }

    const pyqs = await db.pYQ.findMany({
      where,
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      include: {
        subject: { select: { id: true, name: true, slug: true, color: true } },
        topic: { select: { id: true, name: true, slug: true } },
      },
    })

    // Also include questions marked as isPYQ
    const pyqQuestions = await db.question.findMany({
      where: { isPYQ: true, ...(subjectSlug ? { topic: { unit: { subject: { slug: subjectSlug } } } } : {}) },
      orderBy: { pyqYear: 'desc' },
      include: {
        topic: { include: { unit: { include: { subject: true } } } },
      },
    })

    return NextResponse.json({ pyqs, pyqQuestions, count: pyqs.length + pyqQuestions.length })
  } catch (e) {
    console.error('[api/pyqs] error', e)
    return NextResponse.json({ error: 'Failed to fetch PYQs' }, { status: 500 })
  }
}
