import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/progress/topic
// Body: { topicId, status, confidence }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { topicId, status, confidence } = body

    if (!topicId || !status) {
      return NextResponse.json({ error: 'topicId and status are required' }, { status: 400 })
    }

    const progress = await db.topicProgress.upsert({
      where: {
        userId_topicId: {
          userId: 'demo-user',
          topicId,
        },
      },
      update: {
        status,
        ...(typeof confidence === 'number' ? { confidence } : {}),
      },
      create: {
        userId: 'demo-user',
        topicId,
        status,
        confidence: typeof confidence === 'number' ? confidence : 0,
      },
    })

    return NextResponse.json({ progress })
  } catch (e) {
    console.error('[api/progress/topic] error', e)
    return NextResponse.json({ error: 'Failed to update topic progress' }, { status: 500 })
  }
}
