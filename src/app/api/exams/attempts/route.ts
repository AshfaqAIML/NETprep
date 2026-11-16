import { NextResponse } from 'next/server'
import { startAttempt } from '@/lib/cbt/attempt'
import { getCbtIdentity } from '@/lib/cbt/candidate'
import { cbtErrorResponse } from '@/lib/cbt/http'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const profileCode = typeof body.profileCode === 'string' ? body.profileCode.trim() : ''
    if (!profileCode) {
      return NextResponse.json(
        { error: 'profileCode is required', code: 'INVALID_REQUEST' },
        { status: 400 },
      )
    }

    const identity = await getCbtIdentity()
    const payload = await startAttempt({
      userId: identity.userId,
      candidate: identity.candidate,
      profileCode,
    })
    return NextResponse.json(payload, { status: payload.resumed ? 200 : 201 })
  } catch (error) {
    return cbtErrorResponse(error)
  }
}
