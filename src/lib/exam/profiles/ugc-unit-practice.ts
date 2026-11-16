/**
 * Sectional (unit-wise) UGC-NET practice profiles.
 *
 * Each profile is a normal examination blueprint with a single paper section.
 * The CBT selector recognises `metadata.unitPractice` and draws only questions
 * whose official `syllabusUnit` matches the requested unit. This keeps unit
 * practice on the same server-timed runner, autosave and scoring path as the
 * full papers.
 */

import { deepFreeze } from '../blueprint'
import { EXAM_PROFILE_SCHEMA_VERSION, type ExamProfile, type ExamSection } from '../types'
import {
  ALL_PRESENTATION_TYPES,
  SOURCE_CHECKED_AT,
  ugcLanguage,
  ugcMarking,
  ugcNavigation,
  ugcResult,
  ugcSelection,
  ugcSingleCorrectRules,
  ugcSources,
} from './common'
import {
  UGC_FULL_PAPER_UNIT_QUESTION_COUNT,
  UGC_PAPER_ONE_UNITS,
  UGC_PAPER_TWO_UNITS,
  ugcPracticeDurationMinutes,
  type UgcPaper,
  type UgcSyllabusUnit,
} from '../ugc-units'

function unitSection(paper: UgcPaper, unit: UgcSyllabusUnit, count: number): ExamSection {
  const paperName =
    paper === 'I'
      ? 'Paper I: General Paper on Teaching & Research Aptitude'
      : 'Paper II: Computer Science & Applications'
  return {
    id: paper === 'I' ? 'paper-1' : 'paper-2',
    code: paper === 'I' ? 'P1' : 'P2',
    name: `${paperName} — Unit ${unit.order}: ${unit.name}`,
    kind: 'paper',
    order: 1,
    questionCount: count,
    marks: count * 2,
    questionRules: ugcSingleCorrectRules(count),
    language: { default: 'en', available: ['en', 'hi'] },
    instructions: [
      `${count} compulsory questions, 2 marks each, ${count * 2} marks total.`,
      'No negative marking.',
      'Reviewed Hindi translations are shown where available; English is authoritative.',
      `Official syllabus unit: ${unit.name}.`,
    ],
  }
}

function unitPracticeProfile(paper: UgcPaper, unit: UgcSyllabusUnit): ExamProfile {
  const count = UGC_FULL_PAPER_UNIT_QUESTION_COUNT[paper]
  const paperCode = paper === 'I' ? 'P1' : 'P2'
  const code = `UGC-NET-DEC-2026-${paperCode}-U${String(unit.order).padStart(2, '0')}`
  const paperLabel = paper === 'I' ? 'Paper I' : 'Paper II Computer Science'
  return deepFreeze<ExamProfile>({
    schemaVersion: EXAM_PROFILE_SCHEMA_VERSION,
    id: code.toLowerCase(),
    code,
    family: 'UGC_NET',
    authority: 'NTA',
    name: `UGC NET December 2026 — ${paperLabel} Unit ${unit.order}: ${unit.name} (sectional practice)`,
    shortName: `${paperCode} · ${unit.shortName}`,
    subjectCode: paper === 'I' ? '00' : '87',
    subjectName:
      paper === 'I'
        ? 'General Paper on Teaching & Research Aptitude'
        : 'Computer Science & Applications',
    examYear: 2026,
    session: 'December',
    version: '1.0.0',
    status: 'published',
    publishedAt: '2026-10-16',
    effectiveFrom: '2026-10-16',
    effectiveTo: null,
    supersedes: null,
    durationMinutes: ugcPracticeDurationMinutes(count),
    totalQuestions: count,
    totalMarks: count * 2,
    questionTypes: ['single'],
    presentationTypes: [...ALL_PRESENTATION_TYPES],
    sections: [unitSection(paper, unit, count)],
    marking: ugcMarking(),
    language: ugcLanguage(),
    navigation: ugcNavigation(),
    result: ugcResult(),
    selection: ugcSelection(),
    instructions: [
      `Sectional practice for Paper ${paper} Unit ${unit.order}: ${unit.name}.`,
      `${count} questions, 2 marks each, no negative marking.`,
      'The duration is a proportional share of the official 180-minute combined session; it is a practice configuration, not an official paper duration.',
      'Reviewed Hindi translations are shown where available; English is authoritative.',
    ],
    sources: ugcSources(),
    metadata: {
      officialPattern: false,
      derivedFrom: 'UGC-NET-DEC-2026',
      standalonePractice: true,
      unitPractice: true,
      practicePaper: paper,
      practiceUnit: unit.code,
      practiceUnitName: unit.name,
      practiceUnitOrder: unit.order,
      paperUnits: 10,
      unitCoverage: 'official',
      bilingual: true,
      durationBasis: 'proportional-official-session',
      sourceCheckedAt: SOURCE_CHECKED_AT,
    },
  })
}

export const UGC_UNIT_PRACTICE_PROFILES: readonly ExamProfile[] = [
  ...UGC_PAPER_ONE_UNITS.map((unit) => unitPracticeProfile('I', unit)),
  ...UGC_PAPER_TWO_UNITS.map((unit) => unitPracticeProfile('II', unit)),
] as const
