/**
 * Unit tests for progress calculation logic.
 *
 * Progress is calculated based on:
 * - Topic completion status (not-started, studying, completed, needs-revision)
 * - Overall completion percentage
 * - Accuracy from question attempts
 * - Study streak calculation
 *
 * Run: bun test tests/unit/progress.test.ts
 */
import { describe, test, expect } from 'bun:test'

// --- Progress calculation functions ---

interface TopicProgress {
  topicId: string
  status: 'not-started' | 'studying' | 'completed' | 'needs-revision'
  confidence: number
}

interface Attempt {
  questionId: string
  isCorrect: boolean
}

function calculateCompletionRate(progress: TopicProgress[], totalTopics: number) {
  if (totalTopics === 0) return 0
  const completed = progress.filter((p) => p.status === 'completed').length
  return Math.round((completed / totalTopics) * 100)
}

function calculateAccuracy(attempts: Attempt[]) {
  if (attempts.length === 0) return 0
  const correct = attempts.filter((a) => a.isCorrect).length
  return Math.round((correct / attempts.length) * 100)
}

function calculateStreak(studyDates: Date[]): number {
  if (studyDates.length === 0) return 0

  const seen = new Set(studyDates.map((d) => new Date(d).toDateString()))
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getTime() - i * 86400000)
    if (seen.has(d.toDateString())) {
      streak++
    } else if (i > 0) {
      break
    }
  }
  return streak
}

function getWeakTopics(progress: TopicProgress[], threshold = 60): TopicProgress[] {
  return progress
    .filter((p) => p.confidence < threshold)
    .sort((a, b) => a.confidence - b.confidence)
}

function getStrongTopics(progress: TopicProgress[], threshold = 75): TopicProgress[] {
  return progress
    .filter((p) => p.confidence >= threshold && p.status === 'completed')
    .sort((a, b) => b.confidence - a.confidence)
}

// --- Tests ---

describe('Progress Calculations', () => {
  const mockProgress: TopicProgress[] = [
    { topicId: 't1', status: 'completed', confidence: 90 },
    { topicId: 't2', status: 'completed', confidence: 85 },
    { topicId: 't3', status: 'studying', confidence: 50 },
    { topicId: 't4', status: 'needs-revision', confidence: 40 },
    { topicId: 't5', status: 'not-started', confidence: 0 },
  ]

  test('completion rate with 2/5 completed', () => {
    const rate = calculateCompletionRate(mockProgress, 5)
    expect(rate).toBe(40)
  })

  test('completion rate with 0 topics', () => {
    const rate = calculateCompletionRate([], 0)
    expect(rate).toBe(0)
  })

  test('completion rate with all completed', () => {
    const allCompleted: TopicProgress[] = [
      { topicId: 't1', status: 'completed', confidence: 90 },
      { topicId: 't2', status: 'completed', confidence: 85 },
    ]
    const rate = calculateCompletionRate(allCompleted, 2)
    expect(rate).toBe(100)
  })

  test('accuracy with mixed attempts', () => {
    const attempts: Attempt[] = [
      { questionId: 'q1', isCorrect: true },
      { questionId: 'q2', isCorrect: true },
      { questionId: 'q3', isCorrect: false },
      { questionId: 'q4', isCorrect: true },
    ]
    expect(calculateAccuracy(attempts)).toBe(75)
  })

  test('accuracy with no attempts', () => {
    expect(calculateAccuracy([])).toBe(0)
  })

  test('accuracy with all correct', () => {
    const attempts: Attempt[] = [
      { questionId: 'q1', isCorrect: true },
      { questionId: 'q2', isCorrect: true },
    ]
    expect(calculateAccuracy(attempts)).toBe(100)
  })

  test('streak with consecutive days including today', () => {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 86400000)
    const dayBefore = new Date(today.getTime() - 2 * 86400000)
    const streak = calculateStreak([today, yesterday, dayBefore])
    expect(streak).toBe(3)
  })

  test('streak with gap (today + 3 days ago)', () => {
    const today = new Date()
    const threeDaysAgo = new Date(today.getTime() - 3 * 86400000)
    const streak = calculateStreak([today, threeDaysAgo])
    expect(streak).toBe(1) // Only today counts since yesterday was missed
  })

  test('streak with no study dates', () => {
    expect(calculateStreak([])).toBe(0)
  })

  test('weak topics below threshold 60', () => {
    const weak = getWeakTopics(mockProgress, 60)
    expect(weak.length).toBe(3) // t3(50), t4(40), t5(0)
    expect(weak[0].confidence).toBe(0) // Lowest first
  })

  test('strong topics above threshold 75', () => {
    const strong = getStrongTopics(mockProgress, 75)
    expect(strong.length).toBe(2) // t1(90), t2(85)
    expect(strong[0].confidence).toBe(90) // Highest first
  })
})
