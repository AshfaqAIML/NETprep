import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getCurrentUserId } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * PATCH /api/books/highlights/[id] — Update a highlight
 * DELETE /api/books/highlights/[id] — Delete a highlight
 * §22 user isolation — verify ownership via userId
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await getCurrentUserId(session) // §22 isolation — falls back to demo-user if no session
    const body = await req.json()
    const { id, color } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // §22 isolation — ensure highlight belongs to current user
    const existing = await db.highlight.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const highlight = await db.highlight.update({
      where: { id },
      data: { color },
    })
    return NextResponse.json({ highlight })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await getCurrentUserId(session) // §22 isolation — falls back to demo-user if no session
    const { id } = await params
    // §22 isolation — ensure highlight belongs to current user
    const existing = await db.highlight.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await db.highlight.delete({ where: { id } })
    return NextResponse.json({ deleted: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
