import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

/**
 * GET /api/pyqs/dedup — Duplicate detection via question fingerprints
 *
 * Returns:
 *   - duplicates: groups of questions sharing the same fingerprint
 *   - stats: total questions, with fingerprint, duplicate groups, duplicate questions
 *   - unverifiedDuplicates: questions that need manual review
 */
export async function GET() {
  try {
    // Get all questions with fingerprints
    const questions = await db.question.findMany({
      where: { fingerprint: { not: null } },
      select: {
        id: true,
        questionText: true,
        fingerprint: true,
        sourceType: true,
        pyqYear: true,
        pyqSession: true,
        pyqPaperId: true,
        sourceReference: true,
        topic: { select: { name: true, unit: { select: { name: true } } } },
      },
    })

    // Group by fingerprint
    const fingerprintMap: Record<string, any[]> = {}
    for (const q of questions) {
      const fp = q.fingerprint!
      if (!fingerprintMap[fp]) fingerprintMap[fp] = []
      fingerprintMap[fp].push(q)
    }

    // Find duplicates (groups with 2+ questions)
    const duplicateGroups = Object.entries(fingerprintMap)
      .filter(([, qs]) => qs.length > 1)
      .map(([fingerprint, qs]) => ({
        fingerprint,
        count: qs.length,
        questions: qs.map((q) => ({
          id: q.id,
          questionText: q.questionText.substring(0, 120) + (q.questionText.length > 120 ? '...' : ''),
          sourceType: q.sourceType,
          pyqYear: q.pyqYear,
          pyqSession: q.pyqSession,
          pyqPaperId: q.pyqPaperId,
          sourceReference: q.sourceReference,
          topicName: q.topic?.name,
          unitName: q.topic?.unit?.name,
        })),
      }))
      .sort((a, b) => b.count - a.count)

    // Stats
    const totalQuestions = await db.question.count()
    const withFingerprint = questions.length
    const duplicateGroupCount = duplicateGroups.length
    const duplicateQuestionCount = duplicateGroups.reduce((s, g) => s + g.count, 0)

    // Questions without fingerprint (need fingerprinting)
    const withoutFingerprint = await db.question.count({
      where: { fingerprint: null },
    })

    return NextResponse.json({
      duplicates: duplicateGroups,
      stats: {
        totalQuestions,
        withFingerprint,
        withoutFingerprint,
        duplicateGroups: duplicateGroupCount,
        duplicateQuestions: duplicateQuestionCount,
        uniqueQuestions: withFingerprint - duplicateQuestionCount + duplicateGroupCount,
      },
    })
  } catch (e) {
    console.error('[api/pyqs/dedup] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

/**
 * POST /api/pyqs/dedup — Generate fingerprints for questions that don't have them
 */
export async function POST() {
  try {
    const questions = await db.question.findMany({
      where: { fingerprint: null },
      select: { id: true, questionText: true },
    })

    let updated = 0
    for (const q of questions) {
      const normalized = q.questionText
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^a-z0-9 ]/g, '')
        .trim()
      const fp = createHash('sha256').update(normalized).digest('hex').substring(0, 32)

      try {
        await db.question.update({
          where: { id: q.id },
          data: { fingerprint: fp },
        })
        updated++
      } catch (e) {
        // Unique constraint — fingerprint already exists (duplicate question)
        console.log(`Duplicate detected for question ${q.id}`)
      }
    }

    return NextResponse.json({
      message: `Generated fingerprints for ${updated} questions`,
      updated,
    })
  } catch (e) {
    console.error('[api/pyqs/dedup POST] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
