import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const itemType = searchParams.get('itemType')

    if (itemType) {
      const bookmarks = await db.bookmark.findMany({
        where: { userId: 'demo-user', itemType },
        select: { itemId: true },
      })
      return NextResponse.json({
        bookmarkedIds: bookmarks.map((b) => b.itemId),
      })
    }

    const bookmarks = await db.bookmark.findMany({
      where: { userId: 'demo-user' },
      select: { itemId: true, itemType: true },
    })
    return NextResponse.json({
      bookmarks: bookmarks.map((b) => `${b.itemType}:${b.itemId}`),
    })
  } catch (e) {
    console.error('[api/bookmarks/status] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await db.bookmark.deleteMany({ where: { id, userId: 'demo-user' } })
    return NextResponse.json({ deleted: true })
  } catch (e) {
    console.error('[api/bookmarks/[id]] DELETE error', e)
    return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 })
  }
}
