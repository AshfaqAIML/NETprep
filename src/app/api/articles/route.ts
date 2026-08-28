import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')

    const where: any = { published: true }
    if (category) where.category = category
    if (featured === 'true') where.featured = true

    const articles = await db.article.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
      include: {
        subject: { select: { slug: true, name: true, color: true } },
      },
    })
    return NextResponse.json({ articles })
  } catch (e) {
    console.error('[api/articles] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
