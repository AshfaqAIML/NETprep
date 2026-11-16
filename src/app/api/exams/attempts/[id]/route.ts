import { NextResponse } from 'next/server'
import {
  getAttemptPayload,
  saveAttempt,
  type SaveAttemptInput,
} from '@/lib/cbt/attempt'
import { getCbtIdentity } from '@/lib/cbt/candidate'
import { cbtErrorResponse } from '@/lib/cbt/http'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const identity = await getCbtIdentity()
    const payload = await getAttemptPayload(id, identity.userId)
    return NextResponse.json(payload)
  } catch (error) {
    return cbtErrorResponse(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as SaveAttemptInput
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'A response or position payload is required', code: 'INVALID_REQUEST' },
        { status: 400 },
      )
    }

    const identity = await getCbtIdentity()
    const payload = await saveAttempt(id, identity.userId, body)
    return NextResponse.json(payload)
  } catch (error) {
    return cbtErrorResponse(error)
  }
}
