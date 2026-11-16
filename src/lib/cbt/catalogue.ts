/**
 * CBT catalogue: profile summaries, content availability and active attempts.
 *
 * The catalogue is computed from the same pool and availability rules used by
 * attempt creation, so a start button is never shown for a paper that cannot
 * actually be assembled.
 */

import { findSection, getLeafSections } from '../exam/blueprint'
import { EXAM_PROFILES, getDefaultExamRegistry } from '../exam/profiles'
import type { ExamProfile } from '../exam/types'
import { CbtAttemptError, listActiveAttempts } from './attempt'
import { availabilityForProfile } from './availability'
import type { CbtIdentity } from './candidate'
import { computePoolStats, loadCbtQuestionPool } from './question-pool'
import type {
  CbtCatalogueResponse,
  CbtProfileDetailResponse,
  CbtProfileSummary,
  CbtSectionSummary,
} from './types'

function sectionSummaries(profile: ExamProfile): CbtSectionSummary[] {
  return getLeafSections(profile).map((node) => ({
    id: node.section.id,
    code: node.section.code,
    name: node.section.name,
    kind: node.section.kind,
    order: node.section.order,
    questionCount: node.section.questionCount,
    marks: node.section.marks,
    parentIds: [...node.parentIds],
    parentNames: node.parentIds.map(
      (parentId) => findSection(profile, parentId)?.name ?? parentId,
    ),
    questionTypes: Array.from(
      new Set(node.section.questionRules.map((rule) => rule.responseType)),
    ),
  }))
}

export function summarizeProfile(profile: ExamProfile): CbtProfileSummary {
  return {
    id: profile.id,
    code: profile.code,
    name: profile.name,
    shortName: profile.shortName,
    family: profile.family,
    authority: profile.authority,
    subjectCode: profile.subjectCode,
    subjectName: profile.subjectName,
    examYear: profile.examYear,
    session: profile.session,
    version: profile.version,
    status: profile.status,
    durationMinutes: profile.durationMinutes,
    totalQuestions: profile.totalQuestions,
    totalMarks: profile.totalMarks,
    questionTypes: [...profile.questionTypes],
    presentationTypes: [...profile.presentationTypes],
    sections: sectionSummaries(profile),
    marking: profile.marking,
    language: profile.language,
    navigation: profile.navigation,
    result: profile.result,
    instructions: [...profile.instructions],
    publishedAt: profile.publishedAt,
    effectiveFrom: profile.effectiveFrom,
    derivedPractice: profile.metadata?.standalonePractice === true,
    officialPattern: profile.metadata?.officialPattern === true,
    ...(profile.metadata ? { metadata: profile.metadata } : {}),
  }
}

function publishedProfiles(): ExamProfile[] {
  const registry = getDefaultExamRegistry()
  return EXAM_PROFILES.map((profile) => registry.get(profile.code, profile.version))
    .filter((profile): profile is ExamProfile => profile !== null)
    .filter((profile) => profile.status === 'published')
}

export async function getCbtCatalogue(
  identity: CbtIdentity,
  now: Date = new Date(),
): Promise<CbtCatalogueResponse> {
  const pool = await loadCbtQuestionPool()
  const stats = computePoolStats(pool)
  const active = await listActiveAttempts(identity.userId, now)

  const entries: CbtCatalogueResponse['entries'] = []
  const upcoming: CbtCatalogueResponse['upcoming'] = []

  for (const profile of publishedProfiles()) {
    const summary = summarizeProfile(profile)
    const availability = availabilityForProfile(profile, stats)
    const activeAttempt = active[profile.code] ?? null
    if (availability.available) {
      entries.push({ profile: summary, availability, activeAttempt })
    } else {
      upcoming.push({ profile: summary, availability })
    }
  }

  return {
    entries,
    upcoming,
    candidate: identity.candidate,
  }
}

export async function getCbtProfileDetail(
  identity: CbtIdentity,
  profileCode: string,
  now: Date = new Date(),
): Promise<CbtProfileDetailResponse> {
  const profile = getDefaultExamRegistry().get(profileCode)
  if (!profile || profile.status !== 'published') {
    throw new CbtAttemptError(
      404,
      'PROFILE_NOT_FOUND',
      `Examination profile ${profileCode} was not found`,
    )
  }

  const pool = await loadCbtQuestionPool()
  const stats = computePoolStats(pool)
  const active = await listActiveAttempts(identity.userId, now)

  return {
    profile: summarizeProfile(profile),
    availability: availabilityForProfile(profile, stats),
    candidate: identity.candidate,
    activeAttempt: active[profile.code] ?? null,
  }
}
