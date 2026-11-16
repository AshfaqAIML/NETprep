import { NextResponse } from 'next/server'
import { submitAttempt, type SubmitAttemptInput } from '@/lib/cbt/attempt'
import { getCbtIdentity } from '@/lib/cbt/candidate'
import { cbtErrorResponse } from '@/lib/cbt/http'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as SubmitAttemptInput
    const identity = await getCbtIdentity()
    const payload = await submitAttempt(id, identity.userId, body)
    return NextResponse.json(payload)
  } catch (error) {
    return cbtErrorResponse(error)
  }
}
