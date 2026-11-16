/**
 * Pure, deterministic paper selection for CBT attempts.
 *
 * The selector never touches the database. It receives question candidates and
 * a frozen examination profile, then returns an ordered assignment of
 * questions to leaf sections with exact marks. The caller converts the result
 * into a frozen attempt snapshot and validates it with the engine before any
 * attempt is created.
 */

import { findSection } from '../exam/blueprint'
import {
  UGC_FULL_PAPER_UNIT_QUESTION_COUNT,
  ugcUnitByCode,
  ugcUnitsForPaper,
  type UgcPaper,
} from '../exam/ugc-units'
import type { ExamProfile, ExamSection } from '../exam/types'
import type {
  CbtQuestionCandidate,
  CbtSelectionAssignment,
} from './types'

export class CbtSelectionError extends Error {
  readonly code = 'CBT_SELECTION_ERROR'

  constructor(message: string) {
    super(message)
    this.name = 'CbtSelectionError'
  }
}

const DIFFICULTY_RANK: Record<string, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
}

function byId(a: CbtQuestionCandidate, b: CbtQuestionCandidate): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

function sortForSelection(a: CbtQuestionCandidate, b: CbtQuestionCandidate): number {
  if (a.verified !== b.verified) return a.verified ? -1 : 1
  const difficulty = (DIFFICULTY_RANK[a.difficulty] ?? 9) - (DIFFICULTY_RANK[b.difficulty] ?? 9)
  if (difficulty !== 0) return difficulty
  return byId(a, b)
}

/**
 * Round-robin across topics so a full paper covers the syllabus rather than
 * exhausting one topic before moving on. Selection is deterministic for a
 * given candidate pool.
 */
export function roundRobinByTopic(
  pool: CbtQuestionCandidate[],
  limit: number,
): CbtQuestionCandidate[] {
  if (limit <= 0) return []
  const groups = new Map<string, CbtQuestionCandidate[]>()
  for (const question of pool) {
    const key = question.topicId ?? question.unitName ?? 'unassigned'
    const list = groups.get(key) ?? []
    list.push(question)
    groups.set(key, list)
  }

  const keys = Array.from(groups.keys()).sort()
  for (const key of keys) {
    groups.get(key)?.sort(sortForSelection)
  }

  const selected: CbtQuestionCandidate[] = []
  let depth = 0
  while (selected.length < limit) {
    let added = false
    for (const key of keys) {
      const question = groups.get(key)?.[depth]
      if (!question) continue
      selected.push(question)
      added = true
      if (selected.length === limit) break
    }
    if (!added) break
    depth += 1
  }
  return selected
}

function requireSection(profile: ExamProfile, sectionId: string): ExamSection {
  const section = findSection(profile, sectionId)
  if (!section) {
    throw new CbtSelectionError(
      `Profile ${profile.code} does not define the section "${sectionId}"`,
    )
  }
  return section
}

function fixedMarksForSection(section: ExamSection): number[] {
  return section.questionRules
    .filter((rule) => rule.count !== undefined)
    .flatMap((rule) => Array.from({ length: rule.count ?? 0 }, () => rule.marks))
}

function singleMarkValue(section: ExamSection): number {
  const rule = section.questionRules.find((candidate) => candidate.responseType === 'single')
  if (!rule) {
    throw new CbtSelectionError(`Section "${section.id}" has no single-response rule`)
  }
  return rule.marks
}

function selectSingleSection(
  profile: ExamProfile,
  sectionId: string,
  pool: CbtQuestionCandidate[],
  count: number,
): CbtSelectionAssignment[] {
  const section = requireSection(profile, sectionId)
  const marks = singleMarkValue(section)
  const eligible = pool.filter((question) => question.responseType === 'single')
  const selected = roundRobinByTopic(eligible, count)
  if (selected.length < count) {
    throw new CbtSelectionError(
      `Section "${sectionId}" needs ${count} single-response questions but only ${selected.length} are available`,
    )
  }
  return selected.map((candidate) => ({ candidate, sectionId, marks }))
}

/**
 * Assign 1/2-mark slots to a GATE subject component. The official pattern fixes
 * the component's marks, not its individual question count, so we derive the
 * number of two-mark questions from `marks - count`.
 */
function selectGateSubjectSection(
  profile: ExamProfile,
  sectionId: string,
  pool: CbtQuestionCandidate[],
  count: number,
): CbtSelectionAssignment[] {
  const section = requireSection(profile, sectionId)
  const twoMarkCount = section.marks - count
  if (twoMarkCount < 0 || twoMarkCount > count) {
    throw new CbtSelectionError(
      `Section "${sectionId}" cannot be assembled from ${count} questions worth ${section.marks} marks using 1/2-mark questions`,
    )
  }

  const special = pool
    .filter((question) => question.responseType !== 'single')
    .sort((a, b) => {
      const sectionPriority =
        Number(b.gateSection === sectionId) - Number(a.gateSection === sectionId)
      if (sectionPriority !== 0) return sectionPriority
      if (a.verified !== b.verified) return a.verified ? -1 : 1
      return byId(a, b)
    })

  const regular = pool
    .filter((question) => question.responseType === 'single')
    .sort((a, b) => {
      const sectionPriority =
        Number(b.gateSection === sectionId) - Number(a.gateSection === sectionId)
      if (sectionPriority !== 0) return sectionPriority
      return byId(a, b)
    })

  // Keep every available MSQ/NAT in the paper (up to the section size), then
  // fill the remaining slots with a topic-balanced single-response selection.
  const selected: CbtQuestionCandidate[] = special.slice(0, count)
  if (selected.length < count) {
    const regularNeeded = count - selected.length
    const regularSelected = roundRobinByTopic(regular, regularNeeded)
    selected.push(...regularSelected)
  }

  if (selected.length < count) {
    throw new CbtSelectionError(
      `Section "${sectionId}" needs ${count} questions but only ${selected.length} are available`,
    )
  }

  // Two-mark slots take every MSQ/NAT first (all special formats are worth
  // two marks), then the hardest single-response questions. One-mark slots take
  // the remainder. GATE presents one-mark questions before two-mark questions.
  const ranked = [...selected].sort((a, b) => {
    const specialPriority =
      Number(b.responseType !== 'single') - Number(a.responseType !== 'single')
    if (specialPriority !== 0) return specialPriority
    const difficulty =
      (DIFFICULTY_RANK[b.difficulty] ?? 0) - (DIFFICULTY_RANK[a.difficulty] ?? 0)
    if (difficulty !== 0) return difficulty
    return byId(a, b)
  })
  const twoMarkQuestions = ranked.slice(0, twoMarkCount)
  const oneMarkQuestions = ranked.slice(twoMarkCount)

  return [
    ...oneMarkQuestions.map((candidate) => ({ candidate, sectionId, marks: 1 })),
    ...twoMarkQuestions.map((candidate) => ({ candidate, sectionId, marks: 2 })),
  ]
}

function selectGateGeneralAptitude(
  profile: ExamProfile,
  pool: CbtQuestionCandidate[],
): CbtSelectionAssignment[] {
  const sectionId = 'general-aptitude'
  const section = requireSection(profile, sectionId)
  const slots = fixedMarksForSection(section)
  const count = slots.length
  const eligible = pool.filter((question) => question.responseType === 'single')
  const selected = roundRobinByTopic(eligible, count)
  if (selected.length < count) {
    throw new CbtSelectionError(
      `Section "${sectionId}" needs ${count} single-response questions but only ${selected.length} are available`,
    )
  }

  // Easier questions get the one-mark slots; harder questions get two marks.
  const ordered = [...selected].sort((a, b) => {
    const difficulty =
      (DIFFICULTY_RANK[a.difficulty] ?? 9) - (DIFFICULTY_RANK[b.difficulty] ?? 9)
    if (difficulty !== 0) return difficulty
    return byId(a, b)
  })
  const sortedSlots = [...slots].sort((a, b) => a - b)
  return ordered.map((candidate, index) => ({
    candidate,
    sectionId,
    marks: sortedSlots[index] ?? sortedSlots[sortedSlots.length - 1] ?? 1,
  }))
}

/**
 * Select an official-unit-complete UGC paper. Each of the ten syllabus units
 * contributes exactly `perUnit` questions, so a full paper covers the whole
 * syllabus instead of exhausting whichever topics happen to be largest.
 */
function selectUgcPaperSection(
  profile: ExamProfile,
  paper: UgcPaper,
  sectionId: string,
  pool: CbtQuestionCandidate[],
  perUnit: number,
): CbtSelectionAssignment[] {
  const section = requireSection(profile, sectionId)
  const marks = singleMarkValue(section)
  const assignments: CbtSelectionAssignment[] = []
  const shortfalls: string[] = []

  for (const unit of ugcUnitsForPaper(paper)) {
    const eligible = pool.filter(
      (question) =>
        question.paper === paper &&
        question.responseType === 'single' &&
        question.syllabusUnit === unit.code,
    )
    const selected = roundRobinByTopic(eligible, perUnit)
    if (selected.length < perUnit) {
      shortfalls.push(
        `${unit.code} ${unit.shortName} (${selected.length}/${perUnit})`,
      )
      continue
    }
    for (const candidate of selected) {
      assignments.push({ candidate, sectionId, marks })
    }
  }

  if (shortfalls.length > 0) {
    throw new CbtSelectionError(
      `Section "${sectionId}" is missing official-unit coverage: ${shortfalls.join(', ')}`,
    )
  }
  return assignments
}

export function selectUgcPaper(
  profile: ExamProfile,
  paperOnePool: CbtQuestionCandidate[],
  paperTwoPool: CbtQuestionCandidate[],
): CbtSelectionAssignment[] {
  const assignments: CbtSelectionAssignment[] = []
  const paperOne = findSection(profile, 'paper-1')
  const paperTwo = findSection(profile, 'paper-2')

  if (paperOne) {
    assignments.push(
      ...selectUgcPaperSection(
        profile,
        'I',
        'paper-1',
        paperOnePool,
        UGC_FULL_PAPER_UNIT_QUESTION_COUNT.I,
      ),
    )
  }
  if (paperTwo) {
    assignments.push(
      ...selectUgcPaperSection(
        profile,
        'II',
        'paper-2',
        paperTwoPool,
        UGC_FULL_PAPER_UNIT_QUESTION_COUNT.II,
      ),
    )
  }
  if (assignments.length === 0) {
    throw new CbtSelectionError(`Profile ${profile.code} has no UGC paper sections`)
  }
  return assignments
}

/**
 * Sectional practice draws only from the requested official unit. The profile
 * carries the unit code in metadata so no profile-code switch is needed.
 */
export function selectUgcUnitPractice(
  profile: ExamProfile,
  pool: CbtQuestionCandidate[],
): CbtSelectionAssignment[] {
  const requested =
    typeof profile.metadata?.practiceUnit === 'string'
      ? profile.metadata.practiceUnit
      : null
  const unit = ugcUnitByCode(requested)
  if (!unit) {
    throw new CbtSelectionError(
      `Profile ${profile.code} does not name a valid official unit`,
    )
  }

  const sectionId = unit.paper === 'I' ? 'paper-1' : 'paper-2'
  const section = requireSection(profile, sectionId)
  const count =
    section.questionCount ?? UGC_FULL_PAPER_UNIT_QUESTION_COUNT[unit.paper]
  const marks = singleMarkValue(section)
  const eligible = pool.filter(
    (question) =>
      question.paper === unit.paper &&
      question.responseType === 'single' &&
      question.syllabusUnit === unit.code,
  )
  const selected = roundRobinByTopic(eligible, count)
  if (selected.length < count) {
    throw new CbtSelectionError(
      `Unit ${unit.code} ${unit.shortName} needs ${count} questions but only ${selected.length} are available`,
    )
  }
  return selected.map((candidate) => ({ candidate, sectionId, marks }))
}

export function selectGateCsPaper(
  profile: ExamProfile,
  generalAptitudePool: CbtQuestionCandidate[],
  engineeringMathematicsPool: CbtQuestionCandidate[],
  computerSciencePool: CbtQuestionCandidate[],
): CbtSelectionAssignment[] {
  const assignments: CbtSelectionAssignment[] = []
  assignments.push(
    ...selectGateGeneralAptitude(
      profile,
      generalAptitudePool.filter((question) => question.paper === 'I'),
    ),
  )

  const em = requireSection(profile, 'engineering-mathematics')
  const emCount = 10
  assignments.push(
    ...selectGateSubjectSection(
      profile,
      'engineering-mathematics',
      engineeringMathematicsPool.filter((question) => question.paper === 'II'),
      emCount,
    ),
  )

  const cs = requireSection(profile, 'computer-science')
  const subject = findSection(profile, 'subject')
  const subjectCount = subject?.questionCount ?? 55
  const csCount = subjectCount - emCount
  assignments.push(
    ...selectGateSubjectSection(
      profile,
      'computer-science',
      computerSciencePool.filter((question) => question.paper === 'II'),
      csCount,
    ),
  )

  // A guard for future profile edits: every leaf section's marks must be
  // exactly satisfied by the selected assignments.
  for (const section of [em, cs]) {
    const actual = assignments
      .filter((assignment) => assignment.sectionId === section.id)
      .reduce((sum, assignment) => sum + assignment.marks, 0)
    if (actual !== section.marks) {
      throw new CbtSelectionError(
        `Section "${section.id}" selected ${actual} marks but the profile requires ${section.marks}`,
      )
    }
  }

  return assignments
}

export function selectGateDaPaper(
  profile: ExamProfile,
  generalAptitudePool: CbtQuestionCandidate[],
  dataSciencePool: CbtQuestionCandidate[],
): CbtSelectionAssignment[] {
  const assignments: CbtSelectionAssignment[] = []
  assignments.push(
    ...selectGateGeneralAptitude(
      profile,
      generalAptitudePool.filter((question) => question.paper === 'I'),
    ),
  )
  const da = requireSection(profile, 'data-science-ai')
  const count = da.questionCount ?? 55
  assignments.push(
    ...selectGateSubjectSection(
      profile,
      'data-science-ai',
      dataSciencePool.filter((question) => question.paper === 'II'),
      count,
    ),
  )
  return assignments
}

/**
 * Dispatch by profile code. Unknown profiles fall back to a section-aware
 * generic selector using the supplied pools keyed by section id.
 */
export function selectCbtPaper(
  profile: ExamProfile,
  pools: {
    paperOne?: CbtQuestionCandidate[]
    paperTwo?: CbtQuestionCandidate[]
    generalAptitude?: CbtQuestionCandidate[]
    engineeringMathematics?: CbtQuestionCandidate[]
    computerScience?: CbtQuestionCandidate[]
    dataScience?: CbtQuestionCandidate[]
  },
): CbtSelectionAssignment[] {
  if (profile.family === 'UGC_NET') {
    if (profile.metadata?.unitPractice === true) {
      return selectUgcUnitPractice(profile, [
        ...(pools.paperOne ?? []),
        ...(pools.paperTwo ?? []),
      ])
    }
    return selectUgcPaper(
      profile,
      pools.paperOne ?? [],
      pools.paperTwo ?? [],
    )
  }
  if (profile.code === 'GATE-DA-2027') {
    return selectGateDaPaper(
      profile,
      pools.generalAptitude ?? pools.paperOne ?? [],
      pools.dataScience ?? pools.paperTwo ?? [],
    )
  }
  return selectGateCsPaper(
    profile,
    pools.generalAptitude ?? pools.paperOne ?? [],
    pools.engineeringMathematics ?? pools.paperTwo ?? [],
    pools.computerScience ?? pools.paperTwo ?? [],
  )
}
