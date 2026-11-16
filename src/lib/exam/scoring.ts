/**
 * Server-side examination scoring.
 *
 * The scoring engine is deliberately pure: it takes a frozen profile, a
 * delivered paper and candidate responses, and returns an auditable result. No
 * database, React or network code belongs here, which is what makes the rules
 * unit-testable and safe to run inside a route handler.
 *
 * Exact rational arithmetic is used for negative marking. A 2-mark GATE MCQ
 * answered incorrectly is exactly -2/3, never -0.6666666666666666.
 */

import {
  compare,
  frac,
  fromRational,
  mul,
  roundFraction,
  sub,
  toNumber,
  toRational,
  ZERO,
  type Fraction,
} from './fractions'
import { getSectionNodes, descendantLeafIds } from './blueprint'
import { assertValidExamPaper, validateExamPaper, type PaperValidationOptions } from './paper'
import { validateExamProfile } from './validate'
import type {
  CandidateResponse,
  ExamPaper,
  ExamProfile,
  ExamQuestion,
  ExamScoreResult,
  NumericToleranceMode,
  QuestionOutcome,
  QuestionScore,
  ScoreCounts,
  SectionScore,
} from './types'

export type ResponseCollection =
  | CandidateResponse[]
  | Record<string, CandidateResponse>

export interface ScoreExamOptions {
  /** Validate the delivered paper before scoring. Defaults to true. */
  validatePaper?: boolean
  /** Options forwarded to paper validation when enabled. */
  paperValidation?: PaperValidationOptions
  /**
   * Re-run semantic profile validation. Defaults to true so a score can never
   * be produced from a hand-edited configuration object.
   */
  validateProfile?: boolean
  /** Fixed clock for deterministic tests. */
  now?: Date | string
}

export class ExamScoringError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExamScoringError'
  }
}

function normalizeResponses(
  responses: ResponseCollection,
): Map<string, CandidateResponse> {
  const map = new Map<string, CandidateResponse>()

  if (Array.isArray(responses)) {
    for (const response of responses) {
      if (!response || typeof response.questionId !== 'string' || response.questionId.trim() === '') {
        throw new ExamScoringError('Every response must have a non-empty questionId')
      }
      if (map.has(response.questionId)) {
        throw new ExamScoringError(`Duplicate response for question "${response.questionId}"`)
      }
      map.set(response.questionId, response)
    }
    return map
  }

  for (const [questionId, response] of Object.entries(responses)) {
    if (!response) continue
    map.set(questionId, { ...response, questionId })
  }
  return map
}

function parseNumeric(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return null
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }
  return Number.isFinite(value) ? value : null
}

function isAnswered(question: ExamQuestion, response: CandidateResponse | null): boolean {
  if (!response) return false
  if (question.responseType === 'single') {
    return (
      typeof response.selectedOptionId === 'string' &&
      response.selectedOptionId.trim() !== ''
    )
  }
  if (question.responseType === 'multiple') {
    return (
      Array.isArray(response.selectedOptionIds) &&
      response.selectedOptionIds.some(
        (optionId) => typeof optionId === 'string' && optionId.trim() !== '',
      )
    )
  }
  return parseNumeric(response.numericValue) !== null
}

function normalizeOptionIds(ids: string[] | null | undefined): string[] {
  if (!ids) return []
  return Array.from(
    new Set(
      ids
        .filter((id): id is string => typeof id === 'string')
        .map((id) => id.trim())
        .filter((id) => id !== ''),
    ),
  ).sort()
}

function sameOptionSet(
  selected: string[] | null | undefined,
  correct: string[] | null | undefined,
): boolean {
  const left = normalizeOptionIds(selected)
  const right = normalizeOptionIds(correct)
  if (left.length === 0 || left.length !== right.length) return false
  return left.every((id, index) => id === right[index])
}

function clampPrecision(precision: number): number {
  return Math.max(0, Math.min(6, Math.trunc(precision)))
}

function roundToPrecision(value: number, precision: number): number {
  const places = clampPrecision(precision)
  const factor = 10 ** places
  const sign = Math.sign(value)
  const rounded = Math.round(Math.abs(value) * factor + Number.EPSILON) / factor
  return sign === 0 ? 0 : sign * rounded
}

function numericToleranceMode(
  profile: ExamProfile,
  question: ExamQuestion,
): NumericToleranceMode {
  return (
    question.numericAnswer?.toleranceMode ??
    profile.marking.numeric.toleranceMode
  )
}

function numericPrecision(profile: ExamProfile, question: ExamQuestion): number {
  return clampPrecision(
    question.numericAnswer?.precision ?? profile.marking.numeric.precision,
  )
}

function numericTolerance(profile: ExamProfile, question: ExamQuestion): number {
  const value =
    question.numericAnswer?.tolerance ?? profile.marking.numeric.defaultTolerance
  return Math.max(0, value)
}

function numericAnswerMatches(
  profile: ExamProfile,
  question: ExamQuestion,
  candidateValue: number,
): boolean {
  if (!question.numericAnswer) return false

  const precision = numericPrecision(profile, question)
  const candidate = roundToPrecision(candidateValue, precision)
  const expected = roundToPrecision(question.numericAnswer.value, precision)
  const difference = Math.abs(candidate - expected)
  const epsilon = 10 ** -(precision + 6)

  if (difference <= epsilon) return true

  const tolerance = numericTolerance(profile, question)
  if (tolerance <= 0) return false

  const mode = numericToleranceMode(profile, question)
  if (mode === 'none') return false
  if (mode === 'absolute') return difference <= tolerance + epsilon

  // Relative tolerance. If the key is zero, relative error is undefined, so
  // fall back to an absolute comparison against the configured tolerance.
  if (Math.abs(expected) <= epsilon) return difference <= tolerance + epsilon
  return difference / Math.abs(expected) <= tolerance + epsilon
}

/**
 * Penalty magnitude for one incorrect single-correct question. The profile
 * stores a fraction of the question's own marks, which expresses both GATE
 * rules at once: 1 mark x 1/3 = 1/3 and 2 marks x 1/3 = 2/3.
 */
export function incorrectPenalty(
  profile: ExamProfile,
  question: ExamQuestion,
): Fraction {
  if (question.responseType !== 'single') return ZERO
  const rule = profile.marking.incorrect.single
  if (rule.mode === 'none') return ZERO

  const penalty = mul(frac(question.marks), fromRational(rule.fraction))
  const maximum = frac(question.marks)
  return compare(penalty, maximum) > 0 ? maximum : penalty
}

function buildQuestionScore(
  question: ExamQuestion,
  outcome: QuestionOutcome,
  awardedExact: Fraction,
  penaltyExact: Fraction,
  answered: boolean,
  response: CandidateResponse | null,
): QuestionScore {
  const netExact = sub(awardedExact, penaltyExact)
  return {
    questionId: question.id,
    sectionId: question.sectionId,
    responseType: question.responseType,
    marksAvailable: question.marks,
    marksAwarded: toNumber(awardedExact),
    penalty: toNumber(penaltyExact),
    netMarks: toNumber(netExact),
    marksAwardedExact: toRational(awardedExact),
    penaltyExact: toRational(penaltyExact),
    netMarksExact: toRational(netExact),
    outcome,
    answered,
    markedForReview: response?.markedForReview === true,
    timeSpentSec:
      typeof response?.timeSpentSec === 'number' && response.timeSpentSec > 0
        ? response.timeSpentSec
        : 0,
  }
}

/**
 * Score a single question against the profile's marking scheme. Exported so
 * unit tests and admin diagnostics can inspect individual decisions.
 */
export function scoreQuestion(
  profile: ExamProfile,
  question: ExamQuestion,
  response: CandidateResponse | null = null,
): QuestionScore {
  const answered = isAnswered(question, response)
  const marks = frac(question.marks)

  if (question.status === 'dropped') {
    const policy = profile.marking.droppedQuestion
    const award =
      policy === 'award-all' || (policy === 'award-attempted' && answered)
    return buildQuestionScore(
      question,
      award ? 'dropped-bonus' : 'dropped',
      award ? marks : ZERO,
      ZERO,
      answered,
      response,
    )
  }

  if (!answered) {
    return buildQuestionScore(question, 'unanswered', ZERO, ZERO, false, response)
  }

  if (question.responseType === 'single') {
    const selected = response?.selectedOptionId?.trim() ?? ''
    const correct = question.correctOptionId?.trim() ?? ''
    if (correct !== '' && selected === correct) {
      return buildQuestionScore(question, 'correct', marks, ZERO, true, response)
    }
    return buildQuestionScore(
      question,
      'incorrect',
      ZERO,
      incorrectPenalty(profile, question),
      true,
      response,
    )
  }

  if (question.responseType === 'multiple') {
    // GATE MSQ: no partial marking. Only the exact correct combination earns
    // marks, and an incorrect combination is never penalised.
    if (sameOptionSet(response?.selectedOptionIds, question.correctOptionIds)) {
      return buildQuestionScore(question, 'correct', marks, ZERO, true, response)
    }
    return buildQuestionScore(question, 'incorrect', ZERO, ZERO, true, response)
  }

  const candidateValue = parseNumeric(response?.numericValue)
  if (
    candidateValue !== null &&
    numericAnswerMatches(profile, question, candidateValue)
  ) {
    return buildQuestionScore(question, 'correct', marks, ZERO, true, response)
  }
  // NAT: no negative marking.
  return buildQuestionScore(question, 'incorrect', ZERO, ZERO, true, response)
}

interface Aggregate {
  questionCount: number
  answered: number
  correct: number
  incorrect: number
  partial: number
  unanswered: number
  dropped: number
  awarded: Fraction
  penalty: Fraction
  raw: Fraction
}

function emptyAggregate(): Aggregate {
  return {
    questionCount: 0,
    answered: 0,
    correct: 0,
    incorrect: 0,
    partial: 0,
    unanswered: 0,
    dropped: 0,
    awarded: ZERO,
    penalty: ZERO,
    raw: ZERO,
  }
}

function addToAggregate(aggregate: Aggregate, score: QuestionScore): void {
  aggregate.questionCount += 1
  if (score.answered) aggregate.answered += 1
  if (score.outcome === 'correct') aggregate.correct += 1
  else if (score.outcome === 'incorrect') aggregate.incorrect += 1
  else if (score.outcome === 'partial') aggregate.partial += 1
  else if (score.outcome === 'unanswered') aggregate.unanswered += 1
  else aggregate.dropped += 1

  aggregate.awarded = addFraction(aggregate.awarded, fromRational(score.marksAwardedExact))
  aggregate.penalty = addFraction(aggregate.penalty, fromRational(score.penaltyExact))
  aggregate.raw = addFraction(aggregate.raw, fromRational(score.netMarksExact))
}

function addFraction(a: Fraction, b: Fraction): Fraction {
  return frac(a.n * b.d + b.n * a.d, a.d * b.d)
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function countsFromAggregate(
  aggregate: Aggregate,
  maxMarks: number,
  profile: ExamProfile,
  finalExact: Fraction,
): ScoreCounts {
  const attempted = aggregate.correct + aggregate.incorrect + aggregate.partial
  const accuracyDenominator =
    profile.result.accuracyBasis === 'attempted'
      ? attempted
      : aggregate.questionCount
  return {
    questionCount: aggregate.questionCount,
    answered: aggregate.answered,
    correct: aggregate.correct,
    incorrect: aggregate.incorrect,
    partial: aggregate.partial,
    unanswered: aggregate.unanswered,
    dropped: aggregate.dropped,
    marksAwarded: toNumber(aggregate.awarded),
    penalty: toNumber(aggregate.penalty),
    rawScore: roundFraction(aggregate.raw, profile.result.roundingDecimals),
    finalScore: roundFraction(finalExact, profile.result.roundingDecimals),
    maxMarks,
    percentage: maxMarks > 0 ? round2((toNumber(finalExact) / maxMarks) * 100) : 0,
    accuracy:
      accuracyDenominator > 0
        ? round2((aggregate.correct / accuracyDenominator) * 100)
        : 0,
  }
}

/**
 * Score a delivered paper. By default the paper is validated against the
 * profile first, so a paper with missing answer keys, wrong section counts or
 * disallowed marks can never be scored silently.
 */
export function scoreExam(
  profile: ExamProfile,
  paper: ExamPaper,
  responses: ResponseCollection,
  options: ScoreExamOptions = {},
): ExamScoreResult {
  if (options.validateProfile !== false) {
    const profileValidation = validateExamProfile(profile)
    if (!profileValidation.ok) {
      const details = profileValidation.errors
        .map((issue) => `${issue.path} (${issue.code}) ${issue.message}`)
        .join('; ')
      throw new ExamScoringError(`Cannot score with an invalid profile: ${details}`)
    }
  }

  if (options.validatePaper !== false) {
    if (options.paperValidation) {
      assertValidExamPaper(profile, paper, options.paperValidation)
    } else {
      const paperValidation = validateExamPaper(profile, paper)
      if (!paperValidation.ok) {
        const details = paperValidation.errors
          .map((issue) => `${issue.path} (${issue.code}) ${issue.message}`)
          .join('; ')
        throw new ExamScoringError(`Cannot score an invalid paper: ${details}`)
      }
    }
  }

  const responseMap = normalizeResponses(responses)
  const questionScores = paper.questions.map((question) =>
    scoreQuestion(profile, question, responseMap.get(question.id) ?? null),
  )

  const totalAggregate = emptyAggregate()
  for (const score of questionScores) addToAggregate(totalAggregate, score)

  const rawExact = totalAggregate.raw
  const finalExact =
    profile.result.clampTotalToZero && compare(rawExact, ZERO) < 0 ? ZERO : rawExact

  const scoreByQuestion = new Map(questionScores.map((score) => [score.questionId, score]))
  const sectionScores: SectionScore[] = []

  for (const node of getSectionNodes(profile)) {
    const leafIds = descendantLeafIds(node.section)
    const aggregate = emptyAggregate()
    for (const leafId of leafIds) {
      for (const question of paper.questions) {
        if (question.sectionId !== leafId) continue
        const score = scoreByQuestion.get(question.id)
        if (score) addToAggregate(aggregate, score)
      }
    }
    // Clamping is a total-paper rule only. Section scores remain signed so the
    // breakdown stays additive and a negative section is visible to the
    // candidate/admin instead of being silently rewritten to zero.
    const counts = countsFromAggregate(
      aggregate,
      node.section.marks,
      profile,
      aggregate.raw,
    )
    sectionScores.push({
      ...counts,
      sectionId: node.section.id,
      sectionCode: node.section.code,
      sectionName: node.section.name,
      parentSectionIds: [...node.parentIds],
    })
  }

  const totals = countsFromAggregate(
    totalAggregate,
    profile.totalMarks,
    profile,
    finalExact,
  )

  const calculatedAt =
    options.now === undefined
      ? new Date().toISOString()
      : options.now instanceof Date
        ? options.now.toISOString()
        : options.now

  return {
    profile: {
      id: profile.id,
      code: profile.code,
      version: profile.version,
      name: profile.name,
    },
    paperId: paper.id ?? null,
    totals,
    sections: sectionScores,
    questions: questionScores,
    exact: {
      rawScore: toRational(rawExact),
      finalScore: toRational(finalExact),
    },
    calculatedAt,
  }
}
