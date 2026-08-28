/**
 * Unit tests for scoring logic.
 *
 * UGC NET scoring:
 * - +2 marks per correct answer
 * - 0 marks per incorrect/skipped answer
 * - No negative marking (under current exam pattern)
 *
 * Run: bun test tests/unit/scoring.test.ts
 */
import { describe, test, expect } from 'bun:test'

// --- Scoring functions (mirroring /api/mock-tests/submit logic) ---

interface Question {
  id: string
  correctAnswer: string
}

interface Submission {
  answers: Record<string, string>
  questions: Question[]
}

function calculateScore(submission: Submission) {
  let correct = 0
  let incorrect = 0
  let skipped = 0

  for (const q of submission.questions) {
    const selected = submission.answers[q.id]
    if (!selected) {
      skipped++
    } else if (selected === q.correctAnswer) {
      correct++
    } else {
      incorrect++
    }
  }

  const total = submission.questions.length
  const score = correct * 2 // 2 marks per correct
  const attempted = correct + incorrect
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0

  return { correct, incorrect, skipped, total, score, attempted, accuracy, percentage }
}

// --- Tests ---

describe('Scoring Logic', () => {
  const questions: Question[] = [
    { id: 'q1', correctAnswer: 'A' },
    { id: 'q2', correctAnswer: 'B' },
    { id: 'q3', correctAnswer: 'C' },
    { id: 'q4', correctAnswer: 'D' },
    { id: 'q5', correctAnswer: 'A' },
  ]

  test('all correct answers', () => {
    const result = calculateScore({
      answers: { q1: 'A', q2: 'B', q3: 'C', q4: 'D', q5: 'A' },
      questions,
    })
    expect(result.correct).toBe(5)
    expect(result.incorrect).toBe(0)
    expect(result.skipped).toBe(0)
    expect(result.score).toBe(10)
    expect(result.accuracy).toBe(100)
    expect(result.percentage).toBe(100)
  })

  test('all incorrect answers', () => {
    const result = calculateScore({
      answers: { q1: 'B', q2: 'C', q3: 'D', q4: 'A', q5: 'B' },
      questions,
    })
    expect(result.correct).toBe(0)
    expect(result.incorrect).toBe(5)
    expect(result.skipped).toBe(0)
    expect(result.score).toBe(0)
    expect(result.accuracy).toBe(0)
  })

  test('all skipped', () => {
    const result = calculateScore({
      answers: {},
      questions,
    })
    expect(result.correct).toBe(0)
    expect(result.incorrect).toBe(0)
    expect(result.skipped).toBe(5)
    expect(result.score).toBe(0)
    expect(result.accuracy).toBe(0)
  })

  test('mixed results — 3 correct, 1 incorrect, 1 skipped', () => {
    const result = calculateScore({
      answers: { q1: 'A', q2: 'B', q3: 'D', q4: 'D' },
      questions,
    })
    expect(result.correct).toBe(3)
    expect(result.incorrect).toBe(1)
    expect(result.skipped).toBe(1)
    expect(result.score).toBe(6)
    expect(result.attempted).toBe(4)
    expect(result.accuracy).toBe(75)
    expect(result.percentage).toBe(60)
  })

  test('no negative marking — incorrect answers do not reduce score', () => {
    const result = calculateScore({
      answers: { q1: 'A', q2: 'X', q3: 'X', q4: 'X', q5: 'X' },
      questions,
    })
    expect(result.correct).toBe(1)
    expect(result.incorrect).toBe(4)
    expect(result.score).toBe(2) // Only +2 for the one correct, no deduction
  })

  test('empty questions list', () => {
    const result = calculateScore({ answers: {}, questions: [] })
    expect(result.total).toBe(0)
    expect(result.score).toBe(0)
    expect(result.accuracy).toBe(0)
    expect(result.percentage).toBe(0)
  })
})
