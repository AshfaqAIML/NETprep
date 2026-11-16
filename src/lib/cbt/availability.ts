/**
 * Content availability for each CBT profile.
 *
 * Availability is derived from the deliverable pool, not from a hard-coded
 * "enabled" flag. A profile becomes startable exactly when enough valid,
 * answer-keyed questions exist to assemble its paper.
 */

import {
  UGC_FULL_PAPER_UNIT_QUESTION_COUNT,
  ugcUnitByCode,
  ugcUnitsForPaper,
  type UgcPaper,
} from '../exam/ugc-units'
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

function unitRequirements(
  paper: UgcPaper,
  stats: CbtPoolStats,
): CbtContentRequirement[] {
  const paperLabel = paper === 'I' ? 'Paper I' : 'Paper II'
  return ugcUnitsForPaper(paper).map((unit) =>
    requirement(
      `${paperLabel} Unit ${unit.order} — ${unit.shortName} (${unit.code})`,
      UGC_FULL_PAPER_UNIT_QUESTION_COUNT[paper],
      stats.unitSingleCounts[unit.code] ?? 0,
    ),
  )
}

export function requirementsForProfile(
  profile: ExamProfile,
  stats: CbtPoolStats,
): CbtContentRequirement[] {
  const practiceUnitCode =
    typeof profile.metadata?.practiceUnit === 'string'
      ? profile.metadata.practiceUnit
      : null
  const practiceUnit = ugcUnitByCode(practiceUnitCode)
  if (practiceUnit) {
    return [
      requirement(
        `Unit ${practiceUnit.code} — ${practiceUnit.shortName}`,
        UGC_FULL_PAPER_UNIT_QUESTION_COUNT[practiceUnit.paper],
        stats.unitSingleCounts[practiceUnit.code] ?? 0,
      ),
    ]
  }

  switch (profile.code) {
    case 'UGC-NET-DEC-2026':
      return [...unitRequirements('I', stats), ...unitRequirements('II', stats)]
    case 'UGC-NET-DEC-2026-P1':
      return unitRequirements('I', stats)
    case 'UGC-NET-DEC-2026-P2-CS':
      return unitRequirements('II', stats)
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
