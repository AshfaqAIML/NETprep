import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const article = await db.article.findUnique({
      where: { slug },
      include: { subject: true },
    })
    if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    return NextResponse.json({ article })
  } catch (e) {
    console.error('[api/articles/[slug]] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
