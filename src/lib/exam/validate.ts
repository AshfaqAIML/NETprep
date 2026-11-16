/**
 * Semantic validation for examination profiles.
 *
 * Structural validation catches malformed JSON. This module answers the harder
 * questions: do the marks add up, can the section actually be built from its
 * question rules, are ids unique, is the language configuration coherent, and
 * does a published profile cite an official source?
 */

import {
  getLeafSections,
  isAchievableAmount,
  resolvedProfileQuestionCount,
  resolvedSectionQuestionCount,
} from './blueprint'
import { examProfileSchema } from './schema'
import { EXAM_PROFILE_SCHEMA_VERSION } from './types'
import type {
  ExamProfile,
  ExamProfileValidation,
  ExamSection,
  QuestionRule,
  ValidationIssue,
} from './types'

const PROFILE_CODE_RE = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/
const PROFILE_ID_RE = /^[a-z0-9][a-z0-9._-]*$/

function issue(path: string, code: string, message: string): ValidationIssue {
  return { path, code, message }
}

function isIsoDate(value: string | null | undefined): boolean {
  if (!value) return false
  return !Number.isNaN(Date.parse(value))
}

function validatePenaltyFraction(
  rule: { mode: 'none' } | { mode: 'fraction-of-question-marks'; fraction: { numerator: number; denominator: number } },
  path: string,
  errors: ValidationIssue[],
): void {
  if (rule.mode !== 'fraction-of-question-marks') return
  const { numerator, denominator } = rule.fraction
  if (denominator <= 0) {
    errors.push(issue(path, 'INVALID_PENALTY_FRACTION', 'Penalty denominator must be positive'))
    return
  }
  if (numerator > denominator) {
    errors.push(
      issue(path, 'PENALTY_EXCEEDS_QUESTION_MARKS', 'Penalty cannot exceed the question marks'),
    )
  }
}

function validateRule(
  profile: ExamProfile,
  section: ExamSection,
  rule: QuestionRule,
  path: string,
  errors: ValidationIssue[],
): void {
  if (!profile.questionTypes.includes(rule.responseType)) {
    errors.push(
      issue(
        path,
        'UNSUPPORTED_RESPONSE_TYPE',
        `Section "${section.id}" uses response type "${rule.responseType}" which the profile does not support`,
      ),
    )
  }
  if (rule.count !== undefined && rule.count <= 0) {
    errors.push(issue(path, 'INVALID_RULE_COUNT', 'Rule count must be greater than zero'))
  }
  if (rule.marks <= 0) {
    errors.push(issue(path, 'INVALID_RULE_MARKS', 'Rule marks must be greater than zero'))
  }
  for (const [index, presentation] of (rule.presentationTypes ?? []).entries()) {
    if (!profile.presentationTypes.includes(presentation)) {
      errors.push(
        issue(
          `${path}.presentationTypes[${index}]`,
          'UNSUPPORTED_PRESENTATION_TYPE',
          `Presentation type "${presentation}" is not enabled on the profile`,
        ),
      )
    }
  }
}

/**
 * Validate a leaf section: rules -> count -> marks must be internally
 * consistent, and marks must be reachable from the allowed denominations.
 */
function validateLeafSection(
  profile: ExamProfile,
  section: ExamSection,
  path: string,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): number | null {
  if (section.questionRules.length === 0) {
    errors.push(
      issue(path, 'LEAF_WITHOUT_QUESTION_RULES', 'A leaf section must define at least one question rule'),
    )
    return null
  }

  const seenRuleKeys = new Set<string>()
  for (const [index, rule] of section.questionRules.entries()) {
    validateRule(profile, section, rule, `${path}.questionRules[${index}]`, errors)
    const key = `${rule.responseType}:${rule.marks}`
    if (seenRuleKeys.has(key)) {
      warnings.push(
        issue(
          `${path}.questionRules[${index}]`,
          'DUPLICATE_RULE',
          'Duplicate response-type/marks rule; merge the counts instead',
        ),
      )
    }
    seenRuleKeys.add(key)
  }

  const unknownRules = section.questionRules.filter((rule) => rule.count === undefined)
  const fixedCount = section.questionRules.reduce((sum, rule) => sum + (rule.count ?? 0), 0)
  const fixedMarks = section.questionRules.reduce(
    (sum, rule) => sum + (rule.count ?? 0) * rule.marks,
    0,
  )

  if (fixedMarks > section.marks) {
    errors.push(
      issue(
        path,
        'SECTION_MARKS_EXCEEDED',
        `Fixed question rules already award ${fixedMarks} marks, exceeding the section's ${section.marks}`,
      ),
    )
  }

  if (unknownRules.length === 0) {
    if (fixedMarks !== section.marks) {
      errors.push(
        issue(
          path,
          'SECTION_MARKS_MISMATCH',
          `Question rules award ${fixedMarks} marks but the section declares ${section.marks}`,
        ),
      )
    }
    if (section.questionCount !== null && fixedCount !== section.questionCount) {
      errors.push(
        issue(
          path,
          'SECTION_QUESTION_COUNT_MISMATCH',
          `Question rules define ${fixedCount} questions but the section declares ${section.questionCount}`,
        ),
      )
    }
  } else {
    const remainingMarks = section.marks - fixedMarks
    if (remainingMarks > 0) {
      const denominations = unknownRules.map((rule) => rule.marks)
      if (!isAchievableAmount(remainingMarks, denominations)) {
        errors.push(
          issue(
            path,
            'SECTION_MARKS_UNACHIEVABLE',
            `Remaining ${remainingMarks} marks cannot be formed from ${denominations.join('/')}-mark questions`,
          ),
        )
      }
    } else if (remainingMarks === 0) {
      warnings.push(
        issue(
          path,
          'UNUSED_QUESTION_RULES',
          'Marks are fully covered by fixed-count rules; uncounted rules will never be selected',
        ),
      )
    }

    if (section.questionCount !== null) {
      if (fixedCount > section.questionCount) {
        errors.push(
          issue(
            path,
            'SECTION_QUESTION_COUNT_EXCEEDED',
            `Fixed rules already define ${fixedCount} questions, exceeding the section's ${section.questionCount}`,
          ),
        )
      }
      if (unknownRules.length === 0) {
        errors.push(
          issue(path, 'NO_QUESTIONS_LEFT_FOR_RULES', 'No uncounted rules remain to fill the section'),
        )
      }
    }
  }

  return resolvedSectionQuestionCount(section)
}

function validateGroupSection(
  profile: ExamProfile,
  section: ExamSection,
  path: string,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
  validateSection: (profile: ExamProfile, section: ExamSection, path: string, errors: ValidationIssue[], warnings: ValidationIssue[]) => number | null,
): number | null {
  const children = section.children ?? []
  if (children.length === 0) {
    return validateLeafSection(profile, section, path, errors, warnings)
  }
  if (section.questionRules.length > 0) {
    errors.push(
      issue(path, 'GROUP_HAS_RULES', 'A group section cannot define its own question rules'),
    )
  }

  const childMarks = children.reduce((sum, child) => sum + child.marks, 0)
  if (childMarks !== section.marks) {
    errors.push(
      issue(
        path,
        'GROUP_MARKS_MISMATCH',
        `Child sections award ${childMarks} marks but the group declares ${section.marks}`,
      ),
    )
  }

  const childCounts = children.map((child, index) =>
    validateSection(profile, child, `${path}.children[${index}]`, errors, warnings),
  )
  const fixedChildCount = children.reduce(
    (sum, child) => sum + (resolvedSectionQuestionCount(child) ?? 0),
    0,
  )
  const allResolved = childCounts.every((count): count is number => count !== null)

  if (section.questionCount !== null) {
    if (allResolved) {
      const sum = childCounts.reduce((total, count) => total + (count ?? 0), 0)
      if (sum !== section.questionCount) {
        errors.push(
          issue(
            path,
            'GROUP_QUESTION_COUNT_MISMATCH',
            `Child sections define ${sum} questions but the group declares ${section.questionCount}`,
          ),
        )
      }
    } else if (fixedChildCount > section.questionCount) {
      errors.push(
        issue(
          path,
          'GROUP_QUESTION_COUNT_EXCEEDED',
          `Fixed child sections already define ${fixedChildCount} questions, exceeding the group's ${section.questionCount}`,
        ),
      )
    }
  }

  return resolvedSectionQuestionCount(section)
}

function validateSectionTree(
  profile: ExamProfile,
  section: ExamSection,
  path: string,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
  seenIds: Map<string, string>,
  seenCodes: Map<string, string>,
): number | null {
  if (seenIds.has(section.id)) {
    errors.push(
      issue(path, 'DUPLICATE_SECTION_ID', `Section id "${section.id}" is already used at ${seenIds.get(section.id)}`),
    )
  } else {
    seenIds.set(section.id, path)
  }
  if (seenCodes.has(section.code)) {
    errors.push(
      issue(path, 'DUPLICATE_SECTION_CODE', `Section code "${section.code}" is already used at ${seenCodes.get(section.code)}`),
    )
  } else {
    seenCodes.set(section.code, path)
  }

  if (section.language) {
    if (!section.language.available.includes(section.language.default)) {
      errors.push(
        issue(`${path}.language`, 'SECTION_LANGUAGE_DEFAULT_MISSING', 'Section default language must be in its available list'),
      )
    }
    for (const language of section.language.available) {
      if (!profile.language.available.includes(language)) {
        errors.push(
          issue(
            `${path}.language`,
            'SECTION_LANGUAGE_NOT_ON_PROFILE',
            `Section language "${language}" is not enabled on the profile`,
          ),
        )
      }
    }
  }

  return validateGroupSection(
    profile,
    section,
    path,
    errors,
    warnings,
    (p, s, childPath, errs, warns) =>
      validateSectionTree(p, s, childPath, errs, warns, seenIds, seenCodes),
  )
}

export function validateExamProfile(input: unknown): ExamProfileValidation {
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []

  const parsed = examProfileSchema.safeParse(input)
  if (!parsed.success) {
    for (const error of parsed.error.issues) {
      errors.push(
        issue(
          (error.path ?? []).map(String).join('.') || '(root)',
          'SCHEMA_INVALID',
          error.message,
        ),
      )
    }
    return { ok: false, errors, warnings, summary: null }
  }

  const profile = parsed.data as unknown as ExamProfile

  if (profile.schemaVersion !== EXAM_PROFILE_SCHEMA_VERSION) {
    errors.push(
      issue(
        'schemaVersion',
        'UNSUPPORTED_SCHEMA_VERSION',
        `Expected schema version ${EXAM_PROFILE_SCHEMA_VERSION}, received ${profile.schemaVersion}`,
      ),
    )
  }
  if (!PROFILE_CODE_RE.test(profile.code)) {
    errors.push(
      issue('code', 'INVALID_PROFILE_CODE', 'Profile code must be uppercase alphanumeric words separated by hyphens'),
    )
  }
  if (!PROFILE_ID_RE.test(profile.id)) {
    errors.push(
      issue('id', 'INVALID_PROFILE_ID', 'Profile id must be lowercase alphanumeric with dots, underscores or hyphens'),
    )
  }
  if (profile.totalMarks <= 0 || profile.totalQuestions <= 0 || profile.durationMinutes <= 0) {
    errors.push(issue('totalMarks', 'INVALID_TOTALS', 'Duration, questions and marks must all be positive'))
  }

  const uniqueQuestionTypes = new Set(profile.questionTypes)
  if (uniqueQuestionTypes.size !== profile.questionTypes.length) {
    errors.push(issue('questionTypes', 'DUPLICATE_QUESTION_TYPE', 'Question types must be unique'))
  }
  const uniquePresentationTypes = new Set(profile.presentationTypes)
  if (uniquePresentationTypes.size !== profile.presentationTypes.length) {
    errors.push(issue('presentationTypes', 'DUPLICATE_PRESENTATION_TYPE', 'Presentation types must be unique'))
  }

  validatePenaltyFraction(profile.marking.incorrect.single, 'marking.incorrect.single', errors)

  if (!profile.language.available.includes(profile.language.default)) {
    errors.push(
      issue('language', 'LANGUAGE_DEFAULT_MISSING', 'Default language must be present in the available languages'),
    )
  }
  if (!profile.language.available.includes(profile.language.fallback)) {
    errors.push(
      issue('language', 'LANGUAGE_FALLBACK_MISSING', 'Fallback language must be present in the available languages'),
    )
  }
  if (profile.language.bilingual && profile.language.available.length < 2) {
    errors.push(
      issue('language', 'BILINGUAL_REQUIRES_TWO_LANGUAGES', 'Bilingual profiles must offer at least two languages'),
    )
  }

  if (profile.status === 'published') {
    if (profile.sources.length === 0) {
      errors.push(issue('sources', 'PUBLISHED_PROFILE_WITHOUT_SOURCES', 'Published profiles must cite at least one official source'))
    }
    if (!profile.publishedAt) {
      errors.push(issue('publishedAt', 'PUBLISHED_PROFILE_WITHOUT_DATE', 'Published profiles must set publishedAt'))
    }
    if (!profile.effectiveFrom) {
      errors.push(issue('effectiveFrom', 'PUBLISHED_PROFILE_WITHOUT_EFFECTIVE_DATE', 'Published profiles must set effectiveFrom'))
    }
  }

  for (const [index, source] of profile.sources.entries()) {
    if (!isIsoDate(source.retrievedAt)) {
      errors.push(issue(`sources[${index}].retrievedAt`, 'INVALID_SOURCE_DATE', 'retrievedAt must be a valid date'))
    }
    if (!source.url.startsWith('https://')) {
      warnings.push(issue(`sources[${index}].url`, 'NON_HTTPS_SOURCE', 'Official sources should use HTTPS'))
    }
  }
  for (const field of ['publishedAt', 'effectiveFrom', 'effectiveTo'] as const) {
    const value = profile[field]
    if (value && !isIsoDate(value)) {
      errors.push(issue(field, 'INVALID_PROFILE_DATE', `${field} must be a valid date`))
    }
  }

  const seenIds = new Map<string, string>()
  const seenCodes = new Map<string, string>()
  let resolvedMarks = 0
  const topLevelOrders = new Set<number>()

  for (const [index, section] of profile.sections.entries()) {
    const path = `sections[${index}]`
    if (topLevelOrders.has(section.order)) {
      errors.push(issue(path, 'DUPLICATE_SECTION_ORDER', `Section order ${section.order} is duplicated`))
    }
    topLevelOrders.add(section.order)
    resolvedMarks += section.marks
    validateSectionTree(profile, section, path, errors, warnings, seenIds, seenCodes)
  }

  if (resolvedMarks !== profile.totalMarks) {
    errors.push(
      issue(
        'totalMarks',
        'TOTAL_MARKS_MISMATCH',
        `Top-level sections award ${resolvedMarks} marks but the profile declares ${profile.totalMarks}`,
      ),
    )
  }

  const resolvedQuestions = resolvedProfileQuestionCount(profile)
  if (resolvedQuestions === null) {
    errors.push(
      issue(
        'totalQuestions',
        'TOTAL_QUESTIONS_UNRESOLVED',
        'Every top-level section must expose a fixed question count',
      ),
    )
  } else if (resolvedQuestions !== profile.totalQuestions) {
    errors.push(
      issue(
        'totalQuestions',
        'TOTAL_QUESTIONS_MISMATCH',
        `Resolved sections contain ${resolvedQuestions} questions but the profile declares ${profile.totalQuestions}`,
      ),
    )
  }

  // Every response type used in the tree must be declared on the profile.
  // (validateRule reports the precise section path for violations.)

  if (profile.navigation.sectionLocking === 'sequential') {
    const leavesWithTimers = getLeafSections(profile).filter(
      (node) => node.section.timing?.durationMinutes != null,
    )
    if (leavesWithTimers.length === 0) {
      warnings.push(
        issue(
          'navigation.sectionLocking',
          'SEQUENTIAL_LOCKING_WITHOUT_SECTION_TIMERS',
          'Sequential locking is enabled but no section defines a timer',
        ),
      )
    }
  }

  if (profile.status === 'published' && profile.effectiveTo && isIsoDate(profile.effectiveFrom)) {
    if (Date.parse(profile.effectiveTo) <= Date.parse(profile.effectiveFrom as string)) {
      errors.push(
        issue('effectiveTo', 'INVALID_EFFECTIVE_RANGE', 'effectiveTo must be after effectiveFrom'),
      )
    }
  }

  const leafCount = getLeafSections(profile).length

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: {
      code: profile.code,
      version: profile.version,
      totalQuestions: profile.totalQuestions,
      totalMarks: profile.totalMarks,
      sectionCount: profile.sections.length,
      leafSectionCount: leafCount,
      resolvedQuestionCount: resolvedQuestions,
      resolvedMarks,
    },
  }
}

export class ExamConfigurationError extends Error {
  readonly issues: ValidationIssue[]

  constructor(message: string, issues: ValidationIssue[]) {
    super(`${message}: ${issues.map((i) => `${i.path} (${i.code}) ${i.message}`).join('; ')}`)
    this.name = 'ExamConfigurationError'
    this.issues = issues
  }
}

export function assertValidExamProfile(input: unknown): ExamProfile {
  const validation = validateExamProfile(input)
  if (!validation.ok) {
    throw new ExamConfigurationError('Invalid examination profile', validation.errors)
  }
  return input as ExamProfile
}
