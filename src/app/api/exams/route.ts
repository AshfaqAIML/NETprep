import { NextResponse } from 'next/server'
import { getCbtCatalogue } from '@/lib/cbt/catalogue'
import { getCbtIdentity } from '@/lib/cbt/candidate'
import { cbtErrorResponse } from '@/lib/cbt/http'

export async function GET() {
  try {
    const identity = await getCbtIdentity()
    const catalogue = await getCbtCatalogue(identity)
    return NextResponse.json(catalogue)
  } catch (error) {
    return cbtErrorResponse(error)
  }
}
