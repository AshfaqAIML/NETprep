import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const where: any = {}
    if (status) where.status = status

    const reports = await db.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json({ reports })
  } catch (e) {
    console.error('[api/reports] GET error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { itemType, itemId, issueType, description } = body

    if (!itemType || !itemId || !issueType) {
      return NextResponse.json(
        { error: 'itemType, itemId, and issueType are required' },
        { status: 400 },
      )
    }

    const report = await db.report.create({
      data: {
        userId: 'demo-user',
        itemType,
        itemId,
        issueType,
        description: description || null,
      },
    })
    return NextResponse.json({ report })
  } catch (e) {
    console.error('[api/reports] POST error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
