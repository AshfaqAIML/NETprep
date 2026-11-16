import { deepFreeze } from '../blueprint'
import { EXAM_PROFILE_SCHEMA_VERSION, type ExamProfile } from '../types'
import {
  ALL_PRESENTATION_TYPES,
  SOURCE_CHECKED_AT,
  ugcLanguage,
  ugcMarking,
  ugcNavigation,
  ugcPaperOneSection,
  ugcPaperTwoSection,
  ugcResult,
  ugcSelection,
  ugcSources,
} from './common'

/**
 * Official UGC-NET December 2026 combined pattern for Computer Science.
 *
 * Source: UGC-NET December 2026 Information Bulletin (updated 16.10.2026).
 * 150 questions / 300 marks / 180 minutes, no break, all compulsory,
 * 2 marks per correct answer, no negative marking.
 */
export const UGC_NET_DEC_2026 = deepFreeze<ExamProfile>({
  schemaVersion: EXAM_PROFILE_SCHEMA_VERSION,
  id: 'ugc-net-dec-2026',
  code: 'UGC-NET-DEC-2026',
  family: 'UGC_NET',
  authority: 'NTA',
  name: 'UGC NET December 2026 — Paper I + Paper II Computer Science',
  shortName: 'UGC NET Dec 2026',
  subjectCode: '87',
  subjectName: 'Computer Science & Applications',
  examYear: 2026,
  session: 'December',
  version: '1.0.0',
  status: 'published',
  publishedAt: '2026-10-16',
  effectiveFrom: '2026-10-16',
  effectiveTo: null,
  supersedes: null,
  durationMinutes: 180,
  totalQuestions: 150,
  totalMarks: 300,
  questionTypes: ['single'],
  presentationTypes: [...ALL_PRESENTATION_TYPES],
  sections: [ugcPaperOneSection(), ugcPaperTwoSection()],
  marking: ugcMarking(),
  language: ugcLanguage(),
  navigation: ugcNavigation(),
  result: ugcResult(),
  selection: ugcSelection(),
  instructions: [
    'The examination is a single 180-minute session with no break between Paper I and Paper II.',
    'Paper I contains 50 compulsory questions worth 100 marks.',
    'Paper II Computer Science & Applications contains 100 compulsory questions worth 200 marks.',
    'Each correct answer awards 2 marks; there is no negative marking.',
    'All questions are compulsory.',
    'English and Hindi presentation are available. Reviewed Hindi translations are shown where provided; otherwise the question falls back to English.',
    'The English text is authoritative for all questions, including mathematical notation, code and technical terminology.',
    'The combined paper is worth 300 marks.',
  ],
  sources: ugcSources(),
  metadata: {
    officialPattern: true,
    paper1Questions: 50,
    paper1Marks: 100,
    paper2Questions: 100,
    paper2Marks: 200,
    marksPerCorrectAnswer: 2,
    negativeMarking: false,
    breakBetweenPapers: false,
    paperOneUnits: 10,
    paperTwoUnits: 10,
    bilingual: true,
    unitCoverage: 'official',
    sourceCheckedAt: SOURCE_CHECKED_AT,
  },
})
