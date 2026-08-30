import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, title, content, tags } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const note = await db.bookNote.update({
      where: { id },
      data: { title, content, tags },
    })
    return NextResponse.json({ note })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await db.bookNote.delete({ where: { id } })
    return NextResponse.json({ deleted: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
