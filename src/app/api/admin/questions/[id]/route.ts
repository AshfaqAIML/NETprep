import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await req.json()

    const question = await db.question.update({
      where: { id },
      data: body,
    })

    return NextResponse.json({ question })
  } catch (e) {
    console.error('[api/admin/questions/[id] PATCH] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await db.question.delete({ where: { id } })
    return NextResponse.json({ deleted: true })
  } catch (e) {
    console.error('[api/admin/questions/[id] DELETE] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
