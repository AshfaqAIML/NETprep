/**
 * Centralized examination blueprint types.
 *
 * These types describe *configuration*, not individual questions. Every exam
 * authority/pattern is expressed as data so the engine never needs to branch on
 * "UGC NET vs GATE".
 */

export const EXAM_PROFILE_SCHEMA_VERSION = 1

export type ExamFamily = 'UGC_NET' | 'GATE'
export type ExamAuthority = 'NTA' | 'IIT_MADRAS'
export type ExamProfileStatus = 'draft' | 'published' | 'retired'
export type ExamLanguage = 'en' | 'hi'

/** Response format: the only thing that affects scoring. */
export type ResponseType = 'single' | 'multiple' | 'numeric'

/** How a question is presented. Presentation never changes scoring. */
export type QuestionPresentationType =
  | 'text'
  | 'passage'
  | 'table'
  | 'diagram'
  | 'code'
  | 'mathematical'
  | 'data-interpretation'

export type SectionKind =
  | 'paper'
  | 'general-aptitude'
  | 'subject'
  | 'engineering-mathematics'
  | 'subject-core'
  | 'custom'

export type Difficulty = 'easy' | 'medium' | 'hard'

/** Exact rational number used for negative-marking fractions (1/3, 2/3, ...). */
export interface Rational {
  numerator: number
  denominator: number
}

export interface QuestionRule {
  responseType: ResponseType
  marks: number
  /**
   * Fixed number of questions for this rule. Omit when the official pattern
   * fixes only the marks for this rule (e.g. GATE Engineering Mathematics).
   */
  count?: number
  /** Presentation formats permitted for this rule. Omit = all profile formats. */
  presentationTypes?: QuestionPresentationType[]
}

export interface SectionSelection {
  difficulty?: Partial<Record<Difficulty, number>>
  tags?: string[]
  topicIds?: string[]
  maxQuestionsPerTopic?: number | null
}

export interface SectionTiming {
  durationMinutes: number | null
  /** Lock the section after its timer expires. */
  lockAfterExpiry: boolean
}

export interface SectionLanguageConfig {
  default: ExamLanguage
  available: ExamLanguage[]
}

export interface ExamSection {
  id: string
  code: string
  name: string
  kind: SectionKind
  order: number
  /**
   * Number of questions in this section/group. `null` only on leaf sections
   * whose official pattern fixes marks but not the question count.
   */
  questionCount: number | null
  marks: number
  questionRules: QuestionRule[]
  /** Nested groups; parent marks must equal the sum of child marks. */
  children?: ExamSection[]
  selection?: SectionSelection
  timing?: SectionTiming
  /** Per-section language override (e.g. UGC Paper I bilingual, Paper II English). */
  language?: SectionLanguageConfig
  instructions?: string[]
}

export type NegativeMarkingRule =
  | { mode: 'none' }
  | { mode: 'fraction-of-question-marks'; fraction: Rational }

export interface NumericMarkingConfig {
  /** Decimal places used when comparing numeric answers. 0-6. */
  precision: number
  /** Default tolerance applied when a question does not specify one. */
  defaultTolerance: number
  toleranceMode: 'absolute' | 'relative' | 'none'
}

export interface MarkingScheme {
  correct: 'full-marks'
  incorrect: {
    single: NegativeMarkingRule
    multiple: {
      mode: 'none'
      partialMarking: false
      requiresExactMatch: true
    }
    numeric: {
      mode: 'none'
      partialMarking: false
    }
  }
  numeric: NumericMarkingConfig
  /** Policy for questions officially dropped / found ambiguous after the exam. */
  droppedQuestion: 'award-all' | 'award-attempted' | 'none'
}

export interface LanguageConfig {
  default: ExamLanguage
  available: ExamLanguage[]
  bilingual: boolean
  fallback: ExamLanguage
  note?: string
}

export interface NavigationConfig {
  allowBackwardNavigation: boolean
  allowSectionSwitching: boolean
  allowReviewMarking: boolean
  allowAnswerChange: boolean
  autoSubmitOnExpiry: boolean
  /** `none` = all sections open; `sequential` = unlock one section at a time. */
  sectionLocking: 'none' | 'sequential'
  showQuestionPalette: boolean
  showSectionTimer: boolean
  questionOrder: 'fixed' | 'randomized'
  optionOrder: 'fixed' | 'randomized'
  calculator: 'none' | 'virtual'
}

export interface ResultConfig {
  roundingDecimals: number
  clampTotalToZero: boolean
  includeSectionBreakdown: boolean
  includeQuestionBreakdown: boolean
  accuracyBasis: 'attempted' | 'total'
  showNegativePenalty: boolean
}

export interface SelectionPolicy {
  mode: 'blueprint'
  allowQuestionReuse: boolean
  requireVerifiedQuestions: boolean
  allowedDifficulties: Difficulty[]
  maxQuestionsPerTopic: number | null
}

export interface SourceReference {
  title: string
  url: string
  authority: ExamAuthority
  documentType: 'information-bulletin' | 'pattern' | 'syllabus' | 'faq' | 'other'
  /** ISO date when the source was checked. */
  retrievedAt: string
}

export interface ExamProfile {
  schemaVersion: number
  /** Stable internal id, e.g. `gate-cs-2027`. */
  id: string
  /** Canonical public code, e.g. `GATE-CS-2027`. */
  code: string
  family: ExamFamily
  authority: ExamAuthority
  name: string
  shortName: string
  subjectCode: string | null
  subjectName: string | null
  examYear: number
  session: string | null
  version: string
  status: ExamProfileStatus
  publishedAt: string | null
  effectiveFrom: string | null
  effectiveTo: string | null
  /** Older profile code/version this configuration supersedes. */
  supersedes: string | null
  durationMinutes: number
  totalQuestions: number
  totalMarks: number
  questionTypes: ResponseType[]
  presentationTypes: QuestionPresentationType[]
  sections: ExamSection[]
  marking: MarkingScheme
  language: LanguageConfig
  navigation: NavigationConfig
  result: ResultConfig
  selection: SelectionPolicy
  instructions: string[]
  sources: SourceReference[]
  metadata?: Record<string, string | number | boolean | null>
}

// ---------------------------------------------------------------------------
// Delivered paper + candidate responses
// ---------------------------------------------------------------------------

export type QuestionStatus = 'active' | 'dropped'
export type NumericToleranceMode = 'absolute' | 'relative' | 'none'

export interface NumericAnswerKey {
  value: number
  /** Overrides the profile default tolerance for this question. */
  tolerance?: number
  toleranceMode?: NumericToleranceMode
  precision?: number
}

export interface ExamQuestion {
  id: string
  /** Must reference a leaf section id. */
  sectionId: string
  responseType: ResponseType
  marks: number
  presentationType?: QuestionPresentationType | null
  /** Required for `single` questions unless the question is dropped. */
  correctOptionId?: string | null
  /** Required for `multiple` questions unless the question is dropped. */
  correctOptionIds?: string[] | null
  /** Required for `numeric` questions unless the question is dropped. */
  numericAnswer?: NumericAnswerKey | null
  status?: QuestionStatus
}

export interface ExamPaper {
  id?: string | null
  profileCode: string
  profileVersion: string
  questions: ExamQuestion[]
}

export interface CandidateResponse {
  questionId: string
  selectedOptionId?: string | null
  selectedOptionIds?: string[] | null
  numericValue?: number | string | null
  markedForReview?: boolean
  visited?: boolean
  timeSpentSec?: number
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export type QuestionOutcome =
  | 'correct'
  | 'incorrect'
  | 'partial'
  | 'unanswered'
  | 'dropped-bonus'
  | 'dropped'

export interface QuestionScore {
  questionId: string
  sectionId: string
  responseType: ResponseType
  marksAvailable: number
  /** Positive marks earned (never negative). */
  marksAwarded: number
  /** Positive magnitude of the deduction (0 when none). */
  penalty: number
  /** marksAwarded - penalty */
  netMarks: number
  marksAwardedExact: Rational
  penaltyExact: Rational
  netMarksExact: Rational
  outcome: QuestionOutcome
  answered: boolean
  markedForReview: boolean
  timeSpentSec: number
}

export interface ScoreCounts {
  questionCount: number
  answered: number
  correct: number
  incorrect: number
  partial: number
  unanswered: number
  dropped: number
  marksAwarded: number
  penalty: number
  rawScore: number
  finalScore: number
  maxMarks: number
  percentage: number
  accuracy: number
}

export interface SectionScore extends ScoreCounts {
  sectionId: string
  sectionCode: string
  sectionName: string
  parentSectionIds: string[]
}

export interface ExamScoreResult {
  profile: {
    id: string
    code: string
    version: string
    name: string
  }
  paperId: string | null
  totals: ScoreCounts
  sections: SectionScore[]
  questions: QuestionScore[]
  exact: {
    rawScore: Rational
    finalScore: Rational
  }
  calculatedAt: string
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ValidationIssue {
  path: string
  code: string
  message: string
}

export interface ExamProfileValidation {
  ok: boolean
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  summary: {
    code: string
    version: string
    totalQuestions: number
    totalMarks: number
    sectionCount: number
    leafSectionCount: number
    resolvedQuestionCount: number | null
    resolvedMarks: number
  } | null
}

export interface PaperValidation {
  ok: boolean
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
}
