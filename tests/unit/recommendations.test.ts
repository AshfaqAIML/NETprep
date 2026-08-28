/**
 * Unit tests for the recommendation engine.
 *
 * Recommendations are generated based on:
 * - User accuracy (low → suggest revision)
 * - Weak topics (existence → suggest practice)
 * - Mock test count (low → suggest taking mocks)
 * - Study consistency (low → suggest building streak)
 * - Topics needing revision
 * - Wrong attempts (existence → suggest review)
 *
 * Run: bun test tests/unit/recommendations.test.ts
 */
import { describe, test, expect } from 'bun:test'

// --- Recommendation types ---

interface Recommendation {
  title: string
  description: string
  action: string
  priority: 'high' | 'medium' | 'low'
}

interface UserStats {
  totalAttempts: number
  correctAttempts: number
  accuracy: number
  mockAttempts: number
  weakTopicCount: number
  needsRevisionCount: number
  wrongAttemptCount: number
  studyDaysLast7: number
}

// --- Recommendation engine (mirrors /api/dashboard logic) ---

function generateRecommendations(stats: UserStats): Recommendation[] {
  const recs: Recommendation[] = []

  // 1. Low accuracy → suggest revision
  if (stats.totalAttempts > 5 && stats.accuracy < 70) {
    recs.push({
      title: 'Improve your accuracy',
      description: `Your accuracy is ${stats.accuracy}%. Revise topics where you scored below 60%.`,
      action: 'Start Revision Practice',
      priority: 'high',
    })
  }

  // 2. Weak topics exist → suggest practice
  if (stats.weakTopicCount > 0) {
    recs.push({
      title: `Practice your ${stats.weakTopicCount} weak topic${stats.weakTopicCount !== 1 ? 's' : ''}`,
      description: `Focus on low-confidence areas.`,
      action: 'Practice Weak Areas',
      priority: 'high',
    })
  }

  // 3. Few mock tests → suggest taking more
  if (stats.mockAttempts < 3) {
    recs.push({
      title: 'Take more mock tests',
      description: `You've attempted ${stats.mockAttempts} mock test(s). Aim for at least 1 per week.`,
      action: 'Take a Mock Test',
      priority: 'medium',
    })
  }

  // 4. Low study consistency → suggest building streak
  if (stats.studyDaysLast7 < 4 && stats.totalAttempts > 0) {
    recs.push({
      title: 'Build a study streak',
      description: `You studied on ${stats.studyDaysLast7} of the last 7 days.`,
      action: 'Open Study Planner',
      priority: 'medium',
    })
  }

  // 5. Topics needing revision
  if (stats.needsRevisionCount > 0) {
    recs.push({
      title: `${stats.needsRevisionCount} topic${stats.needsRevisionCount !== 1 ? 's' : ''} need revision`,
      description: 'Review them before moving to new topics.',
      action: 'Open Revision Center',
      priority: 'high',
    })
  }

  // 6. Wrong attempts exist → suggest review
  if (stats.wrongAttemptCount > 0) {
    recs.push({
      title: `Review your ${stats.wrongAttemptCount} mistake${stats.wrongAttemptCount !== 1 ? 's' : ''}`,
      description: 'Reattempting incorrect questions improves retention.',
      action: 'Review Mistakes',
      priority: 'medium',
    })
  }

  // 7. Default — suggest cheat sheets if not enough recommendations
  if (recs.length < 3) {
    recs.push({
      title: 'Revise with cheat sheets',
      description: 'Quick 10-minute revision of formulas and definitions.',
      action: 'Open Cheat Sheets',
      priority: 'low',
    })
  }

  // Sort by priority
  const order = { high: 0, medium: 1, low: 2 }
  recs.sort((a, b) => order[a.priority] - order[b.priority])

  return recs
}

// --- Tests ---

describe('Recommendation Engine', () => {
  test('generates revision recommendation for low accuracy', () => {
    const recs = generateRecommendations({
      totalAttempts: 20,
      correctAttempts: 10,
      accuracy: 50,
      mockAttempts: 5,
      weakTopicCount: 0,
      needsRevisionCount: 0,
      wrongAttemptCount: 0,
      studyDaysLast7: 5,
    })
    const revisionRec = recs.find((r) => r.title.includes('accuracy'))
    expect(revisionRec).toBeDefined()
    expect(revisionRec!.priority).toBe('high')
    expect(revisionRec!.description).toContain('50%')
  })

  test('generates weak topics recommendation', () => {
    const recs = generateRecommendations({
      totalAttempts: 10,
      correctAttempts: 8,
      accuracy: 80,
      mockAttempts: 5,
      weakTopicCount: 3,
      needsRevisionCount: 0,
      wrongAttemptCount: 0,
      studyDaysLast7: 5,
    })
    const weakRec = recs.find((r) => r.title.includes('weak topic'))
    expect(weakRec).toBeDefined()
    expect(weakRec!.priority).toBe('high')
    expect(weakRec!.title).toContain('3')
  })

  test('generates mock test recommendation for low count', () => {
    const recs = generateRecommendations({
      totalAttempts: 10,
      correctAttempts: 8,
      accuracy: 80,
      mockAttempts: 1,
      weakTopicCount: 0,
      needsRevisionCount: 0,
      wrongAttemptCount: 0,
      studyDaysLast7: 5,
    })
    const mockRec = recs.find((r) => r.title.includes('mock test'))
    expect(mockRec).toBeDefined()
    expect(mockRec!.priority).toBe('medium')
  })

  test('generates streak recommendation for low consistency', () => {
    const recs = generateRecommendations({
      totalAttempts: 10,
      correctAttempts: 8,
      accuracy: 80,
      mockAttempts: 5,
      weakTopicCount: 0,
      needsRevisionCount: 0,
      wrongAttemptCount: 0,
      studyDaysLast7: 2,
    })
    const streakRec = recs.find((r) => r.title.includes('streak'))
    expect(streakRec).toBeDefined()
    expect(streakRec!.priority).toBe('medium')
    expect(streakRec!.description).toContain('2')
  })

  test('generates revision recommendation for topics needing revision', () => {
    const recs = generateRecommendations({
      totalAttempts: 10,
      correctAttempts: 8,
      accuracy: 80,
      mockAttempts: 5,
      weakTopicCount: 0,
      needsRevisionCount: 4,
      wrongAttemptCount: 0,
      studyDaysLast7: 5,
    })
    const revRec = recs.find((r) => r.title.includes('revision'))
    expect(revRec).toBeDefined()
    expect(revRec!.priority).toBe('high')
    expect(revRec!.title).toContain('4')
  })

  test('generates mistake review recommendation', () => {
    const recs = generateRecommendations({
      totalAttempts: 10,
      correctAttempts: 8,
      accuracy: 80,
      mockAttempts: 5,
      weakTopicCount: 0,
      needsRevisionCount: 0,
      wrongAttemptCount: 12,
      studyDaysLast7: 5,
    })
    const mistakeRec = recs.find((r) => r.title.includes('mistake'))
    expect(mistakeRec).toBeDefined()
    expect(mistakeRec!.priority).toBe('medium')
  })

  test('adds default cheat sheet recommendation when few recs exist', () => {
    const recs = generateRecommendations({
      totalAttempts: 0,
      correctAttempts: 0,
      accuracy: 0,
      mockAttempts: 5,
      weakTopicCount: 0,
      needsRevisionCount: 0,
      wrongAttemptCount: 0,
      studyDaysLast7: 5,
    })
    const cheatRec = recs.find((r) => r.title.includes('cheat sheet'))
    expect(cheatRec).toBeDefined()
    expect(cheatRec!.priority).toBe('low')
  })

  test('recommendations are sorted by priority (high first)', () => {
    const recs = generateRecommendations({
      totalAttempts: 20,
      correctAttempts: 5,
      accuracy: 25,
      mockAttempts: 1,
      weakTopicCount: 3,
      needsRevisionCount: 2,
      wrongAttemptCount: 15,
      studyDaysLast7: 1,
    })
    // All high-priority items should come before medium, which comes before low
    const priorities = recs.map((r) => r.priority)
    const firstMedium = priorities.indexOf('medium')
    const lastHigh = priorities.lastIndexOf('high')
    if (firstMedium !== -1 && lastHigh !== -1) {
      expect(lastHigh).toBeLessThan(firstMedium)
    }
  })

  test('new user with no data gets default recommendation', () => {
    const recs = generateRecommendations({
      totalAttempts: 0,
      correctAttempts: 0,
      accuracy: 0,
      mockAttempts: 0,
      weakTopicCount: 0,
      needsRevisionCount: 0,
      wrongAttemptCount: 0,
      studyDaysLast7: 0,
    })
    // Should have at least 1 recommendation (mock test or cheat sheets)
    expect(recs.length).toBeGreaterThanOrEqual(1)
  })

  test('does not generate accuracy recommendation for high accuracy', () => {
    const recs = generateRecommendations({
      totalAttempts: 20,
      correctAttempts: 18,
      accuracy: 90,
      mockAttempts: 5,
      weakTopicCount: 0,
      needsRevisionCount: 0,
      wrongAttemptCount: 0,
      studyDaysLast7: 5,
    })
    const accRec = recs.find((r) => r.title.includes('accuracy'))
    expect(accRec).toBeUndefined()
  })
})
