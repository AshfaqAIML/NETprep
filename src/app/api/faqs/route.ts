import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const faqs = await db.faq.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    })
    // group by category
    const grouped: Record<string, typeof faqs> = {}
    for (const f of faqs) {
      if (!grouped[f.category]) grouped[f.category] = []
      grouped[f.category].push(f)
    }
    return NextResponse.json({ faqs: grouped })
  } catch (e) {
    console.error('[api/faqs] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
