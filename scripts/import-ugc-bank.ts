/**
 * Import the original UGC-NET practice bank into the review queue.
 *
 * Run: bun scripts/import-ugc-bank.ts
 *      bun scripts/import-ugc-bank.ts --unit P1-U05
 *      bun scripts/import-ugc-bank.ts --reset-review
 *
 * New rows are created with status "review". They are invisible to the CBT
 * pool until an administrator approves them through /api/admin/questions/review.
 * Re-running the importer updates content without silently republishing a
 * rejected or archived question unless --reset-review is supplied.
 */

import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { db } from '../src/lib/db'
import { UGC_BANK_UNITS, ugcBankUnit } from '../content/ugc-net/manifest'
import type { UgcQuestion } from '../content/ugc-net/types'

const contentDir = join(import.meta.dir, '..', 'content', 'ugc-net')
const unitFilter = (() => {
  const index = process.argv.indexOf('--unit')
  return index >= 0 ? process.argv[index + 1] : null
})()
const resetReview = process.argv.includes('--reset-review')

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function subjectNameFor(paper: 'I' | 'II'): string {
  return paper === 'I'
    ? 'Paper I — Teaching & Research Aptitude'
    : 'Computer Science & Applications'
}

function assertImportable(question: UgcQuestion): void {
  if (!question.code || !/^UGC-P[12]-U\d{2}-\d{3}$/.test(question.code)) {
    throw new Error(`Invalid question code: ${question.code}`)
  }
  if (question.responseType !== 'single') {
    throw new Error(`${question.code}: only single-response questions are imported by this bank`)
  }
  if (question.marks !== 2) throw new Error(`${question.code}: marks must be 2`)
  for (const key of ['A', 'B', 'C', 'D'] as const) {
    if (!question.options[key]?.trim()) {
      throw new Error(`${question.code}: option ${key} is empty`)
    }
  }
  if (!['A', 'B', 'C', 'D'].includes(question.correctAnswer)) {
    throw new Error(`${question.code}: invalid correct answer`)
  }
  if (question.sourceType !== 'practice' || question.source !== 'NETPrep original practice bank') {
    throw new Error(`${question.code}: source must be NETPrep original practice bank`)
  }
}

const glob = new Bun.Glob('paper-*/u*-b*.ts')
const files = Array.from(glob.scanSync({ cwd: contentDir })).sort()
if (files.length === 0) {
  console.log('No bank batch files found.')
  process.exit(0)
}

const questions: UgcQuestion[] = []
for (const file of files) {
  const module = (await import(pathToFileURL(join(contentDir, file)).href)) as {
    questions?: UgcQuestion[]
  }
  if (!Array.isArray(module.questions)) {
    throw new Error(`${file}: must export a named questions array`)
  }
  for (const question of module.questions) {
    if (unitFilter && question.unit !== unitFilter) continue
    assertImportable(question)
    questions.push(question)
  }
}

const unitRows = await db.unit.findMany({
  include: { subject: true },
})
const unitIndex = new Map<string, { id: string }>()
for (const row of unitRows) {
  unitIndex.set(`${row.subject.name}::${row.name}`, { id: row.id })
}

const topicIndex = new Map<string, string>()
async function resolveTopic(question: UgcQuestion): Promise<string> {
  const spec = ugcBankUnit(question.unit)
  const unit = unitIndex.get(`${subjectNameFor(spec.paper)}::${spec.legacyUnit}`)
  if (!unit) {
    throw new Error(
      `${question.code}: editorial unit "${spec.legacyUnit}" was not found under ${subjectNameFor(spec.paper)}`,
    )
  }
  const key = `${unit.id}::${question.topic}`
  const cached = topicIndex.get(key)
  if (cached) return cached
  const slug = slugify(question.topic)
  const topic = await db.topic.upsert({
    where: { unitId_slug: { unitId: unit.id, slug } },
    update: {},
    create: {
      unitId: unit.id,
      slug,
      name: question.topic,
      importance: 'medium',
    },
    select: { id: true },
  })
  topicIndex.set(key, topic.id)
  return topic.id
}

let created = 0
let updated = 0
let staged = 0
let published = 0

for (const question of questions) {
  const topicId = await resolveTopic(question)
  const data = {
    topicId,
    syllabusUnit: question.unit,
    questionCode: question.code,
    examName: question.examName,
    subject: question.subject,
    subtopic: question.subtopic,
    cognitiveSkill: question.cognitiveSkill,
    marks: question.marks,
    batch: question.batch,
    provenance: question.provenance,
    verificationData: question.verification ? JSON.stringify(question.verification) : null,
    questionText: question.questionText,
    optionA: question.options.A,
    optionB: question.options.B,
    optionC: question.options.C,
    optionD: question.options.D,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    difficulty: question.difficulty,
    questionType: question.questionType,
    paper: question.paper,
    responseType: question.responseType,
    correctOptions: null,
    numericAnswer: null,
    numericTolerance: null,
    numericToleranceMode: null,
    numericPrecision: null,
    presentationType: question.presentationType,
    passage: question.passage ?? null,
    codeSnippet: question.codeSnippet ?? null,
    tableMarkdown: question.tableMarkdown ?? null,
    imageUrl: question.imageUrl ?? null,
    gateSection: null,
    sourceType: 'practice',
    isPYQ: false,
    pyqYear: null,
    pyqSession: null,
    pyqShift: null,
    pyqQuestionNumber: null,
    pyqExamDate: null,
    pyqPaperId: null,
    source: question.source,
    sourceUrl: question.sourceUrl ?? null,
    sourceReference: question.code,
    answerKeyRef: question.verification ? 'NETPrep verification harness' : null,
    verificationStatus: 'unverified',
    answerConfidence: 'medium',
    answerSource: question.verification
      ? 'NETPrep independent verification harness'
      : 'NETPrep editorial review',
    fingerprint: `ugc-bank-${question.code}`,
    isCurrentSyllabus: true,
    syllabusVersion: '2026',
    learningObjective: question.learningObjective,
    tags: question.tags.join(','),
  }

  const existing = await db.question.findUnique({
    where: { questionCode: question.code },
    select: { id: true, status: true },
  })

  if (existing) {
    await db.question.update({
      where: { id: existing.id },
      data: resetReview
        ? {
            ...data,
            status: 'review',
            verified: false,
            verifiedAt: null,
            verificationStatus: 'unverified',
            answerConfidence: 'medium',
            reviewedBy: null,
            reviewNotes: null,
          }
        : data,
    })
    updated += 1
    if (resetReview) staged += 1
    else if (existing.status === 'published') published += 1
  } else {
    await db.question.create({
      data: {
        ...data,
        status: 'review',
        verified: false,
        verifiedAt: null,
        verificationStatus: 'unverified',
        answerConfidence: 'medium',
        reviewedBy: null,
        reviewNotes: null,
      },
    })
    created += 1
    staged += 1
  }
}

const bankRows = await db.question.groupBy({
  by: ['syllabusUnit', 'status'],
  where: { questionCode: { startsWith: 'UGC-' } },
  _count: { _all: true },
})
const bankByUnit = new Map<string, { review: number; published: number; other: number }>()
for (const row of bankRows) {
  if (!row.syllabusUnit) continue
  const entry = bankByUnit.get(row.syllabusUnit) ?? {
    review: 0,
    published: 0,
    other: 0,
  }
  if (row.status === 'review') entry.review += row._count._all
  else if (row.status === 'published') entry.published += row._count._all
  else entry.other += row._count._all
  bankByUnit.set(row.syllabusUnit, entry)
}

const publishedByUnit = await db.question.groupBy({
  by: ['syllabusUnit'],
  where: { status: 'published', responseType: 'single' },
  _count: { _all: true },
})
const publishedCounts = new Map(
  publishedByUnit
    .filter((row) => row.syllabusUnit)
    .map((row) => [row.syllabusUnit as string, row._count._all]),
)

console.log(
  `UGC bank import: ${created} created, ${updated} updated, ${staged} staged for review, ${published} already published.`,
)
for (const unit of UGC_BANK_UNITS) {
  if (unitFilter && unit.code !== unitFilter) continue
  const bank = bankByUnit.get(unit.code) ?? { review: 0, published: 0, other: 0 }
  const live = publishedCounts.get(unit.code) ?? 0
  console.log(
    `  ${unit.code} ${unit.shortName}: bank review=${bank.review}, bank published=${bank.published}, total published=${live}/${unit.targetTotal}`,
  )
}

await db.$disconnect()
