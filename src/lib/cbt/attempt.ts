/**
 * CBT attempt lifecycle.
 *
 * Timing is always derived from the server's stored `expiresAt`; the client
 * countdown is only a display of that value. Every read and mutation finalizes
 * an expired attempt before returning, and finalization is idempotent.
 */

import type { ExamAttempt as ExamAttemptRow } from '@prisma/client'
import { db } from '@/lib/db'
import { getDefaultExamRegistry } from '../exam/profiles'
import { scoreExam } from '../exam/scoring'
import type {
  CbtSubmittedReason,
  CbtAttemptCounts,
  CbtAttemptPayload,
  CbtAttemptQuestion,
  CbtAttemptState,
  CbtCandidate,
  CbtHeartbeatResponse,
  CbtPaperSnapshot,
  CbtResponse,
  CbtResponses,
  CbtResult,
  CbtReviewQuestion,
  CbtSanitizedPaper,
  CbtSanitizedQuestion,
  CbtStartResponse,
  CbtSubmitResponse,
} from './types'
import type {
  ExamPaper,
  ExamProfile,
  ExamScoreResult,
} from '../exam/types'
import { availabilityForProfile } from './availability'
import { buildCbtPaper, numericPrecision } from './paper-builder'
import { computePoolStats, loadCbtQuestionPool } from './question-pool'

export class CbtAttemptError extends Error {
  readonly statusCode: number
  readonly code: string

  constructor(statusCode: number, code: string, message: string) {
    super(message)
    this.name = 'CbtAttemptError'
    this.statusCode = statusCode
    this.code = code
  }
}

export interface StartAttemptInput {
  userId: string
  candidate: CbtCandidate
  profileCode: string
  now?: Date
}

export interface SaveAttemptInput {
  response?: {
    questionId: string
    selectedOptionId?: string | null
    selectedOptionIds?: string[] | null
    numericValue?: string | number | null
    markedForReview?: boolean
    visited?: boolean
    timeSpentSec?: number
  }
  position?: {
    currentSectionId: string
    currentQuestionId: string
  }
}

export interface SubmitAttemptInput {
  responses?: CbtResponses
  reason?: CbtSubmittedReason
}

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function resolveProfile(code: string, version?: string): ExamProfile {
  const profile = getDefaultExamRegistry().get(code, version)
  if (!profile) {
    throw new CbtAttemptError(
      500,
      'PROFILE_UNAVAILABLE',
      `Examination profile ${code}${version ? ` version ${version}` : ''} is not available`,
    )
  }
  return profile
}

function parseSnapshot(row: ExamAttemptRow): CbtPaperSnapshot {
  try {
    const parsed = JSON.parse(row.paperJson) as CbtPaperSnapshot
    if (!parsed || !Array.isArray(parsed.questions) || !Array.isArray(parsed.sections)) {
      throw new Error('invalid snapshot shape')
    }
    return parsed
  } catch {
    throw new CbtAttemptError(
      500,
      'PAPER_SNAPSHOT_CORRUPT',
      'The stored paper snapshot for this attempt is unreadable',
    )
  }
}

function parseResponses(row: ExamAttemptRow): CbtResponses {
  try {
    const parsed = JSON.parse(row.responsesJson || '{}') as CbtResponses
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed
  } catch {
    return {}
  }
}

function parseResult(row: ExamAttemptRow): CbtResult | null {
  if (!row.resultJson) return null
  try {
    return JSON.parse(row.resultJson) as CbtResult
  } catch {
    return null
  }
}

function examPaperFromSnapshot(snapshot: CbtPaperSnapshot): ExamPaper {
  return {
    id: snapshot.id,
    profileCode: snapshot.profileCode,
    profileVersion: snapshot.profileVersion,
    questions: snapshot.questions.map((question) => ({
      id: question.id,
      sectionId: question.sectionId,
      responseType: question.responseType,
      marks: question.marks,
      presentationType: question.presentationType,
      correctOptionId: question.correctOptionId ?? null,
      correctOptionIds: question.correctOptionIds ?? null,
      numericAnswer: question.numericAnswer ?? null,
      status: question.status,
    })),
  }
}

function answerIsPresent(question: CbtAttemptQuestion, response: CbtResponse | null): boolean {
  if (!response) return false
  if (question.responseType === 'single') {
    return typeof response.selectedOptionId === 'string' && response.selectedOptionId.trim() !== ''
  }
  if (question.responseType === 'multiple') {
    return (
      Array.isArray(response.selectedOptionIds) &&
      response.selectedOptionIds.some((id) => typeof id === 'string' && id.trim() !== '')
    )
  }
  if (response.numericValue === null || response.numericValue === undefined) return false
  if (typeof response.numericValue === 'string') {
    return response.numericValue.trim() !== ''
  }
  return Number.isFinite(response.numericValue)
}

function isVisited(question: CbtAttemptQuestion, response: CbtResponse | null): boolean {
  return (
    response?.visited === true ||
    response?.markedForReview === true ||
    answerIsPresent(question, response)
  )
}

export function countAttempt(
  snapshot: CbtPaperSnapshot,
  responses: CbtResponses,
): CbtAttemptCounts {
  let answered = 0
  let notAnswered = 0
  let marked = 0
  let answeredMarked = 0
  let visited = 0

  for (const question of snapshot.questions) {
    const response = responses[question.id] ?? null
    const questionVisited = isVisited(question, response)
    if (questionVisited) visited += 1
    const answeredQuestion = answerIsPresent(question, response)
    const markedQuestion = response?.markedForReview === true

    if (answeredQuestion && markedQuestion) answeredMarked += 1
    else if (answeredQuestion) answered += 1
    else if (markedQuestion) marked += 1
    else if (questionVisited) notAnswered += 1
  }

  return {
    total: snapshot.questions.length,
    answered,
    notAnswered,
    marked,
    answeredMarked,
    visited,
    notVisited: snapshot.questions.length - visited,
  }
}

function clampTimeSpent(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 0
  return Math.min(86_400, Math.round(value))
}

function normalizeOption(value: unknown): string {
  if (typeof value !== 'string') {
    throw new CbtAttemptError(400, 'INVALID_RESPONSE', 'Option id must be a string')
  }
  return value.trim().toUpperCase()
}

function normalizeResponse(
  question: CbtAttemptQuestion,
  incoming: SaveAttemptInput['response'] | CbtResponse,
  existing: CbtResponse | null,
): CbtResponse | null {
  if (!incoming) return existing
  const response: CbtResponse = {
    ...(existing ?? {}),
    questionId: question.id,
  }
  const optionIds = new Set(question.options.map((option) => option.id))

  if (question.responseType === 'single') {
    if (hasOwn(incoming, 'selectedOptionId')) {
      const value = incoming.selectedOptionId
      if (value === null || value === undefined || value === '') {
        response.selectedOptionId = null
      } else {
        const normalized = normalizeOption(value)
        if (!optionIds.has(normalized)) {
          throw new CbtAttemptError(
            400,
            'INVALID_RESPONSE',
            `Question ${question.id} does not have option ${normalized}`,
          )
        }
        response.selectedOptionId = normalized
      }
      response.selectedOptionIds = null
      response.numericValue = null
    }
  } else if (question.responseType === 'multiple') {
    if (hasOwn(incoming, 'selectedOptionIds')) {
      const value = incoming.selectedOptionIds
      if (value === null || value === undefined) {
        response.selectedOptionIds = []
      } else if (!Array.isArray(value)) {
        throw new CbtAttemptError(
          400,
          'INVALID_RESPONSE',
          `Question ${question.id} expects an array of option ids`,
        )
      } else {
        const normalized = Array.from(
          new Set(value.map((option) => normalizeOption(option))),
        ).sort()
        for (const option of normalized) {
          if (!optionIds.has(option)) {
            throw new CbtAttemptError(
              400,
              'INVALID_RESPONSE',
              `Question ${question.id} does not have option ${option}`,
            )
          }
        }
        response.selectedOptionIds = normalized
      }
      response.selectedOptionId = null
      response.numericValue = null
    }
  } else {
    if (hasOwn(incoming, 'numericValue')) {
      const value = incoming.numericValue
      if (value === null || value === undefined || value === '') {
        response.numericValue = null
      } else {
        const text = typeof value === 'number' ? String(value) : String(value).trim()
        if (text.length === 0 || text.length > 32 || !Number.isFinite(Number(text))) {
          throw new CbtAttemptError(
            400,
            'INVALID_RESPONSE',
            `Question ${question.id} expects a finite numeric answer`,
          )
        }
        response.numericValue = text
      }
      response.selectedOptionId = null
      response.selectedOptionIds = null
    }
  }

  if (hasOwn(incoming, 'markedForReview')) {
    response.markedForReview = incoming.markedForReview === true
  }
  if (hasOwn(incoming, 'visited')) {
    response.visited = incoming.visited === true
  }
  if (hasOwn(incoming, 'timeSpentSec')) {
    response.timeSpentSec = clampTimeSpent(incoming.timeSpentSec)
  }

  if (answerIsPresent(question, response)) response.visited = true

  const empty =
    !answerIsPresent(question, response) &&
    response.markedForReview !== true &&
    response.visited !== true &&
    (response.timeSpentSec ?? 0) === 0
  return empty ? null : response
}

function validatePosition(
  snapshot: CbtPaperSnapshot,
  position: NonNullable<SaveAttemptInput['position']>,
): { currentSectionId: string; currentQuestionId: string } {
  const section = snapshot.sections.find((entry) => entry.id === position.currentSectionId)
  if (!section) {
    throw new CbtAttemptError(
      400,
      'INVALID_POSITION',
      `Unknown section ${position.currentSectionId}`,
    )
  }
  const question = snapshot.questions.find(
    (entry) => entry.id === position.currentQuestionId,
  )
  if (!question) {
    throw new CbtAttemptError(
      400,
      'INVALID_POSITION',
      `Unknown question ${position.currentQuestionId}`,
    )
  }
  return {
    currentSectionId: question.sectionId,
    currentQuestionId: question.id,
  }
}

function mergeResponses(
  snapshot: CbtPaperSnapshot,
  existing: CbtResponses,
  incoming: CbtResponses,
): CbtResponses {
  const questions = new Map(snapshot.questions.map((question) => [question.id, question]))
  const merged: CbtResponses = { ...existing }
  for (const [questionId, response] of Object.entries(incoming)) {
    const question = questions.get(questionId)
    if (!question) {
      throw new CbtAttemptError(
        400,
        'INVALID_RESPONSE',
        `Question ${questionId} is not part of this attempt`,
      )
    }
    const normalized = normalizeResponse(question, response, merged[questionId] ?? null)
    if (normalized) merged[questionId] = normalized
    else delete merged[questionId]
  }
  return merged
}

function sanitizePaper(
  snapshot: CbtPaperSnapshot,
  profile: ExamProfile,
): CbtSanitizedPaper {
  const questions: CbtSanitizedQuestion[] = snapshot.questions.map((question) => ({
    id: question.id,
    number: question.number,
    order: question.order,
    sectionId: question.sectionId,
    sectionCode: question.sectionCode,
    sectionName: question.sectionName,
    sectionOrder: question.sectionOrder,
    sectionNumber: question.sectionNumber,
    responseType: question.responseType,
    marks: question.marks,
    presentationType: question.presentationType,
    questionText: question.questionText,
    passage: question.passage,
    codeSnippet: question.codeSnippet,
    tableMarkdown: question.tableMarkdown,
    imageUrl: question.imageUrl,
    options: question.options,
    topicName: question.topicName,
    unitName: question.unitName,
    difficulty: question.difficulty,
    negativeMarking: question.negativeMarking,
    numericPrecision: numericPrecision(profile, question),
  }))

  return {
    id: snapshot.id,
    profileCode: snapshot.profileCode,
    profileVersion: snapshot.profileVersion,
    profileName: snapshot.profileName,
    profileFamily: snapshot.profileFamily,
    subjectName: snapshot.subjectName,
    generatedAt: snapshot.generatedAt,
    sections: snapshot.sections,
    questions,
  }
}

function remainingSeconds(row: ExamAttemptRow, now: Date): number {
  if (row.status !== 'in_progress') return 0
  return Math.max(0, Math.ceil((row.expiresAt.getTime() - now.getTime()) / 1000))
}

function attemptState(
  row: ExamAttemptRow,
  snapshot: CbtPaperSnapshot,
  responses: CbtResponses,
  now: Date,
): CbtAttemptState {
  return {
    id: row.id,
    status: row.status as CbtAttemptState['status'],
    profileCode: row.profileCode,
    profileVersion: row.profileVersion,
    profileName: row.profileName,
    profileFamily: row.profileFamily as CbtAttemptState['profileFamily'],
    subjectName: row.subjectName,
    candidate: { name: row.candidateName, id: row.candidateId },
    startedAt: row.startedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    serverNow: now.toISOString(),
    remainingSec: remainingSeconds(row, now),
    durationSec: row.durationSec,
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
    submittedReason: (row.submittedReason as CbtSubmittedReason | null) ?? null,
    currentSectionId: row.currentSectionId,
    currentQuestionId: row.currentQuestionId,
    totalQuestions: row.totalQuestions,
    counts: countAttempt(snapshot, responses),
    responses,
    lastSavedAt: row.lastSavedAt.toISOString(),
    lastHeartbeatAt: row.lastHeartbeatAt.toISOString(),
    score: row.status === 'submitted' ? row.score : null,
    maxMarks: row.maxMarks,
    resultAvailable: row.status === 'submitted' && row.resultJson !== null,
  }
}

function buildResult(
  row: ExamAttemptRow,
  profile: ExamProfile,
  snapshot: CbtPaperSnapshot,
  responses: CbtResponses,
  score: ExamScoreResult,
  submittedAt: Date,
  reason: CbtSubmittedReason,
): CbtResult {
  const scoreByQuestion = new Map(score.questions.map((entry) => [entry.questionId, entry]))
  const review: CbtReviewQuestion[] = snapshot.questions.map((question) => {
    const questionScore = scoreByQuestion.get(question.id)
    if (!questionScore) {
      throw new CbtAttemptError(
        500,
        'SCORE_INCOMPLETE',
        `Question ${question.id} was not scored`,
      )
    }
    const response = responses[question.id] ?? null
    return {
      id: question.id,
      number: question.number,
      sectionId: question.sectionId,
      sectionCode: question.sectionCode,
      sectionName: question.sectionName,
      responseType: question.responseType,
      marks: question.marks,
      presentationType: question.presentationType,
      questionText: question.questionText,
      passage: question.passage,
      codeSnippet: question.codeSnippet,
      tableMarkdown: question.tableMarkdown,
      imageUrl: question.imageUrl,
      options: question.options,
      correctOptionId: question.correctOptionId ?? null,
      correctOptionIds: question.correctOptionIds ?? null,
      numericAnswer: question.numericAnswer ?? null,
      numericPrecision: numericPrecision(profile, question),
      explanation: question.explanation,
      topicName: question.topicName,
      unitName: question.unitName,
      difficulty: question.difficulty,
      response,
      outcome: questionScore.outcome,
      marksAwarded: questionScore.marksAwarded,
      penalty: questionScore.penalty,
      netMarks: questionScore.netMarks,
      answered: questionScore.answered,
      markedForReview: questionScore.markedForReview,
      timeSpentSec: questionScore.timeSpentSec,
    }
  })

  const timeSpentSec = Math.max(
    0,
    Math.min(
      row.durationSec,
      Math.round((submittedAt.getTime() - row.startedAt.getTime()) / 1000),
    ),
  )

  return {
    attemptId: row.id,
    profile: {
      id: profile.id,
      code: profile.code,
      name: profile.name,
      version: profile.version,
      family: profile.family,
    },
    candidate: { name: row.candidateName, id: row.candidateId },
    submittedAt: submittedAt.toISOString(),
    submittedReason: reason,
    durationSec: row.durationSec,
    timeSpentSec,
    totals: score.totals,
    sections: score.sections,
    exact: score.exact,
    review,
  }
}

async function loadAttemptRow(
  attemptId: string,
  userId: string,
): Promise<ExamAttemptRow> {
  const row = await db.examAttempt.findFirst({ where: { id: attemptId, userId } })
  if (!row) {
    throw new CbtAttemptError(404, 'ATTEMPT_NOT_FOUND', 'Examination attempt not found')
  }
  return row
}

async function finalizeWithResponses(
  row: ExamAttemptRow,
  reason: CbtSubmittedReason,
  responses: CbtResponses,
  now: Date,
): Promise<ExamAttemptRow> {
  if (row.status === 'submitted') return row

  const profile = resolveProfile(row.profileCode, row.profileVersion)
  const snapshot = parseSnapshot(row)
  const score = scoreExam(profile, examPaperFromSnapshot(snapshot), responses, {
    now,
  })
  const submittedAt =
    reason === 'timer_expired'
      ? new Date(Math.min(now.getTime(), row.expiresAt.getTime()))
      : now
  const result = buildResult(row, profile, snapshot, responses, score, submittedAt, reason)
  const counts = countAttempt(snapshot, responses)
  const markedCount =
    counts.marked + counts.answeredMarked

  const updated = await db.examAttempt.updateMany({
    where: { id: row.id, status: 'in_progress' },
    data: {
      status: 'submitted',
      submittedAt,
      submittedReason: reason,
      responsesJson: JSON.stringify(responses),
      resultJson: JSON.stringify(result),
      score: score.totals.finalScore,
      maxMarks: score.totals.maxMarks,
      correctCount: score.totals.correct,
      incorrectCount: score.totals.incorrect,
      unansweredCount: score.totals.unanswered,
      penalty: score.totals.penalty,
      answeredCount: counts.answered + counts.answeredMarked,
      markedCount,
      visitedCount: counts.visited,
      lastSavedAt: submittedAt,
      lastHeartbeatAt: now,
    },
  })

  if (updated.count === 0) {
    return loadAttemptRow(row.id, row.userId)
  }
  return loadAttemptRow(row.id, row.userId)
}

async function finalizeExpired(row: ExamAttemptRow, now: Date): Promise<ExamAttemptRow> {
  if (row.status !== 'in_progress' || now.getTime() < row.expiresAt.getTime()) {
    return row
  }
  return finalizeWithResponses(row, 'timer_expired', parseResponses(row), now)
}

function payloadForRow(
  row: ExamAttemptRow,
  now: Date,
): CbtAttemptPayload {
  const profile = resolveProfile(row.profileCode, row.profileVersion)
  const snapshot = parseSnapshot(row)
  const responses = parseResponses(row)
  return {
    attempt: attemptState(row, snapshot, responses, now),
    paper: sanitizePaper(snapshot, profile),
  }
}

export async function getAttemptPayload(
  attemptId: string,
  userId: string,
  now: Date = new Date(),
): Promise<CbtAttemptPayload> {
  let row = await loadAttemptRow(attemptId, userId)
  row = await finalizeExpired(row, now)
  return payloadForRow(row, now)
}

export async function startAttempt(
  input: StartAttemptInput,
): Promise<CbtStartResponse> {
  const now = input.now ?? new Date()
  const profile = resolveProfile(input.profileCode)
  if (profile.status !== 'published') {
    throw new CbtAttemptError(
      409,
      'PROFILE_NOT_PUBLISHED',
      `Examination profile ${profile.code} is not open for attempts`,
    )
  }

  const existing = await db.examAttempt.findFirst({
    where: {
      userId: input.userId,
      profileCode: profile.code,
      status: 'in_progress',
    },
    orderBy: { startedAt: 'desc' },
  })

  if (existing) {
    const refreshed = await finalizeExpired(existing, now)
    if (refreshed.status === 'in_progress') {
      return { ...payloadForRow(refreshed, now), resumed: true }
    }
  }

  const pool = await loadCbtQuestionPool()
  const availability = availabilityForProfile(profile, computePoolStats(pool))
  if (!availability.available) {
    throw new CbtAttemptError(
      409,
      'CONTENT_UNAVAILABLE',
      availability.note ?? `Content for ${profile.code} is not available`,
    )
  }

  const { snapshot } = buildCbtPaper(profile, pool)
  const first = snapshot.questions[0]
  const initialResponses: CbtResponses = first
    ? { [first.id]: { questionId: first.id, visited: true } }
    : {}
  const expiresAt = new Date(now.getTime() + profile.durationMinutes * 60_000)

  const row = await db.examAttempt.create({
    data: {
      userId: input.userId,
      profileCode: profile.code,
      profileVersion: profile.version,
      profileName: profile.name,
      profileFamily: profile.family,
      subjectName: profile.subjectName,
      candidateName: input.candidate.name,
      candidateId: input.candidate.id,
      status: 'in_progress',
      startedAt: now,
      expiresAt,
      acknowledgedAt: now,
      durationSec: profile.durationMinutes * 60,
      paperJson: JSON.stringify(snapshot),
      responsesJson: JSON.stringify(initialResponses),
      currentSectionId: first?.sectionId ?? null,
      currentQuestionId: first?.id ?? null,
      totalQuestions: snapshot.questions.length,
      answeredCount: 0,
      markedCount: 0,
      visitedCount: first ? 1 : 0,
      maxMarks: profile.totalMarks,
      lastHeartbeatAt: now,
      lastSavedAt: now,
    },
  })

  return { ...payloadForRow(row, now), resumed: false }
}

export async function saveAttempt(
  attemptId: string,
  userId: string,
  input: SaveAttemptInput,
  now: Date = new Date(),
): Promise<CbtAttemptPayload> {
  let row = await loadAttemptRow(attemptId, userId)
  if (row.status === 'submitted') return payloadForRow(row, now)
  if (now.getTime() >= row.expiresAt.getTime()) {
    row = await finalizeExpired(row, now)
    return payloadForRow(row, now)
  }

  const profile = resolveProfile(row.profileCode, row.profileVersion)
  const snapshot = parseSnapshot(row)
  const questions = new Map(snapshot.questions.map((question) => [question.id, question]))
  let responses = parseResponses(row)

  if (input.response) {
    const question = questions.get(input.response.questionId)
    if (!question) {
      throw new CbtAttemptError(
        400,
        'INVALID_RESPONSE',
        `Question ${input.response.questionId} is not part of this attempt`,
      )
    }
    const normalized = normalizeResponse(
      question,
      input.response,
      responses[question.id] ?? null,
    )
    if (normalized) responses[question.id] = normalized
    else delete responses[question.id]
  }

  let currentSectionId = row.currentSectionId
  let currentQuestionId = row.currentQuestionId
  if (input.position) {
    const position = validatePosition(snapshot, input.position)
    currentSectionId = position.currentSectionId
    currentQuestionId = position.currentQuestionId
  }

  if (currentQuestionId) {
    const current = questions.get(currentQuestionId)
    if (current) {
      const existing = responses[current.id] ?? { questionId: current.id }
      responses[current.id] = { ...existing, questionId: current.id, visited: true }
    }
  }

  const counts = countAttempt(snapshot, responses)
  const markedCount = counts.marked + counts.answeredMarked
  const updated = await db.examAttempt.update({
    where: { id: row.id },
    data: {
      responsesJson: JSON.stringify(responses),
      currentSectionId,
      currentQuestionId,
      answeredCount: counts.answered + counts.answeredMarked,
      markedCount,
      visitedCount: counts.visited,
      lastSavedAt: now,
      lastHeartbeatAt: now,
    },
  })

  return payloadForRow(updated, now)
}

export async function submitAttempt(
  attemptId: string,
  userId: string,
  input: SubmitAttemptInput = {},
  now: Date = new Date(),
): Promise<CbtSubmitResponse> {
  let row = await loadAttemptRow(attemptId, userId)

  if (row.status === 'submitted') {
    const result = parseResult(row)
    if (!result) {
      throw new CbtAttemptError(
        409,
        'RESULT_UNAVAILABLE',
        'This attempt is submitted but its result is unavailable',
      )
    }
    return {
      attempt: attemptState(row, parseSnapshot(row), parseResponses(row), now),
      result,
    }
  }

  if (now.getTime() >= row.expiresAt.getTime()) {
    row = await finalizeExpired(row, now)
    const result = parseResult(row)
    if (!result) {
      throw new CbtAttemptError(500, 'RESULT_UNAVAILABLE', 'The result could not be stored')
    }
    return {
      attempt: attemptState(row, parseSnapshot(row), parseResponses(row), now),
      result,
    }
  }

  const snapshot = parseSnapshot(row)
  let responses = parseResponses(row)
  if (input.responses) {
    responses = mergeResponses(snapshot, responses, input.responses)
  }

  const reason: CbtSubmittedReason = input.reason === 'timer_expired'
    ? 'timer_expired'
    : 'manual'
  row = await finalizeWithResponses(row, reason, responses, now)
  const result = parseResult(row)
  if (!result) {
    throw new CbtAttemptError(500, 'RESULT_UNAVAILABLE', 'The result could not be stored')
  }
  return {
    attempt: attemptState(row, parseSnapshot(row), parseResponses(row), now),
    result,
  }
}

export async function heartbeat(
  attemptId: string,
  userId: string,
  now: Date = new Date(),
): Promise<CbtHeartbeatResponse> {
  let row = await loadAttemptRow(attemptId, userId)
  if (row.status === 'in_progress' && now.getTime() >= row.expiresAt.getTime()) {
    row = await finalizeExpired(row, now)
  } else if (row.status === 'in_progress') {
    row = await db.examAttempt.update({
      where: { id: row.id },
      data: { lastHeartbeatAt: now },
    })
  }

  return {
    serverNow: now.toISOString(),
    remainingSec: remainingSeconds(row, now),
    status: row.status as CbtHeartbeatResponse['status'],
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
    submittedReason: (row.submittedReason as CbtSubmittedReason | null) ?? null,
    resultAvailable: row.status === 'submitted' && row.resultJson !== null,
  }
}

export async function getAttemptResult(
  attemptId: string,
  userId: string,
  now: Date = new Date(),
): Promise<CbtResult> {
  let row = await loadAttemptRow(attemptId, userId)
  if (row.status === 'in_progress' && now.getTime() >= row.expiresAt.getTime()) {
    row = await finalizeExpired(row, now)
  }
  if (row.status !== 'submitted') {
    throw new CbtAttemptError(
      409,
      'ATTEMPT_IN_PROGRESS',
      'The result is available only after the attempt is submitted',
    )
  }
  const result = parseResult(row)
  if (!result) {
    throw new CbtAttemptError(
      409,
      'RESULT_UNAVAILABLE',
      'The stored result for this attempt is unavailable',
    )
  }
  return result
}

export interface ActiveAttemptSummary {
  id: string
  status: CbtAttemptState['status']
  startedAt: string
  expiresAt: string
  remainingSec: number
  submittedAt: string | null
  submittedReason: CbtSubmittedReason | null
  score: number | null
  maxMarks: number | null
}

export function activeAttemptSummary(
  row: ExamAttemptRow,
  now: Date = new Date(),
): ActiveAttemptSummary {
  return {
    id: row.id,
    status: row.status as ActiveAttemptSummary['status'],
    startedAt: row.startedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    remainingSec: remainingSeconds(row, now),
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
    submittedReason: (row.submittedReason as CbtSubmittedReason | null) ?? null,
    score: row.status === 'submitted' ? row.score : null,
    maxMarks: row.maxMarks,
  }
}

export async function listActiveAttempts(
  userId: string,
  now: Date = new Date(),
): Promise<Record<string, ActiveAttemptSummary>> {
  const rows = await db.examAttempt.findMany({
    where: { userId, status: 'in_progress' },
    orderBy: { startedAt: 'desc' },
  })
  const active: Record<string, ActiveAttemptSummary> = {}
  for (const row of rows) {
    const refreshed = await finalizeExpired(row, now)
    if (refreshed.status === 'in_progress' && !active[refreshed.profileCode]) {
      active[refreshed.profileCode] = activeAttemptSummary(refreshed, now)
    }
  }
  return active
}
