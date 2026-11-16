/**
 * Database adapter for CBT question candidates.
 *
 * The rest of the CBT code works with `CbtQuestionCandidate`, not Prisma rows.
 * This keeps paper selection deterministic and unit-testable while ensuring
 * malformed or incomplete questions never enter a delivered paper.
 */

import { db } from '@/lib/db'
import { ugcUnitByCode } from '../exam/ugc-units'
import type {
  NumericToleranceMode,
  QuestionPresentationType,
  ResponseType,
} from '../exam/types'
import type { CbtHindiContent, CbtQuestionCandidate } from './types'

const RESPONSE_TYPES = new Set<ResponseType>(['single', 'multiple', 'numeric'])
const PRESENTATION_TYPES = new Set<QuestionPresentationType>([
  'text',
  'passage',
  'table',
  'diagram',
  'code',
  'mathematical',
  'data-interpretation',
])
const DIFFICULTIES = new Set(['easy', 'medium', 'hard'])
const OPTION_IDS = new Set(['A', 'B', 'C', 'D'])

/**
 * Paper I units that are genuinely aptitude-like. GATE General Aptitude must
 * not be filled with teaching-aptitude questions merely because they share the
 * Paper I classification.
 */
export const GENERAL_APTITUDE_UNITS = new Set([
  'Logical Reasoning',
  'Mathematical Reasoning & Aptitude',
  'Data Interpretation',
  'Reading Comprehension',
  'Communication',
])

function normalizeOptionId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const id = value.trim().toUpperCase()
  return OPTION_IDS.has(id) ? id : null
}

function parseCorrectOptions(row: any): string[] | null {
  if (row.correctOptions) {
    try {
      const parsed = JSON.parse(row.correctOptions)
      if (Array.isArray(parsed)) {
        const ids = parsed
          .map(normalizeOptionId)
          .filter((id): id is string => id !== null)
        if (ids.length > 0) return Array.from(new Set(ids)).sort()
      }
    } catch {
      // Fall through to the legacy comma-separated answer key.
    }
  }
  if (row.responseType === 'multiple') {
    const ids = String(row.correctAnswer ?? '')
      .split(',')
      .map(normalizeOptionId)
      .filter((id): id is string => id !== null)
    return ids.length > 0 ? Array.from(new Set(ids)).sort() : null
  }
  return null
}

function inferPresentationType(row: any): QuestionPresentationType {
  if (PRESENTATION_TYPES.has(row.presentationType)) {
    return row.presentationType as QuestionPresentationType
  }
  if (row.imageUrl) return 'diagram'
  if (row.tableMarkdown) return 'table'
  if (row.codeSnippet) return 'code'
  if (row.passage) return 'passage'
  if (typeof row.questionText === 'string' && row.questionText.includes('$')) {
    return 'mathematical'
  }
  return 'text'
}

function asToleranceMode(value: unknown): NumericToleranceMode | null {
  return value === 'absolute' || value === 'relative' || value === 'none'
    ? value
    : null
}

/**
 * Only reviewed Hindi rows are converted. Missing or empty translations return
 * null so the candidate falls back to the authoritative English text. Fields a
 * translator left untouched keep the English value: mathematical notation,
 * code and technical terms are intentionally preserved rather than translated.
 */
function reviewedHindi(row: any): CbtHindiContent | null {
  const translation = Array.isArray(row.translations) ? row.translations[0] : null
  if (!translation) return null
  if (typeof translation.questionText !== 'string' || !translation.questionText.trim()) {
    return null
  }
  return {
    questionText: translation.questionText,
    passage: translation.passage ?? row.passage ?? null,
    codeSnippet: translation.codeSnippet ?? row.codeSnippet ?? null,
    tableMarkdown: translation.tableMarkdown ?? row.tableMarkdown ?? null,
    optionA: translation.optionA ?? row.optionA ?? '',
    optionB: translation.optionB ?? row.optionB ?? '',
    optionC: translation.optionC ?? row.optionC ?? '',
    optionD: translation.optionD ?? row.optionD ?? '',
    explanation: translation.explanation ?? row.explanation ?? null,
  }
}

function toCandidate(row: any): CbtQuestionCandidate | null {
  const responseType: ResponseType = RESPONSE_TYPES.has(row.responseType)
    ? row.responseType
    : 'single'
  const difficulty = DIFFICULTIES.has(row.difficulty) ? row.difficulty : 'medium'
  const correctOptions = parseCorrectOptions({ ...row, responseType })
  const numericAnswerRaw =
    row.numericAnswer ??
    (responseType === 'numeric' ? Number(row.correctAnswer) : null)
  const numericAnswer =
    numericAnswerRaw !== null && Number.isFinite(Number(numericAnswerRaw))
      ? Number(numericAnswerRaw)
      : null

  const options = [row.optionA, row.optionB, row.optionC, row.optionD].map((value) =>
    typeof value === 'string' ? value.trim() : '',
  )
  const hasAllOptions = options.every((value) => value !== '')
  const correctOptionId = normalizeOptionId(row.correctAnswer)

  if (responseType === 'single' && (!hasAllOptions || !correctOptionId)) return null
  if (responseType === 'multiple' && (!hasAllOptions || !correctOptions || correctOptions.length === 0)) {
    return null
  }
  if (responseType === 'numeric' && numericAnswer === null) return null

  const syllabusUnit = ugcUnitByCode(row.syllabusUnit)
  return {
    id: row.id,
    paper: row.paper === 'II' ? 'II' : 'I',
    responseType,
    presentationType: inferPresentationType(row),
    difficulty: difficulty as 'easy' | 'medium' | 'hard',
    topicId: row.topicId ?? null,
    topicName: row.topic?.name ?? null,
    unitName: row.topic?.unit?.name ?? null,
    syllabusUnit: syllabusUnit?.code ?? null,
    syllabusUnitName: syllabusUnit?.name ?? null,
    gateSection: row.gateSection ?? null,
    verified: row.verified === true,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    questionText: row.questionText ?? '',
    optionA: options[0],
    optionB: options[1],
    optionC: options[2],
    optionD: options[3],
    correctAnswer: String(row.correctAnswer ?? ''),
    explanation: row.explanation ?? '',
    correctOptions,
    numericAnswer,
    numericTolerance:
      row.numericTolerance !== null && row.numericTolerance !== undefined
        ? Number(row.numericTolerance)
        : null,
    numericToleranceMode: asToleranceMode(row.numericToleranceMode),
    numericPrecision:
      row.numericPrecision !== null && row.numericPrecision !== undefined
        ? Number(row.numericPrecision)
        : null,
    passage: row.passage ?? null,
    codeSnippet: row.codeSnippet ?? null,
    tableMarkdown: row.tableMarkdown ?? null,
    imageUrl: row.imageUrl ?? null,
    hindi: reviewedHindi(row),
  }
}

export interface CbtPoolStats {
  paperOneSingle: number
  paperTwoSingle: number
  generalAptitude: number
  engineeringMathematics: number
  computerScience: number
  dataScience: number
  /** Deliverable single-response count keyed by official unit code (P1-U01 …). */
  unitSingleCounts: Record<string, number>
  totalDeliverable: number
}

export function isEngineeringMathematicsCandidate(question: CbtQuestionCandidate): boolean {
  return (
    question.gateSection === 'engineering-mathematics' ||
    question.unitName === 'Discrete Structures & Optimization'
  )
}

export function isDataScienceCandidate(question: CbtQuestionCandidate): boolean {
  return question.gateSection === 'data-science-ai'
}

export function isGeneralAptitudeCandidate(question: CbtQuestionCandidate): boolean {
  return (
    question.paper === 'I' &&
    question.responseType === 'single' &&
    GENERAL_APTITUDE_UNITS.has(question.unitName ?? '')
  )
}

export function isComputerScienceCandidate(question: CbtQuestionCandidate): boolean {
  return (
    question.paper === 'II' &&
    !isEngineeringMathematicsCandidate(question) &&
    !isDataScienceCandidate(question)
  )
}

/**
 * Count deliverable single-response questions per official unit. Questions
 * without a mapped unit are excluded from unit practice availability but still
 * count towards the paper-level totals.
 */
export function computeUnitSingleCounts(
  pool: CbtQuestionCandidate[],
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const question of pool) {
    if (question.responseType !== 'single' || !question.syllabusUnit) continue
    counts[question.syllabusUnit] = (counts[question.syllabusUnit] ?? 0) + 1
  }
  return counts
}

export function computePoolStats(pool: CbtQuestionCandidate[]): CbtPoolStats {
  return {
    paperOneSingle: pool.filter(
      (question) => question.paper === 'I' && question.responseType === 'single',
    ).length,
    paperTwoSingle: pool.filter(
      (question) => question.paper === 'II' && question.responseType === 'single',
    ).length,
    generalAptitude: pool.filter(isGeneralAptitudeCandidate).length,
    engineeringMathematics: pool.filter(isEngineeringMathematicsCandidate).length,
    computerScience: pool.filter(isComputerScienceCandidate).length,
    dataScience: pool.filter(isDataScienceCandidate).length,
    unitSingleCounts: computeUnitSingleCounts(pool),
    totalDeliverable: pool.length,
  }
}

export async function loadCbtQuestionPool(): Promise<CbtQuestionCandidate[]> {
  const rows = await db.question.findMany({
    where: { status: 'published' },
    include: {
      topic: {
        include: { unit: true },
      },
      // Only reviewed Hindi is delivered; drafts and rejected rows are ignored.
      translations: {
        where: { language: 'hi', status: 'reviewed' },
        take: 1,
        select: {
          questionText: true,
          optionA: true,
          optionB: true,
          optionC: true,
          optionD: true,
          passage: true,
          codeSnippet: true,
          tableMarkdown: true,
          explanation: true,
        },
      },
    },
    orderBy: [{ paper: 'asc' }, { topicId: 'asc' }, { id: 'asc' }],
  })

  const candidates: CbtQuestionCandidate[] = []
  for (const row of rows) {
    const candidate = toCandidate(row)
    if (candidate) candidates.push(candidate)
  }
  return candidates
}

export function poolsForProfile(pool: CbtQuestionCandidate[]) {
  return {
    paperOne: pool.filter(
      (question) => question.paper === 'I' && question.responseType === 'single',
    ),
    paperTwo: pool.filter(
      (question) => question.paper === 'II' && question.responseType === 'single',
    ),
    generalAptitude: pool.filter(isGeneralAptitudeCandidate),
    engineeringMathematics: pool.filter(isEngineeringMathematicsCandidate),
    computerScience: pool.filter(isComputerScienceCandidate),
    dataScience: pool.filter(isDataScienceCandidate),
  }
}
