/**
 * Content availability for each CBT profile.
 *
 * Availability is derived from the deliverable pool, not from a hard-coded
 * "enabled" flag. A profile becomes startable exactly when enough valid,
 * answer-keyed questions exist to assemble its paper.
 */

import type { ExamProfile } from '../exam/types'
import type { CbtPoolStats } from './question-pool'
import type { CbtContentRequirement } from './types'

export interface CbtAvailabilityResult {
  available: boolean
  requirements: CbtContentRequirement[]
  note?: string
}

function requirement(
  label: string,
  required: number,
  available: number,
): CbtContentRequirement {
  return { label, required, available, unit: 'questions' }
}

export function requirementsForProfile(
  profile: ExamProfile,
  stats: CbtPoolStats,
): CbtContentRequirement[] {
  switch (profile.code) {
    case 'UGC-NET-DEC-2026':
      return [
        requirement('Paper I single-choice questions', 50, stats.paperOneSingle),
        requirement('Paper II single-choice questions', 100, stats.paperTwoSingle),
      ]
    case 'UGC-NET-DEC-2026-P1':
      return [requirement('Paper I single-choice questions', 50, stats.paperOneSingle)]
    case 'UGC-NET-DEC-2026-P2-CS':
      return [requirement('Paper II single-choice questions', 100, stats.paperTwoSingle)]
    case 'GATE-CS-2027':
      return [
        requirement('General Aptitude questions', 10, stats.generalAptitude),
        requirement('Engineering Mathematics questions', 10, stats.engineeringMathematics),
        requirement('Computer Science questions', 45, stats.computerScience),
      ]
    case 'GATE-DA-2027':
      return [
        requirement('General Aptitude questions', 10, stats.generalAptitude),
        requirement('Data Science & AI questions', 55, stats.dataScience),
      ]
    default:
      return [
        requirement('Deliverable questions', profile.totalQuestions, stats.totalDeliverable),
      ]
  }
}

export function availabilityForProfile(
  profile: ExamProfile,
  stats: CbtPoolStats,
): CbtAvailabilityResult {
  const requirements = requirementsForProfile(profile, stats)
  const missing = requirements.filter((item) => item.available < item.required)
  const available = missing.length === 0

  let note: string | undefined
  if (!available) {
    if (profile.code === 'GATE-DA-2027') {
      note =
        'GATE DA content is in preparation. The official pattern is configured, but no Data Science & AI questions are available yet.'
    } else {
      note = `Content in preparation: ${missing
        .map((item) => `${item.label} (${item.available}/${item.required})`)
        .join(', ')}.`
    }
  }

  return { available, requirements, ...(note ? { note } : {}) }
}
