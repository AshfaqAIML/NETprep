import { deepFreeze } from '../blueprint'
import { EXAM_PROFILE_SCHEMA_VERSION, type ExamProfile } from '../types'
import {
  ALL_PRESENTATION_TYPES,
  SOURCE_CHECKED_AT,
  ugcLanguage,
  ugcMarking,
  ugcNavigation,
  ugcPaperOneSection,
  ugcResult,
  ugcSelection,
  ugcSources,
} from './common'

/**
 * Standalone Paper I practice profile.
 *
 * The official bulletin publishes a single 180-minute combined session, not a
 * separate Paper I duration. The profile therefore keeps the official
 * 50-question/100-mark/2-mark/ no-negative rules and uses the full session
 * duration, clearly marked as derived practice configuration.
 */
export const UGC_NET_DEC_2026_P1 = deepFreeze<ExamProfile>({
  schemaVersion: EXAM_PROFILE_SCHEMA_VERSION,
  id: 'ugc-net-dec-2026-p1',
  code: 'UGC-NET-DEC-2026-P1',
  family: 'UGC_NET',
  authority: 'NTA',
  name: 'UGC NET December 2026 — Paper I (standalone practice)',
  shortName: 'UGC NET Dec 2026 Paper I',
  subjectCode: '00',
  subjectName: 'General Paper on Teaching & Research Aptitude',
  examYear: 2026,
  session: 'December',
  version: '1.0.0',
  status: 'published',
  publishedAt: '2026-10-16',
  effectiveFrom: '2026-10-16',
  effectiveTo: null,
  supersedes: null,
  durationMinutes: 180,
  totalQuestions: 50,
  totalMarks: 100,
  questionTypes: ['single'],
  presentationTypes: [...ALL_PRESENTATION_TYPES],
  sections: [ugcPaperOneSection()],
  marking: ugcMarking(),
  language: ugcLanguage(),
  navigation: ugcNavigation(),
  result: ugcResult(),
  selection: ugcSelection(),
  instructions: [
    'Paper I contains 50 compulsory questions worth 100 marks.',
    'Each correct answer awards 2 marks; there is no negative marking.',
    'Paper I is bilingual (English and Hindi).',
    'Standalone practice profile derived from the official combined UGC-NET December 2026 examination.',
    'The 180-minute duration is the official combined-session duration. The bulletin does not publish a separate Paper I duration.',
  ],
  sources: ugcSources(),
  metadata: {
    officialPattern: false,
    derivedFrom: 'UGC-NET-DEC-2026',
    standalonePractice: true,
    durationBasis: 'official-combined-session',
    sourceCheckedAt: SOURCE_CHECKED_AT,
  },
})
