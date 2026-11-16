import { deepFreeze } from '../blueprint'
import { EXAM_PROFILE_SCHEMA_VERSION, type ExamProfile } from '../types'
import {
  ALL_PRESENTATION_TYPES,
  SOURCE_CHECKED_AT,
  ugcLanguage,
  ugcMarking,
  ugcNavigation,
  ugcPaperTwoSection,
  ugcResult,
  ugcSelection,
  ugcSources,
} from './common'

/**
 * Standalone Paper II Computer Science practice profile.
 *
 * The combined session is 180 minutes with no break; no separate Paper II
 * duration is published, so this derived profile uses the full session
 * duration. English and reviewed Hindi translations are both offered, with
 * English as the authoritative fallback.
 */
export const UGC_NET_DEC_2026_P2_CS = deepFreeze<ExamProfile>({
  schemaVersion: EXAM_PROFILE_SCHEMA_VERSION,
  id: 'ugc-net-dec-2026-p2-cs',
  code: 'UGC-NET-DEC-2026-P2-CS',
  family: 'UGC_NET',
  authority: 'NTA',
  name: 'UGC NET December 2026 — Paper II Computer Science (standalone practice)',
  shortName: 'UGC NET Dec 2026 Paper II CS',
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
  totalQuestions: 100,
  totalMarks: 200,
  questionTypes: ['single'],
  presentationTypes: [...ALL_PRESENTATION_TYPES],
  sections: [ugcPaperTwoSection()],
  marking: ugcMarking(),
  language: ugcLanguage(),
  navigation: ugcNavigation(),
  result: ugcResult(),
  selection: ugcSelection(),
  instructions: [
    'Paper II Computer Science & Applications contains 100 compulsory questions worth 200 marks.',
    'Each correct answer awards 2 marks; there is no negative marking.',
    'Subject code 87 (Computer Science & Applications).',
    'English and Hindi presentation are available. Reviewed Hindi translations are shown where provided; otherwise the question falls back to English.',
    'The English text is authoritative, including mathematical notation, code and technical terminology.',
    'Standalone practice profile derived from the official combined UGC-NET December 2026 examination.',
    'The 180-minute duration is the official combined-session duration. The bulletin does not publish a separate Paper II duration.',
  ],
  sources: ugcSources(),
  metadata: {
    officialPattern: false,
    derivedFrom: 'UGC-NET-DEC-2026',
    standalonePractice: true,
    durationBasis: 'official-combined-session',
    paperUnits: 10,
    unitCoverage: 'official',
    bilingual: true,
    sourceCheckedAt: SOURCE_CHECKED_AT,
  },
})
