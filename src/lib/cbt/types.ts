/**
 * CBT delivery types.
 *
 * These types sit between the pure examination engine and the database/UI.
 * The engine owns scoring rules; these types describe a delivered attempt,
 * its frozen paper snapshot, and the sanitized payload sent to the browser.
 */

import type {
  ExamFamily,
  ExamProfileStatus,
  ExamSection,
  LanguageConfig,
  MarkingScheme,
  NavigationConfig,
  NumericToleranceMode,
  QuestionOutcome,
  QuestionPresentationType,
  ResponseType,
  ResultConfig,
  ScoreCounts,
  SectionScore,
} from '../exam/types'

export type CbtAttemptStatus = 'in_progress' | 'submitted' | 'abandoned'
export type CbtSubmittedReason = 'manual' | 'timer_expired'

export interface CbtCandidate {
  name: string
  id: string
}

export interface CbtOption {
  id: string
  label: string
  text: string
}

export type CbtNegativeMarking =
  | { mode: 'none' }
  | {
      mode: 'fraction'
      numerator: number
      denominator: number
      label: string
    }

export interface CbtNumericAnswerKey {
  value: number
  tolerance?: number
  toleranceMode?: NumericToleranceMode
  precision?: number
}

/**
 * A question as frozen into an attempt. This object is server-only until the
 * attempt is submitted; the sanitized variant removes every answer key.
 */
export interface CbtAttemptQuestion {
  id: string
  /** Global 1-based question number shown to the candidate. */
  number: number
  /** 0-based order within the delivered paper. */
  order: number
  sectionId: string
  sectionCode: string
  sectionName: string
  sectionOrder: number
  /** 1-based question number within the section. */
  sectionNumber: number
  responseType: ResponseType
  marks: number
  presentationType: QuestionPresentationType
  questionText: string
  passage?: string | null
  codeSnippet?: string | null
  tableMarkdown?: string | null
  imageUrl?: string | null
  options: CbtOption[]
  correctOptionId?: string | null
  correctOptionIds?: string[] | null
  numericAnswer?: CbtNumericAnswerKey | null
  explanation: string
  topicName?: string | null
  unitName?: string | null
  difficulty?: string | null
  negativeMarking: CbtNegativeMarking
  status: 'active' | 'dropped'
}

export interface CbtPaperSection {
  id: string
  code: string
  name: string
  kind: ExamSection['kind']
  order: number
  marks: number
  questionCount: number | null
  parentIds: string[]
  parentNames: string[]
}

export interface CbtPaperSnapshot {
  id: string
  profileCode: string
  profileVersion: string
  profileName: string
  profileFamily: ExamFamily
  subjectName: string | null
  generatedAt: string
  sections: CbtPaperSection[]
  questions: CbtAttemptQuestion[]
}

/** Client-safe question. No answer key and no explanation. */
export interface CbtSanitizedQuestion {
  id: string
  number: number
  order: number
  sectionId: string
  sectionCode: string
  sectionName: string
  sectionOrder: number
  sectionNumber: number
  responseType: ResponseType
  marks: number
  presentationType: QuestionPresentationType
  questionText: string
  passage?: string | null
  codeSnippet?: string | null
  tableMarkdown?: string | null
  imageUrl?: string | null
  options: CbtOption[]
  topicName?: string | null
  unitName?: string | null
  difficulty?: string | null
  negativeMarking: CbtNegativeMarking
  /** Decimal precision used by NAT evaluation, for the candidate hint. */
  numericPrecision: number
}

export interface CbtSanitizedPaper {
  id: string
  profileCode: string
  profileVersion: string
  profileName: string
  profileFamily: ExamFamily
  subjectName: string | null
  generatedAt: string
  sections: CbtPaperSection[]
  questions: CbtSanitizedQuestion[]
}

export interface CbtResponse {
  questionId: string
  selectedOptionId?: string | null
  selectedOptionIds?: string[] | null
  numericValue?: string | number | null
  markedForReview?: boolean
  visited?: boolean
  timeSpentSec?: number
}

export type CbtResponses = Record<string, CbtResponse>

export interface CbtAttemptCounts {
  total: number
  answered: number
  notAnswered: number
  marked: number
  answeredMarked: number
  visited: number
  notVisited: number
}

export interface CbtActiveAttempt {
  id: string
  status: CbtAttemptStatus
  startedAt: string
  expiresAt: string
  remainingSec: number
  submittedAt?: string | null
  submittedReason?: CbtSubmittedReason | null
  score?: number | null
  maxMarks?: number | null
}

export interface CbtAttemptState {
  id: string
  status: CbtAttemptStatus
  profileCode: string
  profileVersion: string
  profileName: string
  profileFamily: ExamFamily
  subjectName: string | null
  candidate: CbtCandidate
  startedAt: string
  expiresAt: string
  serverNow: string
  remainingSec: number
  durationSec: number
  submittedAt: string | null
  submittedReason: CbtSubmittedReason | null
  currentSectionId: string | null
  currentQuestionId: string | null
  totalQuestions: number
  counts: CbtAttemptCounts
  responses: CbtResponses
  lastSavedAt: string
  lastHeartbeatAt: string
  score: number | null
  maxMarks: number | null
  resultAvailable: boolean
}

export interface CbtAttemptPayload {
  attempt: CbtAttemptState
  paper: CbtSanitizedPaper
}

export interface CbtStartResponse extends CbtAttemptPayload {
  resumed: boolean
}

export interface CbtHeartbeatResponse {
  serverNow: string
  remainingSec: number
  status: CbtAttemptStatus
  submittedAt: string | null
  submittedReason: CbtSubmittedReason | null
  resultAvailable: boolean
}

export interface CbtSubmitResponse {
  attempt: CbtAttemptState
  result: CbtResult
}

export interface CbtSectionSummary {
  id: string
  code: string
  name: string
  kind: ExamSection['kind']
  order: number
  questionCount: number | null
  marks: number
  parentIds: string[]
  parentNames: string[]
  questionTypes: ResponseType[]
}

export interface CbtProfileSummary {
  id: string
  code: string
  name: string
  shortName: string
  family: ExamFamily
  authority: 'NTA' | 'IIT_MADRAS'
  subjectCode: string | null
  subjectName: string | null
  examYear: number
  session: string | null
  version: string
  status: ExamProfileStatus
  durationMinutes: number
  totalQuestions: number
  totalMarks: number
  questionTypes: ResponseType[]
  presentationTypes: QuestionPresentationType[]
  sections: CbtSectionSummary[]
  marking: MarkingScheme
  language: LanguageConfig
  navigation: NavigationConfig
  result: ResultConfig
  instructions: string[]
  publishedAt: string | null
  effectiveFrom: string | null
  derivedPractice: boolean
  officialPattern: boolean
  metadata?: Record<string, string | number | boolean | null>
}

export interface CbtContentRequirement {
  label: string
  required: number
  available: number
  unit: 'questions'
}

export interface CbtAvailability {
  available: boolean
  requirements: CbtContentRequirement[]
  note?: string
}

export interface CbtCatalogueEntry {
  profile: CbtProfileSummary
  availability: CbtAvailability
  activeAttempt: CbtActiveAttempt | null
}

export interface CbtCatalogueResponse {
  entries: CbtCatalogueEntry[]
  upcoming: Array<{ profile: CbtProfileSummary; availability: CbtAvailability }>
  candidate: CbtCandidate
}

export interface CbtProfileDetailResponse {
  profile: CbtProfileSummary
  availability: CbtAvailability
  candidate: CbtCandidate
  activeAttempt: CbtActiveAttempt | null
}

export interface CbtReviewQuestion {
  id: string
  number: number
  sectionId: string
  sectionCode: string
  sectionName: string
  responseType: ResponseType
  marks: number
  presentationType: QuestionPresentationType
  questionText: string
  passage?: string | null
  codeSnippet?: string | null
  tableMarkdown?: string | null
  imageUrl?: string | null
  options: CbtOption[]
  correctOptionId?: string | null
  correctOptionIds?: string[] | null
  numericAnswer?: CbtNumericAnswerKey | null
  numericPrecision: number
  explanation: string
  topicName?: string | null
  unitName?: string | null
  difficulty?: string | null
  response: CbtResponse | null
  outcome: QuestionOutcome
  marksAwarded: number
  penalty: number
  netMarks: number
  answered: boolean
  markedForReview: boolean
  timeSpentSec: number
}

export interface CbtResult {
  attemptId: string
  profile: {
    id: string
    code: string
    name: string
    version: string
    family: ExamFamily
  }
  candidate: CbtCandidate
  submittedAt: string
  submittedReason: CbtSubmittedReason
  durationSec: number
  timeSpentSec: number
  totals: ScoreCounts
  sections: SectionScore[]
  exact: {
    rawScore: { numerator: number; denominator: number }
    finalScore: { numerator: number; denominator: number }
  }
  review: CbtReviewQuestion[]
}

export interface CbtStartRequest {
  profileCode: string
}

export interface CbtSaveRequest {
  response?: {
    questionId: string
    selectedOptionId?: string | null
    selectedOptionIds?: string[] | null
    numericValue?: string | number | null
    markedForReview?: boolean
    visited?: boolean
    timeSpentSec?: number
  }
  position?: {
    currentSectionId: string
    currentQuestionId: string
  }
}

export interface CbtSubmitRequest {
  responses?: CbtResponses
  reason?: CbtSubmittedReason
}

/**
 * A database-independent question candidate used by the pure paper selector.
 * The server adapter maps Prisma rows into this shape.
 */
export interface CbtQuestionCandidate {
  id: string
  paper: 'I' | 'II'
  responseType: ResponseType
  presentationType: QuestionPresentationType
  difficulty: 'easy' | 'medium' | 'hard'
  topicId: string | null
  topicName: string | null
  unitName: string | null
  gateSection: string | null
  verified: boolean
  createdAt: string
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  explanation: string
  correctOptions: string[] | null
  numericAnswer: number | null
  numericTolerance: number | null
  numericToleranceMode: NumericToleranceMode | null
  numericPrecision: number | null
  passage: string | null
  codeSnippet: string | null
  tableMarkdown: string | null
  imageUrl: string | null
}

export interface CbtSelectionAssignment {
  candidate: CbtQuestionCandidate
  sectionId: string
  marks: number
}
