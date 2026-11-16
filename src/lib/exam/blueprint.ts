/**
 * Blueprint traversal helpers shared by validation, paper building and scoring.
 * No DB, React or network access belongs here.
 */

import type {
  ExamProfile,
  ExamSection,
  QuestionPresentationType,
  ResponseType,
} from './types'

export interface SectionNode {
  section: ExamSection
  /** Ancestors from the top-level section down to the direct parent. */
  parentIds: string[]
  depth: number
  isLeaf: boolean
}

export function walkSections(
  sections: ExamSection[],
  parentIds: string[] = [],
  depth = 0,
): SectionNode[] {
  const nodes: SectionNode[] = []
  for (const section of sections) {
    const isLeaf = !section.children || section.children.length === 0
    nodes.push({ section, parentIds, depth, isLeaf })
    if (!isLeaf) {
      nodes.push(
        ...walkSections(section.children as ExamSection[], [...parentIds, section.id], depth + 1),
      )
    }
  }
  return nodes
}

export function getSectionNodes(profile: ExamProfile): SectionNode[] {
  return walkSections(profile.sections)
}

export function getLeafSections(profile: ExamProfile): SectionNode[] {
  return getSectionNodes(profile).filter((node) => node.isLeaf)
}

export function findSectionNode(
  profile: ExamProfile,
  sectionId: string,
): SectionNode | null {
  return getSectionNodes(profile).find((node) => node.section.id === sectionId) ?? null
}

export function findSection(
  profile: ExamProfile,
  sectionId: string,
): ExamSection | null {
  return findSectionNode(profile, sectionId)?.section ?? null
}

export function descendantLeafIds(section: ExamSection): string[] {
  if (!section.children || section.children.length === 0) return [section.id]
  return section.children.flatMap(descendantLeafIds)
}

export function descendantSectionNodes(section: ExamSection): SectionNode[] {
  return walkSections(section.children ?? [], [section.id], 0)
}

/** Official count when fixed; otherwise derived from children/rules if possible. */
export function resolvedSectionQuestionCount(section: ExamSection): number | null {
  if (section.questionCount !== null) return section.questionCount

  if (section.children && section.children.length > 0) {
    const counts = section.children.map(resolvedSectionQuestionCount)
    if (counts.every((c): c is number => c !== null)) {
      return counts.reduce((sum, c) => sum + c, 0)
    }
    return null
  }

  if (section.questionRules.every((rule) => rule.count !== undefined)) {
    return section.questionRules.reduce((sum, rule) => sum + (rule.count ?? 0), 0)
  }
  return null
}

export function resolvedProfileQuestionCount(profile: ExamProfile): number | null {
  const counts = profile.sections.map(resolvedSectionQuestionCount)
  if (counts.every((c): c is number => c !== null)) {
    return counts.reduce((sum, c) => sum + c, 0)
  }
  return null
}

export function sectionAllowsResponseType(
  section: ExamSection,
  responseType: ResponseType,
): boolean {
  return section.questionRules.some((rule) => rule.responseType === responseType)
}

export function sectionAllowedMarks(
  section: ExamSection,
  responseType: ResponseType,
): number[] {
  return Array.from(
    new Set(
      section.questionRules
        .filter((rule) => rule.responseType === responseType)
        .map((rule) => rule.marks),
    ),
  ).sort((a, b) => a - b)
}

export function sectionAllowedPresentationTypes(
  profile: ExamProfile,
  section: ExamSection,
  responseType: ResponseType,
): QuestionPresentationType[] {
  const rules = section.questionRules.filter((rule) => rule.responseType === responseType)
  if (rules.length === 0) return []
  // A rule without an explicit list inherits the profile-wide list.
  if (rules.some((rule) => !rule.presentationTypes || rule.presentationTypes.length === 0)) {
    return [...profile.presentationTypes]
  }
  return Array.from(new Set(rules.flatMap((rule) => rule.presentationTypes ?? [])))
}

export function sectionLanguage(
  profile: ExamProfile,
  section: ExamSection,
): { default: string; available: string[] } {
  const language = section.language ?? profile.language
  return { default: language.default, available: [...language.available] }
}

/** Deterministic, dependency-free deep clone for plain configuration objects. */
export function cloneExamProfile(profile: ExamProfile): ExamProfile {
  return JSON.parse(JSON.stringify(profile)) as ExamProfile
}

export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value
  if (Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const key of Object.keys(value as Record<string, unknown>)) {
    deepFreeze((value as Record<string, unknown>)[key])
  }
  return value
}

/** Compare dotted numeric versions such as 2027.1 vs 2027.2. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(/[.-]/)
  const pb = b.split(/[.-]/)
  const length = Math.max(pa.length, pb.length)
  for (let i = 0; i < length; i += 1) {
    const av = pa[i]
    const bv = pb[i]
    if (av === undefined) return -1
    if (bv === undefined) return 1
    const an = Number(av)
    const bn = Number(bv)
    if (Number.isFinite(an) && Number.isFinite(bn)) {
      if (an !== bn) return an < bn ? -1 : 1
    } else if (av !== bv) {
      return av < bv ? -1 : 1
    }
  }
  return 0
}

/**
 * Returns true when `amount` can be formed from the given positive integer
 * denominations. Used to verify marks-only sections such as GATE EM (13 marks
 * from 1/2-mark questions).
 */
export function isAchievableAmount(amount: number, denominations: number[]): boolean {
  if (amount === 0) return true
  const coins = Array.from(new Set(denominations.filter((d) => d > 0))).sort((a, b) => a - b)
  if (coins.length === 0) return false
  if (coins[0] > amount) return false
  // Unbounded coin change, exact DP.
  const reachable = new Array<boolean>(amount + 1).fill(false)
  reachable[0] = true
  for (let value = 1; value <= amount; value += 1) {
    for (const coin of coins) {
      if (coin <= value && reachable[value - coin]) {
        reachable[value] = true
        break
      }
    }
  }
  return reachable[amount]
}
