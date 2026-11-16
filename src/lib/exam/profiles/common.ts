/**
 * Shared profile fragments.
 *
 * These are factories, not shared mutable objects, so each examination profile
 * owns its own configuration and can be frozen independently by the registry.
 */

import type {
  ExamLanguage,
  ExamSection,
  LanguageConfig,
  MarkingScheme,
  NavigationConfig,
  QuestionPresentationType,
  QuestionRule,
  ResultConfig,
  SelectionPolicy,
  SourceReference,
  SectionLanguageConfig,
} from '../types'

export const ALL_PRESENTATION_TYPES: QuestionPresentationType[] = [
  'text',
  'passage',
  'table',
  'diagram',
  'code',
  'mathematical',
  'data-interpretation',
]

export const SOURCE_CHECKED_AT = '2026-11-15'

export const GATE_PATTERN_URL = 'https://gate2027.iitm.ac.in/question_paper_pattern'
export const GATE_SYLLABUS_URL = 'https://gate2027.iitm.ac.in/exam_papers_and_syllabus'
export const UGC_BULLETIN_URL =
  'https://cdnbbsr.s3waas.gov.in/s301eee509ee2f68dc6014898c309e86bf/uploads/2026/10/20261016860019603.pdf'
export const UGC_BULLETIN_PAGE_URL = 'https://ugcnet.nta.nic.in/information-bulletin/'
export const UGC_SYLLABUS_URL = 'https://www.ugcnetonline.in/syllabus-new.php'

export function gateSources(): SourceReference[] {
  return [
    {
      title: 'GATE 2027 Question Paper Pattern',
      url: GATE_PATTERN_URL,
      authority: 'IIT_MADRAS',
      documentType: 'pattern',
      retrievedAt: SOURCE_CHECKED_AT,
    },
    {
      title: 'GATE 2027 Examination Papers and Syllabus',
      url: GATE_SYLLABUS_URL,
      authority: 'IIT_MADRAS',
      documentType: 'syllabus',
      retrievedAt: SOURCE_CHECKED_AT,
    },
  ]
}

export function ugcSources(): SourceReference[] {
  return [
    {
      title: 'UGC-NET December 2026 Information Bulletin (updated 16.10.2026)',
      url: UGC_BULLETIN_URL,
      authority: 'NTA',
      documentType: 'information-bulletin',
      retrievedAt: SOURCE_CHECKED_AT,
    },
    {
      title: 'UGC-NET Information Bulletin index',
      url: UGC_BULLETIN_PAGE_URL,
      authority: 'NTA',
      documentType: 'information-bulletin',
      retrievedAt: SOURCE_CHECKED_AT,
    },
    {
      title: 'UGC-NET Syllabus (subject codes)',
      url: UGC_SYLLABUS_URL,
      authority: 'NTA',
      documentType: 'syllabus',
      retrievedAt: SOURCE_CHECKED_AT,
    },
  ]
}

export function gateMarking(): MarkingScheme {
  return {
    correct: 'full-marks',
    incorrect: {
      single: {
        mode: 'fraction-of-question-marks',
        fraction: { numerator: 1, denominator: 3 },
      },
      multiple: {
        mode: 'none',
        partialMarking: false,
        requiresExactMatch: true,
      },
      numeric: {
        mode: 'none',
        partialMarking: false,
      },
    },
    numeric: {
      precision: 2,
      defaultTolerance: 0,
      toleranceMode: 'none',
    },
    droppedQuestion: 'award-all',
  }
}

export function ugcMarking(): MarkingScheme {
  return {
    correct: 'full-marks',
    incorrect: {
      single: { mode: 'none' },
      multiple: {
        mode: 'none',
        partialMarking: false,
        requiresExactMatch: true,
      },
      numeric: {
        mode: 'none',
        partialMarking: false,
      },
    },
    numeric: {
      precision: 2,
      defaultTolerance: 0,
      toleranceMode: 'none',
    },
    droppedQuestion: 'award-all',
  }
}

export function gateLanguage(): LanguageConfig {
  return {
    default: 'en',
    available: ['en'],
    bilingual: false,
    fallback: 'en',
    note: 'GATE papers are administered in English.',
  }
}

export function ugcLanguage(): LanguageConfig {
  return {
    default: 'en',
    available: ['en', 'hi'],
    bilingual: true,
    fallback: 'en',
    note: 'English and Hindi presentation. Reviewed Hindi translations are shown where available; otherwise the question falls back to English. The English text is authoritative.',
  }
}

export function ugcPaperOneLanguage(): SectionLanguageConfig {
  return { default: 'en', available: ['en', 'hi'] }
}

/** Both UGC papers offer reviewed Hindi translations with English fallback. */
export function ugcPaperTwoLanguage(): SectionLanguageConfig {
  return { default: 'en', available: ['en', 'hi'] }
}

export function englishOnlyLanguage(): SectionLanguageConfig {
  return { default: 'en', available: ['en'] }
}

export function englishOnlyLanguageConfig(note: string): LanguageConfig {
  return {
    default: 'en',
    available: ['en'],
    bilingual: false,
    fallback: 'en',
    note,
  }
}

export function gateNavigation(): NavigationConfig {
  return {
    allowBackwardNavigation: true,
    allowSectionSwitching: true,
    allowReviewMarking: true,
    allowAnswerChange: true,
    autoSubmitOnExpiry: true,
    sectionLocking: 'none',
    showQuestionPalette: true,
    showSectionTimer: false,
    questionOrder: 'fixed',
    optionOrder: 'fixed',
    calculator: 'virtual',
  }
}

export function ugcNavigation(): NavigationConfig {
  return {
    allowBackwardNavigation: true,
    allowSectionSwitching: true,
    allowReviewMarking: true,
    allowAnswerChange: true,
    autoSubmitOnExpiry: true,
    sectionLocking: 'none',
    showQuestionPalette: true,
    showSectionTimer: false,
    questionOrder: 'fixed',
    optionOrder: 'fixed',
    calculator: 'none',
  }
}

export function gateResult(): ResultConfig {
  return {
    roundingDecimals: 2,
    clampTotalToZero: false,
    includeSectionBreakdown: true,
    includeQuestionBreakdown: true,
    accuracyBasis: 'attempted',
    showNegativePenalty: true,
  }
}

export function ugcResult(): ResultConfig {
  return {
    roundingDecimals: 2,
    clampTotalToZero: false,
    includeSectionBreakdown: true,
    includeQuestionBreakdown: true,
    accuracyBasis: 'attempted',
    showNegativePenalty: false,
  }
}

export function gateSelection(): SelectionPolicy {
  return {
    mode: 'blueprint',
    allowQuestionReuse: false,
    requireVerifiedQuestions: true,
    allowedDifficulties: ['easy', 'medium', 'hard'],
    maxQuestionsPerTopic: null,
  }
}

export function ugcSelection(): SelectionPolicy {
  return {
    mode: 'blueprint',
    allowQuestionReuse: false,
    requireVerifiedQuestions: true,
    allowedDifficulties: ['easy', 'medium', 'hard'],
    maxQuestionsPerTopic: null,
  }
}

/** GATE sections may contain any of the three official response formats. */
export function gateQuestionRules(): QuestionRule[] {
  return [
    { responseType: 'single', marks: 1 },
    { responseType: 'single', marks: 2 },
    { responseType: 'multiple', marks: 1 },
    { responseType: 'multiple', marks: 2 },
    { responseType: 'numeric', marks: 1 },
    { responseType: 'numeric', marks: 2 },
  ]
}

export function gateGeneralAptitudeRules(): QuestionRule[] {
  return [
    { responseType: 'single', marks: 1, count: 5 },
    { responseType: 'single', marks: 2, count: 5 },
  ]
}

export function ugcSingleCorrectRules(count: number): QuestionRule[] {
  return [{ responseType: 'single', marks: 2, count }]
}

export function ugcPaperOneSection(): ExamSection {
  return {
    id: 'paper-1',
    code: 'P1',
    name: 'Paper I: General Paper on Teaching & Research Aptitude',
    kind: 'paper',
    order: 1,
    questionCount: 50,
    marks: 100,
    questionRules: ugcSingleCorrectRules(50),
    language: ugcPaperOneLanguage(),
    instructions: [
      '50 compulsory questions, 2 marks each, 100 marks total.',
      'No negative marking.',
      'Available in English and Hindi.',
    ],
  }
}

export function ugcPaperTwoSection(): ExamSection {
  return {
    id: 'paper-2',
    code: 'P2',
    name: 'Paper II: Computer Science & Applications',
    kind: 'paper',
    order: 2,
    questionCount: 100,
    marks: 200,
    questionRules: ugcSingleCorrectRules(100),
    language: ugcPaperTwoLanguage(),
    instructions: [
      '100 compulsory questions, 2 marks each, 200 marks total.',
      'No negative marking.',
      'Subject code 87 (Computer Science & Applications).',
      'Reviewed Hindi translations are shown where available; English is the authoritative text.',
    ],
  }
}

export function gateGeneralAptitudeSection(): ExamSection {
  return {
    id: 'general-aptitude',
    code: 'GA',
    name: 'General Aptitude',
    kind: 'general-aptitude',
    order: 1,
    questionCount: 10,
    marks: 15,
    questionRules: gateGeneralAptitudeRules(),
    language: englishOnlyLanguage(),
    instructions: ['10 questions, 15 marks (5 one-mark and 5 two-mark MCQs).'],
  }
}

export function gateEngineeringMathematicsSection(): ExamSection {
  return {
    id: 'engineering-mathematics',
    code: 'EM',
    name: 'Engineering Mathematics',
    kind: 'engineering-mathematics',
    order: 1,
    // The official pattern fixes 13 marks, not an individual question count.
    questionCount: null,
    marks: 13,
    questionRules: gateQuestionRules(),
    language: englishOnlyLanguage(),
    instructions: [
      'Engineering Mathematics carries 13 marks. The official pattern does not publish a separate question count for this component.',
    ],
  }
}

export function gateComputerScienceSection(): ExamSection {
  return {
    id: 'computer-science',
    code: 'CS',
    name: 'Computer Science and Information Technology',
    kind: 'subject-core',
    order: 2,
    // The official pattern fixes 72 marks; the 55-question subject total is
    // enforced on the parent subject section.
    questionCount: null,
    marks: 72,
    questionRules: gateQuestionRules(),
    language: englishOnlyLanguage(),
    instructions: [
      'The remaining Computer Science subject component carries 72 marks. The official pattern does not publish a separate question count for this component.',
    ],
  }
}

export function gateDataScienceSection(): ExamSection {
  return {
    id: 'data-science-ai',
    code: 'DS-AI',
    name: 'Data Science and Artificial Intelligence',
    kind: 'subject',
    order: 2,
    questionCount: 55,
    marks: 85,
    questionRules: gateQuestionRules(),
    language: englishOnlyLanguage(),
    instructions: ['55 questions, 85 marks.'],
  }
}

export function subjectGroupSection(
  marks: number,
  questionCount: number,
  children: ExamSection[],
  name = 'Subject Paper',
): ExamSection {
  return {
    id: 'subject',
    code: 'SUBJECT',
    name,
    kind: 'subject',
    order: 2,
    questionCount,
    marks,
    questionRules: [],
    children,
    language: englishOnlyLanguage(),
  }
}

export function languageSummary(language: LanguageConfig): string {
  const labels: Record<ExamLanguage, string> = { en: 'English', hi: 'Hindi' }
  return language.available.map((code) => labels[code]).join(' / ')
}
