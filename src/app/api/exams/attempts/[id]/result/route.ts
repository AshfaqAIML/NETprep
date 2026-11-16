import { NextResponse } from 'next/server'
import { getAttemptResult } from '@/lib/cbt/attempt'
import { getCbtIdentity } from '@/lib/cbt/candidate'
import { cbtErrorResponse } from '@/lib/cbt/http'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const identity = await getCbtIdentity()
    const result = await getAttemptResult(id, identity.userId)
    return NextResponse.json({ result })
  } catch (error) {
    return cbtErrorResponse(error)
  }
}
