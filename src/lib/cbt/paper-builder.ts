/**
 * Frozen paper snapshots for CBT attempts.
 *
 * A delivered paper is built once, validated against the examination engine,
 * and then serialized into the attempt. The snapshot contains the answer keys
 * and is never sent to the browser until the attempt is submitted. This module
 * is the only place where database question rows become a deliverable paper.
 */

import { findSection, getSectionNodes } from '../exam/blueprint'
import { toRational } from '../exam/fractions'
import { validateExamPaper } from '../exam/paper'
import { incorrectPenalty } from '../exam/scoring'
import type {
  ExamPaper,
  ExamProfile,
  ExamQuestion,
  QuestionPresentationType,
  ResponseType,
  ValidationIssue,
} from '../exam/types'
import { poolsForProfile } from './question-pool'
import { selectCbtPaper } from './selection'
import type {
  CbtAttemptQuestion,
  CbtNegativeMarking,
  CbtOption,
  CbtPaperSection,
  CbtPaperSnapshot,
  CbtQuestionCandidate,
  CbtSelectionAssignment,
} from './types'

export class CbtContentError extends Error {
  readonly code = 'CBT_CONTENT_ERROR'
  readonly issues: ValidationIssue[]

  constructor(message: string, issues: ValidationIssue[] = []) {
    const details =
      issues.length > 0
        ? `: ${issues.map((issue) => `${issue.path} (${issue.code}) ${issue.message}`).join('; ')}`
        : ''
    super(`${message}${details}`)
    this.name = 'CbtContentError'
    this.issues = issues
  }
}

export interface CbtPaperBuildOptions {
  /** Stable id for the delivered paper. Defaults to a random UUID. */
  paperId?: string
  /** Fixed clock for deterministic tests. */
  generatedAt?: string
}

export interface CbtPaperBuildResult {
  profile: ExamProfile
  snapshot: CbtPaperSnapshot
  examPaper: ExamPaper
}

const OPTION_IDS = ['A', 'B', 'C', 'D'] as const

function optionId(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toUpperCase()
  return (OPTION_IDS as readonly string[]).includes(normalized) ? normalized : null
}

function clampPrecision(value: number): number {
  return Math.max(0, Math.min(6, Math.trunc(value)))
}

function numericPrecision(
  profile: ExamProfile,
  question: CbtAttemptQuestion,
): number {
  return clampPrecision(
    question.numericAnswer?.precision ?? profile.marking.numeric.precision,
  )
}

function fractionLabel(numerator: number, denominator: number): string {
  return denominator === 1 ? String(numerator) : `${numerator}/${denominator}`
}

function negativeMarking(
  profile: ExamProfile,
  question: ExamQuestion,
): CbtNegativeMarking {
  const penalty = incorrectPenalty(profile, question)
  if (penalty.n === 0) return { mode: 'none' }
  const exact = toRational(penalty)
  const label = fractionLabel(exact.numerator, exact.denominator)
  return {
    mode: 'fraction',
    numerator: exact.numerator,
    denominator: exact.denominator,
    label: `−${label} mark${exact.numerator === 1 && exact.denominator === 1 ? '' : 's'}`,
  }
}

function optionsFor(candidate: CbtQuestionCandidate): CbtOption[] {
  const texts = [candidate.optionA, candidate.optionB, candidate.optionC, candidate.optionD]
  return OPTION_IDS.map((id, index) => ({
    id,
    label: id,
    text: texts[index] ?? '',
  }))
}

function answerKey(
  candidate: CbtQuestionCandidate,
): Pick<
  CbtAttemptQuestion,
  'correctOptionId' | 'correctOptionIds' | 'numericAnswer'
> {
  if (candidate.responseType === 'single') {
    const correctOptionId = optionId(candidate.correctAnswer)
    if (!correctOptionId) {
      throw new CbtContentError(
        `Question ${candidate.id} has no valid single-choice answer key`,
      )
    }
    return { correctOptionId, correctOptionIds: null, numericAnswer: null }
  }

  if (candidate.responseType === 'multiple') {
    const ids = (candidate.correctOptions ?? [])
      .map(optionId)
      .filter((id): id is string => id !== null)
    if (ids.length === 0) {
      throw new CbtContentError(
        `Question ${candidate.id} has no valid multiple-response answer key`,
      )
    }
    return {
      correctOptionId: null,
      correctOptionIds: Array.from(new Set(ids)).sort(),
      numericAnswer: null,
    }
  }

  if (
    candidate.numericAnswer === null ||
    !Number.isFinite(candidate.numericAnswer)
  ) {
    throw new CbtContentError(
      `Question ${candidate.id} has no valid numeric answer key`,
    )
  }
  return {
    correctOptionId: null,
    correctOptionIds: null,
    numericAnswer: {
      value: candidate.numericAnswer,
      ...(candidate.numericTolerance !== null
        ? { tolerance: candidate.numericTolerance }
        : {}),
      ...(candidate.numericToleranceMode !== null
        ? { toleranceMode: candidate.numericToleranceMode }
        : {}),
      ...(candidate.numericPrecision !== null
        ? { precision: clampPrecision(candidate.numericPrecision) }
        : {}),
    },
  }
}

interface SectionMeta {
  id: string
  code: string
  name: string
  kind: CbtPaperSection['kind']
  order: number
  marks: number
  parentIds: string[]
  parentNames: string[]
  index: number
}

function buildSectionMeta(profile: ExamProfile): Map<string, SectionMeta> {
  const meta = new Map<string, SectionMeta>()
  const leaves = getSectionNodes(profile).filter((node) => node.isLeaf)
  leaves.forEach((node, index) => {
    meta.set(node.section.id, {
      id: node.section.id,
      code: node.section.code,
      name: node.section.name,
      kind: node.section.kind,
      order: index + 1,
      marks: node.section.marks,
      parentIds: [...node.parentIds],
      parentNames: node.parentIds.map(
        (parentId) => findSection(profile, parentId)?.name ?? parentId,
      ),
      index,
    })
  })
  return meta
}

function examQuestionFor(
  assignment: CbtSelectionAssignment,
): ExamQuestion {
  const candidate = assignment.candidate
  const key = answerKey(candidate)
  return {
    id: candidate.id,
    sectionId: assignment.sectionId,
    responseType: candidate.responseType,
    marks: assignment.marks,
    presentationType: candidate.presentationType as QuestionPresentationType,
    correctOptionId: key.correctOptionId ?? null,
    correctOptionIds: key.correctOptionIds ?? null,
    numericAnswer: key.numericAnswer ?? null,
    status: 'active',
  }
}

function attemptQuestionFor(
  profile: ExamProfile,
  assignment: CbtSelectionAssignment,
  meta: SectionMeta,
  number: number,
  sectionNumber: number,
): CbtAttemptQuestion {
  const candidate = assignment.candidate
  const key = answerKey(candidate)
  const examQuestion = examQuestionFor(assignment)
  return {
    id: candidate.id,
    number,
    order: number - 1,
    sectionId: meta.id,
    sectionCode: meta.code,
    sectionName: meta.name,
    sectionOrder: meta.order,
    sectionNumber,
    responseType: candidate.responseType as ResponseType,
    marks: assignment.marks,
    presentationType: candidate.presentationType as QuestionPresentationType,
    questionText: candidate.questionText,
    passage: candidate.passage,
    codeSnippet: candidate.codeSnippet,
    tableMarkdown: candidate.tableMarkdown,
    imageUrl: candidate.imageUrl,
    options: optionsFor(candidate),
    correctOptionId: key.correctOptionId ?? null,
    correctOptionIds: key.correctOptionIds ?? null,
    numericAnswer: key.numericAnswer ?? null,
    explanation: candidate.explanation,
    topicName: candidate.topicName,
    unitName: candidate.unitName,
    syllabusUnit: candidate.syllabusUnit,
    syllabusUnitName: candidate.syllabusUnitName,
    hindi: candidate.hindi,
    difficulty: candidate.difficulty,
    negativeMarking: negativeMarking(profile, examQuestion),
    status: 'active',
  }
}

/**
 * Build a snapshot from already-selected assignments. Selection is pure and
 * deterministic, so this function is the single validation gate between
 * question content and an attempt.
 */
export function buildCbtPaperFromAssignments(
  profile: ExamProfile,
  assignments: CbtSelectionAssignment[],
  options: CbtPaperBuildOptions = {},
): CbtPaperBuildResult {
  if (assignments.length === 0) {
    throw new CbtContentError(`No questions were selected for ${profile.code}`)
  }

  const sectionMeta = buildSectionMeta(profile)
  const ordered = assignments
    .map((assignment, index) => ({ assignment, index }))
    .sort((left, right) => {
      const leftMeta = sectionMeta.get(left.assignment.sectionId)
      const rightMeta = sectionMeta.get(right.assignment.sectionId)
      const leftOrder = leftMeta?.index ?? Number.MAX_SAFE_INTEGER
      const rightOrder = rightMeta?.index ?? Number.MAX_SAFE_INTEGER
      return leftOrder - rightOrder || left.index - right.index
    })
    .map((entry) => entry.assignment)

  const sectionCounters = new Map<string, number>()
  const questions: CbtAttemptQuestion[] = []
  const examQuestions: ExamQuestion[] = []

  ordered.forEach((assignment, index) => {
    const meta = sectionMeta.get(assignment.sectionId)
    if (!meta) {
      throw new CbtContentError(
        `Question ${assignment.candidate.id} references unknown section ${assignment.sectionId}`,
      )
    }
    const sectionNumber = (sectionCounters.get(meta.id) ?? 0) + 1
    sectionCounters.set(meta.id, sectionNumber)
    questions.push(
      attemptQuestionFor(profile, assignment, meta, index + 1, sectionNumber),
    )
    examQuestions.push(examQuestionFor(assignment))
  })

  const generatedAt = options.generatedAt ?? new Date().toISOString()
  const paperId = options.paperId ?? crypto.randomUUID()

  const sections: CbtPaperSection[] = Array.from(sectionMeta.values()).map((meta) => ({
    id: meta.id,
    code: meta.code,
    name: meta.name,
    kind: meta.kind,
    order: meta.order,
    marks: meta.marks,
    questionCount: sectionCounters.get(meta.id) ?? 0,
    parentIds: meta.parentIds,
    parentNames: meta.parentNames,
  }))

  const snapshot: CbtPaperSnapshot = {
    id: paperId,
    profileCode: profile.code,
    profileVersion: profile.version,
    profileName: profile.name,
    profileFamily: profile.family,
    subjectName: profile.subjectName,
    generatedAt,
    language: {
      default: profile.language.default,
      available: [...profile.language.available],
      bilingual: profile.language.bilingual,
    },
    sections,
    questions,
  }

  const examPaper: ExamPaper = {
    id: paperId,
    profileCode: profile.code,
    profileVersion: profile.version,
    questions: examQuestions,
  }

  const validation = validateExamPaper(profile, examPaper, {
    enforceQuestionCount: true,
    enforceMarks: true,
    enforceProfileVersion: true,
  })
  if (!validation.ok) {
    throw new CbtContentError(
      `Assembled ${profile.code} paper does not satisfy the examination profile`,
      validation.errors,
    )
  }

  return { profile, snapshot, examPaper }
}

/**
 * Select and build a full paper from the deliverable question pool.
 */
export function buildCbtPaper(
  profile: ExamProfile,
  pool: CbtQuestionCandidate[],
  options: CbtPaperBuildOptions = {},
): CbtPaperBuildResult {
  const assignments = selectCbtPaper(profile, poolsForProfile(pool))
  return buildCbtPaperFromAssignments(profile, assignments, options)
}

export { numericPrecision }
