import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/pyqs/sources — Source registry
 *
 * Returns all registered PYQ sources with their authority level,
 * verification status, and question counts.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const authorityLevel = searchParams.get('authority')

    const where: any = {}
    if (authorityLevel) where.authorityLevel = authorityLevel

    const sources = await db.pYQSource.findMany({
      where,
      orderBy: [{ examYear: 'desc' }, { examCycle: 'asc' }],
    })

    return NextResponse.json({
      sources,
      count: sources.length,
      summary: {
        total: sources.length,
        official: sources.filter((s) => s.sourceType === 'official').length,
        verified: sources.filter((s) => s.verificationStatus === 'verified').length,
        withAnswerKey: sources.filter((s) => s.answerKeyAvailable).length,
      },
    })
  } catch (e) {
    console.error('[api/pyqs/sources] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
