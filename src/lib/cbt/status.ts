/**
 * Presentation helpers for CBT attempts.
 *
 * These mirror the server's counting rules so the palette updates immediately
 * after a click, while the stored attempt remains authoritative.
 */

import type {
  CbtAttemptCounts,
  CbtResponse,
  CbtResponses,
  CbtSanitizedQuestion,
} from './types'

export type CbtQuestionStatus =
  | 'not-visited'
  | 'not-answered'
  | 'answered'
  | 'marked'
  | 'answered-marked'

type QuestionShape = Pick<
  CbtSanitizedQuestion,
  'id' | 'responseType'
>

export function isAnswerPresent(
  question: QuestionShape,
  response: CbtResponse | null | undefined,
): boolean {
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
        (id) => typeof id === 'string' && id.trim() !== '',
      )
    )
  }
  if (response.numericValue === null || response.numericValue === undefined) {
    return false
  }
  if (typeof response.numericValue === 'string') {
    return (
      response.numericValue.trim() !== '' &&
      Number.isFinite(Number(response.numericValue))
    )
  }
  return Number.isFinite(response.numericValue)
}

export function questionStatus(
  question: QuestionShape,
  response: CbtResponse | null | undefined,
): CbtQuestionStatus {
  const answered = isAnswerPresent(question, response)
  const marked = response?.markedForReview === true
  if (answered && marked) return 'answered-marked'
  if (answered) return 'answered'
  if (marked) return 'marked'
  if (response?.visited === true) return 'not-answered'
  return 'not-visited'
}

export function computeAttemptCounts(
  questions: QuestionShape[],
  responses: CbtResponses,
): CbtAttemptCounts {
  let answered = 0
  let notAnswered = 0
  let marked = 0
  let answeredMarked = 0
  let visited = 0

  for (const question of questions) {
    const status = questionStatus(question, responses[question.id])
    if (status !== 'not-visited') visited += 1
    if (status === 'answered') answered += 1
    else if (status === 'answered-marked') answeredMarked += 1
    else if (status === 'marked') marked += 1
    else if (status === 'not-answered') notAnswered += 1
  }

  return {
    total: questions.length,
    answered,
    notAnswered,
    marked,
    answeredMarked,
    visited,
    notVisited: questions.length - visited,
  }
}

export function statusLabel(status: CbtQuestionStatus): string {
  switch (status) {
    case 'answered':
      return 'Answered'
    case 'not-answered':
      return 'Not answered'
    case 'marked':
      return 'Marked for review'
    case 'answered-marked':
      return 'Answered and marked for review'
    default:
      return 'Not visited'
  }
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} hr`
  return `${hours} hr ${minutes} min`
}

export function formatScore(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '0'
  const rounded = Number(value.toFixed(decimals))
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(decimals)
}

export function signedScore(value: number, decimals = 2): string {
  if (!Number.isFinite(value) || value === 0) return '0'
  return `${value > 0 ? '+' : '−'}${formatScore(Math.abs(value), decimals)}`
}
