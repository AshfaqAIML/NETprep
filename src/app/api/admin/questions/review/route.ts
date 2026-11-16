import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * Administrator review queue for generated question-bank content.
 *
 * New bank rows are imported with status "review". The CBT pool only reads
 * status "published", so nothing in this queue can appear in a mock examination
 * until an administrator approves it here.
 */

type ReviewAction = 'approve' | 'reject' | 'reset'

function parseVerification(value: string | null): unknown {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function requiresVerification(row: {
  presentationType: string
  tags: string
  verificationData: string | null
}): boolean {
  if (row.verificationData) return false
  if (row.presentationType === 'code' || row.presentationType === 'mathematical') {
    return true
  }
  const tags = row.tags.toLowerCase()
  return ['calculation', 'sql', 'automata', 'dfa', 'graph', 'circuit', 'boolean'].some(
    (tag) => tags.includes(tag),
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? 'review'
    const unit = searchParams.get('unit')
    const batch = searchParams.get('batch')
    const search = searchParams.get('search')?.trim()
    const limit = Math.min(
      500,
      Math.max(1, Number.parseInt(searchParams.get('limit') ?? '200', 10) || 200),
    )

    const where: any = { status }
    if (unit) where.syllabusUnit = unit
    if (batch) where.batch = batch
    if (search) {
      where.OR = [
        { questionText: { contains: search, mode: 'insensitive' } },
        { questionCode: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
        { topic: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [questions, statusGroups, unitGroups, batchGroups] = await Promise.all([
      db.question.findMany({
        where,
        orderBy: [
          { paper: 'asc' },
          { syllabusUnit: 'asc' },
          { questionCode: 'asc' },
          { createdAt: 'asc' },
        ],
        take: limit,
        include: {
          topic: {
            include: {
              unit: { include: { subject: true } },
            },
          },
        },
      }),
      db.question.groupBy({
        by: ['status'],
        where: { questionCode: { startsWith: 'UGC-' } },
        _count: { _all: true },
      }),
      db.question.groupBy({
        by: ['syllabusUnit', 'status'],
        where: { status: 'review', syllabusUnit: { not: null } },
        _count: { _all: true },
      }),
      db.question.groupBy({
        by: ['batch', 'status'],
        where: { status: 'review', batch: { not: null } },
        _count: { _all: true },
      }),
    ])

    const counts = {
      review: 0,
      published: 0,
      rejected: 0,
      archived: 0,
      draft: 0,
    }
    for (const row of statusGroups) {
      if (row.status in counts) {
        counts[row.status as keyof typeof counts] = row._count._all
      }
    }

    return NextResponse.json({
      status,
      counts,
      units: unitGroups
        .filter((row) => row.syllabusUnit)
        .map((row) => ({
          unit: row.syllabusUnit,
          count: row._count._all,
        }))
        .sort((left, right) => (left.unit ?? '').localeCompare(right.unit ?? '')),
      batches: batchGroups
        .filter((row) => row.batch)
        .map((row) => ({
          batch: row.batch,
          count: row._count._all,
        }))
        .sort((left, right) => (left.batch ?? '').localeCompare(right.batch ?? '')),
      questions: questions.map((row) => ({
        ...row,
        verification: parseVerification(row.verificationData),
      })),
      count: questions.length,
    })
  } catch (error) {
    console.error('[api/admin/questions/review GET] error', error)
    return NextResponse.json({ error: 'Failed to load review queue' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
      : []
    const action = body?.action as ReviewAction
    if (ids.length === 0) {
      return NextResponse.json({ error: 'At least one question id is required' }, { status: 400 })
    }
    if (!['approve', 'reject', 'reset'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be approve, reject or reset' },
        { status: 400 },
      )
    }

    const session = await getServerSession(authOptions)
    const reviewer =
      (typeof body?.reviewer === 'string' && body.reviewer.trim()) ||
      session?.user?.email ||
      session?.user?.name ||
      'NETPrep administrator'
    const notes =
      typeof body?.notes === 'string' && body.notes.trim() ? body.notes.trim() : null

    if (action === 'approve') {
      const rows = await db.question.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          questionCode: true,
          presentationType: true,
          tags: true,
          verificationData: true,
        },
      })
      const unverified = rows.filter((row) => requiresVerification(row))
      if (unverified.length > 0) {
        return NextResponse.json(
          {
            error:
              'Some questions require independent verification before approval',
            questionCodes: unverified.map((row) => row.questionCode),
          },
          { status: 400 },
        )
      }
    }

    const data =
      action === 'approve'
        ? {
            status: 'published',
            verified: true,
            verifiedAt: new Date(),
            verificationStatus: 'expert_verified',
            answerConfidence: 'high',
            reviewedBy: reviewer,
            reviewNotes: notes,
          }
        : action === 'reject'
          ? {
              status: 'rejected',
              verified: false,
              verifiedAt: null,
              verificationStatus: 'disputed',
              answerConfidence: 'low',
              reviewedBy: reviewer,
              reviewNotes: notes,
            }
          : {
              status: 'review',
              verified: false,
              verifiedAt: null,
              verificationStatus: 'unverified',
              answerConfidence: 'medium',
              reviewedBy: reviewer,
              reviewNotes: notes,
            }

    const result = await db.question.updateMany({
      where: { id: { in: ids } },
      data,
    })

    return NextResponse.json({
      action,
      updated: result.count,
      reviewer,
      notes,
    })
  } catch (error) {
    console.error('[api/admin/questions/review POST] error', error)
    return NextResponse.json({ error: 'Failed to update review queue' }, { status: 500 })
  }
}
