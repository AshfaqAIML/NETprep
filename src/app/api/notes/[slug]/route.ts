import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const note = await db.note.findUnique({
      where: { slug },
      include: {
        subject: true,
        topic: { include: { unit: { include: { subject: true } } } },
      },
    })
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

    // increment views
    await db.note.update({
      where: { id: note.id },
      data: { views: { increment: 1 } },
    })

    // Sequential navigation: order notes by course contents (unit → topic → createdAt) §fix
    let related: any[] = []
    let next: any = null
    let prev: any = null
    if (note.subjectId) {
      const allNotes = await db.note.findMany({
        where: { subjectId: note.subjectId },
        include: { topic: { include: { unit: true } } },
        orderBy: [{ createdAt: 'asc' }],
      })
      // Sort by unit.sortOrder → topic.sortOrder → numeric part/title for natural sequence (fixes Part 2 → 3 not 33)
      const numFrom = (s: string) => {
        const m = s.match(/(\d+)\s*$/)
        return m ? parseInt(m[1], 10) : 9999
      }
      allNotes.sort((a: any, b: any) => {
        const ua = a.topic?.unit?.sortOrder ?? 999
        const ub = b.topic?.unit?.sortOrder ?? 999
        if (ua !== ub) return ua - ub
        const ta = a.topic?.sortOrder ?? 999
        const tb = b.topic?.sortOrder ?? 999
        if (ta !== tb) return ta - tb
        // Natural numeric sort for Part 2,3,...33 (slug/title may contain number)
        const na = numFrom(a.slug) !== 9999 ? numFrom(a.slug) : numFrom(a.title)
        const nb = numFrom(b.slug) !== 9999 ? numFrom(b.slug) : numFrom(b.title)
        if (na !== 9999 && nb !== 9999 && na !== nb) return na - nb
        const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0
        if (ca !== cb) return ca - cb
        return a.slug.localeCompare(b.slug)
      })
      const idx = allNotes.findIndex((n: any) => n.id === note.id)
      if (idx !== -1) {
        if (idx > 0) prev = allNotes[idx - 1]
        if (idx < allNotes.length - 1) next = allNotes[idx + 1]
        // Related: immediate neighbours + next in sequence (not random by views)
        const start = Math.max(0, idx - 1)
        related = allNotes.slice(start, idx + 3).filter((n: any) => n.id !== note.id).slice(0, 4)
        // Strip heavy topic/unit for related payload
        related = related.map(({ topic, ...r }: any) => r)
      }
    }

    return NextResponse.json({ note, related, next, prev })
  } catch (e) {
    console.error('[api/notes/[slug]] error', e)
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 })
  }
}
