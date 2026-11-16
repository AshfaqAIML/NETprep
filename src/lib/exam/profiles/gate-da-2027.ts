import { deepFreeze } from '../blueprint'
import { EXAM_PROFILE_SCHEMA_VERSION, type ExamProfile } from '../types'
import {
  ALL_PRESENTATION_TYPES,
  SOURCE_CHECKED_AT,
  gateDataScienceSection,
  gateGeneralAptitudeSection,
  gateLanguage,
  gateMarking,
  gateNavigation,
  gateResult,
  gateSelection,
  gateSources,
} from './common'

/**
 * Official GATE 2027 Data Science and Artificial Intelligence pattern.
 *
 * Source: GATE 2027 Question Paper Pattern (IIT Madras).
 * 65 questions / 100 marks / 180 minutes.
 * General Aptitude 10 questions / 15 marks.
 * Data Science and Artificial Intelligence 55 questions / 85 marks.
 */
export const GATE_DA_2027 = deepFreeze<ExamProfile>({
  schemaVersion: EXAM_PROFILE_SCHEMA_VERSION,
  id: 'gate-da-2027',
  code: 'GATE-DA-2027',
  family: 'GATE',
  authority: 'IIT_MADRAS',
  name: 'GATE 2027 Data Science and Artificial Intelligence',
  shortName: 'GATE DA 2027',
  subjectCode: 'DA',
  subjectName: 'Data Science and Artificial Intelligence',
  examYear: 2027,
  session: null,
  version: '1.0.0',
  status: 'published',
  publishedAt: '2026-11-15',
  effectiveFrom: '2026-11-15',
  effectiveTo: null,
  supersedes: null,
  durationMinutes: 180,
  totalQuestions: 65,
  totalMarks: 100,
  questionTypes: ['single', 'multiple', 'numeric'],
  presentationTypes: [...ALL_PRESENTATION_TYPES],
  sections: [gateGeneralAptitudeSection(), gateDataScienceSection()],
  marking: gateMarking(),
  language: gateLanguage(),
  navigation: gateNavigation(),
  result: gateResult(),
  selection: gateSelection(),
  instructions: [
    'The paper contains 65 questions worth 100 marks in a single 180-minute session.',
    'General Aptitude contains 10 questions worth 15 marks (5 one-mark and 5 two-mark MCQs).',
    'Data Science and Artificial Intelligence contains 55 questions worth 85 marks.',
    'For a 1-mark MCQ, 1/3 mark is deducted for an incorrect answer.',
    'For a 2-mark MCQ, 2/3 mark is deducted for an incorrect answer.',
    'MSQs and NAT questions carry no negative marking.',
    'MSQs are awarded only when the exact correct combination is selected; there is no partial marking.',
    'NAT answers are evaluated with the configured decimal precision and per-question tolerance.',
    'A virtual calculator is available.',
  ],
  sources: gateSources(),
  metadata: {
    officialPattern: true,
    generalAptitudeQuestions: 10,
    generalAptitudeMarks: 15,
    dataScienceQuestions: 55,
    dataScienceMarks: 85,
    sourceCheckedAt: SOURCE_CHECKED_AT,
  },
})
