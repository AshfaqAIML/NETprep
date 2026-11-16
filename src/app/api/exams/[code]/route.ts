import { NextResponse } from 'next/server'
import { getCbtIdentity } from '@/lib/cbt/candidate'
import { getCbtProfileDetail } from '@/lib/cbt/catalogue'
import { cbtErrorResponse } from '@/lib/cbt/http'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params
    const identity = await getCbtIdentity()
    const detail = await getCbtProfileDetail(identity, code)
    return NextResponse.json(detail)
  } catch (error) {
    return cbtErrorResponse(error)
  }
}
