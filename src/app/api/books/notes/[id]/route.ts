import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getCurrentUserId } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * PATCH /api/books/notes/[id] — Update a note
 * DELETE /api/books/notes/[id] — Delete a note
 * §22 user isolation — verify ownership via userId
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await getCurrentUserId(session) // §22 isolation — falls back to demo-user if no session
    const body = await req.json()
    const { id, title, content, tags } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // §22 isolation — ensure note belongs to current user
    const existing = await db.bookNote.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

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
    const session = await getServerSession(authOptions)
    const userId = await getCurrentUserId(session) // §22 isolation — falls back to demo-user if no session
    const { id } = await params
    // §22 isolation — ensure note belongs to current user
    const existing = await db.bookNote.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await db.bookNote.delete({ where: { id } })
    return NextResponse.json({ deleted: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
