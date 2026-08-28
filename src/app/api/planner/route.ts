import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const tasks = await db.studyTask.findMany({
      where: { userId: 'demo-user' },
      orderBy: [{ scheduledDate: 'asc' }, { startTime: 'asc' }],
    })
    return NextResponse.json({ tasks })
  } catch (e) {
    console.error('[api/planner] GET error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, scheduledDate, startTime, duration = 60, priority = 'medium', category = 'study' } = body

    if (!title || !scheduledDate) {
      return NextResponse.json({ error: 'title and scheduledDate required' }, { status: 400 })
    }

    const task = await db.studyTask.create({
      data: {
        userId: 'demo-user',
        title,
        description,
        scheduledDate,
        startTime,
        duration,
        priority,
        category,
      },
    })
    return NextResponse.json({ task })
  } catch (e) {
    console.error('[api/planner] POST error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, completed, ...rest } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const task = await db.studyTask.update({
      where: { id },
      data: { ...(typeof completed === 'boolean' ? { completed } : {}), ...rest },
    })
    return NextResponse.json({ task })
  } catch (e) {
    console.error('[api/planner] PATCH error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
