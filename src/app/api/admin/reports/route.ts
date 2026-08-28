import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/admin/reports — List all content reports
 * PATCH /api/admin/reports — Update report status
 */
export async function GET() {
  try {
    const reports = await db.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Hydrate with question data where applicable
    const hydrated = await Promise.all(
      reports.map(async (r) => {
        let item: any = null
        if (r.itemType === 'question') {
          item = await db.question.findUnique({
            where: { id: r.itemId },
            select: { questionText: true, correctAnswer: true, sourceType: true, pyqYear: true },
          })
        }
        return { ...r, item }
      }),
    )

    return NextResponse.json({ reports: hydrated, count: hydrated.length })
  } catch (e) {
    console.error('[api/admin/reports GET] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, status } = body
    if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })

    const report = await db.report.update({
      where: { id },
      data: { status },
    })
    return NextResponse.json({ report })
  } catch (e) {
    console.error('[api/admin/reports PATCH] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
