import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const profile = await db.userProfile.findUnique({ where: { userId: 'demo-user' } })
    return NextResponse.json({ profile })
  } catch (e) {
    console.error('[api/profile] GET error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, targetExam, paperTwoSubject, dailyHours, prepLevel, examDate } = body

    const profile = await db.userProfile.upsert({
      where: { userId: 'demo-user' },
      update: {
        ...(name ? { name } : {}),
        ...(targetExam ? { targetExam } : {}),
        ...(paperTwoSubject ? { paperTwoSubject } : {}),
        ...(typeof dailyHours === 'number' ? { dailyHours } : {}),
        ...(prepLevel ? { prepLevel } : {}),
        ...(examDate ? { examDate } : {}),
      },
      create: {
        userId: 'demo-user',
        name: name ?? 'Student',
        targetExam: targetExam ?? 'UGC NET',
        paperTwoSubject: paperTwoSubject ?? 'Computer Science',
        dailyHours: dailyHours ?? 3,
        prepLevel: prepLevel ?? 'Beginner',
        examDate,
      },
    })
    return NextResponse.json({ profile })
  } catch (e) {
    console.error('[api/profile] PATCH error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
