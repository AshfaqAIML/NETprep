import { NextResponse } from 'next/server'
import { heartbeat } from '@/lib/cbt/attempt'
import { getCbtIdentity } from '@/lib/cbt/candidate'
import { cbtErrorResponse } from '@/lib/cbt/http'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const identity = await getCbtIdentity()
    const state = await heartbeat(id, identity.userId)
    return NextResponse.json(state)
  } catch (error) {
    return cbtErrorResponse(error)
  }
}
