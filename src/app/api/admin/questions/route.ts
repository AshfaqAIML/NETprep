import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/admin/questions — List all questions with filters
 * POST /api/admin/questions — Create a new question
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sourceType = searchParams.get('sourceType')
    const paper = searchParams.get('paper')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') ?? '100', 10)

    const where: any = {}
    if (sourceType) where.sourceType = sourceType
    if (paper) where.paper = paper
    if (status) where.status = status
    if (search) {
      where.OR = [
        { questionText: { contains: search } },
        { sourceReference: { contains: search } },
        { tags: { contains: search } },
      ]
    }

    const questions = await db.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        topic: { include: { unit: { include: { subject: true } } } },
      },
    })

    return NextResponse.json({ questions, count: questions.length })
  } catch (e) {
    console.error('[api/admin/questions GET] error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      questionText, optionA, optionB, optionC, optionD,
      correctAnswer, explanation, difficulty, questionType,
      paper, sourceType, topicId,
      pyqYear, pyqSession, pyqShift, pyqQuestionNumber, pyqExamDate, pyqPaperId,
      source, sourceUrl, sourceReference, answerKeyRef,
      learningObjective, tags,
    } = body

    if (!questionText?.trim() || !optionA?.trim() || !optionB?.trim()) {
      return NextResponse.json({ error: 'questionText, optionA, optionB are required' }, { status: 400 })
    }

    // Generate fingerprint
    const { createHash } = await import('crypto')
    const fp = createHash('sha256')
      .update(questionText.toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '').trim())
      .digest('hex').substring(0, 32)

    const isOfficial = sourceType === 'official_pyq' || sourceType === 'verified_pyq'

    const question = await db.question.create({
      data: {
        questionText: questionText.trim(),
        optionA: optionA.trim(),
        optionB: optionB.trim(),
        optionC: optionC?.trim() ?? '',
        optionD: optionD?.trim() ?? '',
        correctAnswer: correctAnswer ?? 'A',
        explanation: explanation ?? '',
        difficulty: difficulty ?? 'medium',
        questionType: questionType ?? 'mcq',
        paper: paper ?? 'II',
        sourceType: sourceType ?? 'practice',
        topicId: topicId || null,
        isPYQ: isOfficial,
        pyqYear: pyqYear || null,
        pyqSession: pyqSession || null,
        pyqShift: pyqShift || null,
        pyqQuestionNumber: pyqQuestionNumber || null,
        pyqExamDate: pyqExamDate || null,
        pyqPaperId: pyqPaperId || null,
        source: source || null,
        sourceUrl: sourceUrl || null,
        sourceReference: sourceReference || null,
        answerKeyRef: answerKeyRef || null,
        verified: sourceType === 'official_pyq',
        verifiedAt: sourceType === 'official_pyq' ? new Date() : null,
        verificationStatus: sourceType === 'official_pyq' ? 'officially_verified' : 'unverified',
        answerConfidence: sourceType === 'official_pyq' ? 'high' : null,
        fingerprint: fp,
        isCurrentSyllabus: true,
        syllabusVersion: '2024',
        learningObjective: learningObjective || null,
        tags: tags ?? '',
        status: 'published',
      },
    })

    return NextResponse.json({ question }, { status: 201 })
  } catch (e) {
    console.error('[api/admin/questions POST] error', e)
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
  }
}
