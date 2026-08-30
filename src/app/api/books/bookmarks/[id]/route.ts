import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getCurrentUserId } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * DELETE /api/books/bookmarks/[id] — Delete a bookmark
 * §22 user isolation — verify ownership via userId
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await getCurrentUserId(session) // §22 isolation — falls back to demo-user if no session
    const { id } = await params
    // §22 isolation — ensure bookmark belongs to current user
    const existing = await db.bookBookmark.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await db.bookBookmark.delete({ where: { id } })
    return NextResponse.json({ deleted: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
