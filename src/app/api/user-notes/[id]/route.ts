import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await db.userNote.deleteMany({ where: { id, userId: 'demo-user' } })
    return NextResponse.json({ deleted: true })
  } catch (e) {
    console.error('[api/user-notes/[id]] DELETE error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
