import { deepFreeze } from '../blueprint'
import { EXAM_PROFILE_SCHEMA_VERSION, type ExamProfile } from '../types'
import {
  ALL_PRESENTATION_TYPES,
  SOURCE_CHECKED_AT,
  gateComputerScienceSection,
  gateEngineeringMathematicsSection,
  gateGeneralAptitudeSection,
  gateLanguage,
  gateMarking,
  gateNavigation,
  gateResult,
  gateSelection,
  gateSources,
  subjectGroupSection,
} from './common'

/**
 * Official GATE 2027 Computer Science and Information Technology pattern.
 *
 * Source: GATE 2027 Question Paper Pattern (IIT Madras).
 * 65 questions / 100 marks / 180 minutes.
 * General Aptitude 10 questions / 15 marks.
 * Engineering Mathematics 13 marks + remaining CS subject component 72 marks
 * = 85 subject marks.
 *
 * The official pattern fixes marks, not individual question counts, for the
 * Engineering Mathematics and CS components. The 55-question subject total is
 * enforced on the parent subject section.
 */
export const GATE_CS_2027 = deepFreeze<ExamProfile>({
  schemaVersion: EXAM_PROFILE_SCHEMA_VERSION,
  id: 'gate-cs-2027',
  code: 'GATE-CS-2027',
  family: 'GATE',
  authority: 'IIT_MADRAS',
  name: 'GATE 2027 Computer Science and Information Technology',
  shortName: 'GATE CS 2027',
  subjectCode: 'CS',
  subjectName: 'Computer Science and Information Technology',
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
  sections: [
    gateGeneralAptitudeSection(),
    subjectGroupSection(
      85,
      55,
      [gateEngineeringMathematicsSection(), gateComputerScienceSection()],
      'Engineering Mathematics + Computer Science',
    ),
  ],
  marking: gateMarking(),
  language: gateLanguage(),
  navigation: gateNavigation(),
  result: gateResult(),
  selection: gateSelection(),
  instructions: [
    'The paper contains 65 questions worth 100 marks in a single 180-minute session.',
    'General Aptitude contains 10 questions worth 15 marks (5 one-mark and 5 two-mark MCQs).',
    'Engineering Mathematics carries 13 marks and the remaining Computer Science subject component carries 72 marks, for 85 subject marks in total.',
    'For a 1-mark MCQ, 1/3 mark is deducted for an incorrect answer.',
    'For a 2-mark MCQ, 2/3 mark is deducted for an incorrect answer.',
    'MSQs and NAT questions carry no negative marking.',
    'MSQs are awarded only when the exact correct combination is selected; there is no partial marking.',
    'NAT answers are evaluated with the configured decimal precision and per-question tolerance.',
    'A virtual calculator is available.',
    'The official pattern fixes marks for Engineering Mathematics and the CS subject component, not their individual question counts; the engine enforces marks and the 55-question subject total.',
  ],
  sources: gateSources(),
  metadata: {
    officialPattern: true,
    generalAptitudeQuestions: 10,
    generalAptitudeMarks: 15,
    engineeringMathematicsMarks: 13,
    computerScienceMarks: 72,
    subjectMarks: 85,
    subjectQuestions: 55,
    sourceCheckedAt: SOURCE_CHECKED_AT,
  },
})
