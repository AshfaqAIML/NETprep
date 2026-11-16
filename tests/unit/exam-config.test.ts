/**
 * Configuration, semantic validation, paper validation and registry tests for
 * the centralized examination engine.
 *
 * Run: bun test tests/unit/exam-config.test.ts
 */

import { describe, expect, test } from 'bun:test'
import {
  EXAM_PROFILES,
  ExamConfigurationError,
  ExamPaperValidationError,
  ExamProfileRegistrationError,
  GATE_CS_2027,
  GATE_DA_2027,
  UGC_NET_DEC_2026,
  UGC_NET_DEC_2026_P1,
  UGC_NET_DEC_2026_P2_CS,
  UGC_UNIT_PRACTICE_PROFILES,
  assertValidExamPaper,
  assertValidExamProfile,
  cloneExamProfile,
  createDefaultExamRegistry,
  createExamRegistry,
  findSection,
  validateExamPaper,
  validateExamProfile,
} from '../../src/lib/exam/index.ts'
import {
  buildGateCsPaper,
  buildGateDaPaper,
  buildUgcPaper,
} from './exam-fixtures.ts'

function errorCodes(result: { errors: Array<{ code: string }> }): string[] {
  return result.errors.map((error) => error.code)
}

describe('shipped examination profiles', () => {
  test('all shipped profiles pass structural and semantic validation', () => {
    for (const profile of EXAM_PROFILES) {
      const result = validateExamProfile(profile)
      if (!result.ok) {
        throw new Error(
          `${profile.code} failed validation: ${JSON.stringify(result.errors)}`,
        )
      }
      expect(result.errors).toEqual([])
      expect(result.warnings).toEqual([])
    }
  })

  test('UGC NET combined matches the official 150/300/180 pattern', () => {
    expect(UGC_NET_DEC_2026.code).toBe('UGC-NET-DEC-2026')
    expect(UGC_NET_DEC_2026.totalQuestions).toBe(150)
    expect(UGC_NET_DEC_2026.totalMarks).toBe(300)
    expect(UGC_NET_DEC_2026.durationMinutes).toBe(180)
    expect(UGC_NET_DEC_2026.subjectCode).toBe('87')

    const paper1 = findSection(UGC_NET_DEC_2026, 'paper-1')
    const paper2 = findSection(UGC_NET_DEC_2026, 'paper-2')
    expect(paper1).not.toBeNull()
    expect(paper2).not.toBeNull()
    expect(paper1?.questionCount).toBe(50)
    expect(paper1?.marks).toBe(100)
    expect(paper2?.questionCount).toBe(100)
    expect(paper2?.marks).toBe(200)
    expect(paper1?.questionRules).toEqual([
      { responseType: 'single', marks: 2, count: 50 },
    ])
    expect(paper2?.questionRules).toEqual([
      { responseType: 'single', marks: 2, count: 100 },
    ])
    expect(UGC_NET_DEC_2026.marking.incorrect.single).toEqual({ mode: 'none' })
    expect(UGC_NET_DEC_2026.marking.numeric.defaultTolerance).toBe(0)
    expect(UGC_NET_DEC_2026.instructions.join(' ')).toContain('no break')
    expect(UGC_NET_DEC_2026.instructions.join(' ')).toContain('All questions are compulsory')
  })

  test('UGC NET language configuration is bilingual for both papers', () => {
    expect(UGC_NET_DEC_2026.language.bilingual).toBe(true)
    expect(UGC_NET_DEC_2026.language.available).toEqual(['en', 'hi'])
    expect(findSection(UGC_NET_DEC_2026, 'paper-1')?.language).toEqual({
      default: 'en',
      available: ['en', 'hi'],
    })
    expect(findSection(UGC_NET_DEC_2026, 'paper-2')?.language).toEqual({
      default: 'en',
      available: ['en', 'hi'],
    })
  })

  test('standalone UGC Paper I and Paper II profiles carry the official paper totals', () => {
    expect(UGC_NET_DEC_2026_P1.totalQuestions).toBe(50)
    expect(UGC_NET_DEC_2026_P1.totalMarks).toBe(100)
    expect(UGC_NET_DEC_2026_P1.marking.incorrect.single).toEqual({ mode: 'none' })
    expect(UGC_NET_DEC_2026_P1.language.bilingual).toBe(true)

    expect(UGC_NET_DEC_2026_P2_CS.totalQuestions).toBe(100)
    expect(UGC_NET_DEC_2026_P2_CS.totalMarks).toBe(200)
    expect(UGC_NET_DEC_2026_P2_CS.marking.incorrect.single).toEqual({ mode: 'none' })
    expect(UGC_NET_DEC_2026_P2_CS.language.available).toEqual(['en', 'hi'])
    expect(UGC_NET_DEC_2026_P2_CS.language.bilingual).toBe(true)
  })

  test('twenty official-unit practice profiles cover both papers', () => {
    expect(UGC_UNIT_PRACTICE_PROFILES).toHaveLength(20)
    const paperOne = UGC_UNIT_PRACTICE_PROFILES.filter(
      (profile) => profile.metadata?.practicePaper === 'I',
    )
    const paperTwo = UGC_UNIT_PRACTICE_PROFILES.filter(
      (profile) => profile.metadata?.practicePaper === 'II',
    )
    expect(paperOne).toHaveLength(10)
    expect(paperTwo).toHaveLength(10)

    for (const profile of paperOne) {
      expect(profile.metadata?.unitPractice).toBe(true)
      expect(profile.totalQuestions).toBe(5)
      expect(profile.totalMarks).toBe(10)
      expect(profile.durationMinutes).toBe(6)
      expect(profile.language.available).toEqual(['en', 'hi'])
    }
    for (const profile of paperTwo) {
      expect(profile.metadata?.unitPractice).toBe(true)
      expect(profile.totalQuestions).toBe(10)
      expect(profile.totalMarks).toBe(20)
      expect(profile.durationMinutes).toBe(12)
      expect(profile.language.available).toEqual(['en', 'hi'])
    }

    const units = new Set(
      UGC_UNIT_PRACTICE_PROFILES.map((profile) => profile.metadata?.practiceUnit),
    )
    expect(units.size).toBe(20)
  })

  test('GATE CS matches the official 65/100/180 pattern and 85-mark subject split', () => {
    expect(GATE_CS_2027.code).toBe('GATE-CS-2027')
    expect(GATE_CS_2027.totalQuestions).toBe(65)
    expect(GATE_CS_2027.totalMarks).toBe(100)
    expect(GATE_CS_2027.durationMinutes).toBe(180)

    const ga = findSection(GATE_CS_2027, 'general-aptitude')
    const subject = findSection(GATE_CS_2027, 'subject')
    const em = findSection(GATE_CS_2027, 'engineering-mathematics')
    const cs = findSection(GATE_CS_2027, 'computer-science')

    expect(ga?.questionCount).toBe(10)
    expect(ga?.marks).toBe(15)
    expect(subject?.questionCount).toBe(55)
    expect(subject?.marks).toBe(85)
    expect(em?.questionCount).toBeNull()
    expect(em?.marks).toBe(13)
    expect(cs?.questionCount).toBeNull()
    expect(cs?.marks).toBe(72)
    expect((em?.marks ?? 0) + (cs?.marks ?? 0)).toBe(subject?.marks)
    expect(ga?.marks).toBe(15)
  })

  test('GATE marking is 1/3 for 1-mark MCQ and 2/3 for 2-mark MCQ through one fraction rule', () => {
    expect(GATE_CS_2027.marking.incorrect.single).toEqual({
      mode: 'fraction-of-question-marks',
      fraction: { numerator: 1, denominator: 3 },
    })
    expect(GATE_CS_2027.marking.incorrect.multiple).toEqual({
      mode: 'none',
      partialMarking: false,
      requiresExactMatch: true,
    })
    expect(GATE_CS_2027.marking.incorrect.numeric.mode).toBe('none')
    expect(GATE_CS_2027.marking.numeric.precision).toBe(2)
    expect(GATE_CS_2027.marking.droppedQuestion).toBe('award-all')
    expect(GATE_CS_2027.questionTypes).toEqual(['single', 'multiple', 'numeric'])
  })

  test('GATE DA matches the official 65/100/180 pattern with 55 DS&AI questions', () => {
    expect(GATE_DA_2027.totalQuestions).toBe(65)
    expect(GATE_DA_2027.totalMarks).toBe(100)
    expect(GATE_DA_2027.durationMinutes).toBe(180)
    const ga = findSection(GATE_DA_2027, 'general-aptitude')
    const ds = findSection(GATE_DA_2027, 'data-science-ai')
    expect(ga?.questionCount).toBe(10)
    expect(ga?.marks).toBe(15)
    expect(ds?.questionCount).toBe(55)
    expect(ds?.marks).toBe(85)
    expect(GATE_DA_2027.marking.incorrect.single).toEqual({
      mode: 'fraction-of-question-marks',
      fraction: { numerator: 1, denominator: 3 },
    })
  })
})

describe('semantic profile validation', () => {
  test('rejects a total-marks mismatch', () => {
    const profile = cloneExamProfile(UGC_NET_DEC_2026)
    profile.totalMarks = 301
    const result = validateExamProfile(profile)
    expect(result.ok).toBe(false)
    expect(errorCodes(result)).toContain('TOTAL_MARKS_MISMATCH')
  })

  test('rejects duplicate section ids', () => {
    const profile = cloneExamProfile(UGC_NET_DEC_2026)
    profile.sections[1].id = 'paper-1'
    const result = validateExamProfile(profile)
    expect(result.ok).toBe(false)
    expect(errorCodes(result)).toContain('DUPLICATE_SECTION_ID')
  })

  test('rejects a published profile without official sources', () => {
    const profile = cloneExamProfile(GATE_CS_2027)
    profile.sources = []
    const result = validateExamProfile(profile)
    expect(result.ok).toBe(false)
    expect(errorCodes(result)).toContain('PUBLISHED_PROFILE_WITHOUT_SOURCES')
  })

  test('rejects a section language not enabled on the profile', () => {
    const profile = cloneExamProfile(GATE_CS_2027)
    profile.sections[0].language = { default: 'hi', available: ['hi'] }
    const result = validateExamProfile(profile)
    expect(result.ok).toBe(false)
    expect(errorCodes(result)).toContain('SECTION_LANGUAGE_NOT_ON_PROFILE')
  })

  test('rejects marks that cannot be formed from the allowed question values', () => {
    const profile = cloneExamProfile(GATE_CS_2027)
    const em = findSection(profile, 'engineering-mathematics')
    expect(em).not.toBeNull()
    if (!em) throw new Error('EM section missing')
    em.questionRules = [{ responseType: 'single', marks: 2 }]
    const result = validateExamProfile(profile)
    expect(result.ok).toBe(false)
    expect(errorCodes(result)).toContain('SECTION_MARKS_UNACHIEVABLE')
  })

  test('rejects a group whose child marks do not add up', () => {
    const profile = cloneExamProfile(GATE_CS_2027)
    const subject = findSection(profile, 'subject')
    expect(subject).not.toBeNull()
    if (!subject) throw new Error('Subject section missing')
    subject.marks = 84
    const result = validateExamProfile(profile)
    expect(result.ok).toBe(false)
    expect(errorCodes(result)).toContain('GROUP_MARKS_MISMATCH')
  })

  test('assertValidExamProfile throws a typed configuration error', () => {
    const profile = cloneExamProfile(GATE_CS_2027)
    profile.totalQuestions = 64
    expect(() => assertValidExamProfile(profile)).toThrow(ExamConfigurationError)
  })
})

describe('paper validation', () => {
  test('accepts valid full papers for every shipped profile', () => {
    expect(validateExamPaper(UGC_NET_DEC_2026, buildUgcPaper()).ok).toBe(true)
    expect(validateExamPaper(GATE_CS_2027, buildGateCsPaper()).ok).toBe(true)
    expect(validateExamPaper(GATE_DA_2027, buildGateDaPaper()).ok).toBe(true)
  })

  test('rejects a paper with a missing answer key', () => {
    const paper = buildUgcPaper()
    paper.questions[0].correctOptionId = null
    const result = validateExamPaper(UGC_NET_DEC_2026, paper)
    expect(result.ok).toBe(false)
    expect(errorCodes(result)).toContain('MISSING_ANSWER_KEY')
  })

  test('rejects a paper with a wrong question mark value', () => {
    const paper = buildUgcPaper()
    paper.questions[0].marks = 1
    const result = validateExamPaper(UGC_NET_DEC_2026, paper)
    expect(result.ok).toBe(false)
    expect(errorCodes(result)).toContain('QUESTION_MARKS_NOT_ALLOWED')
    expect(errorCodes(result)).toContain('SECTION_MARKS_MISMATCH')
    expect(errorCodes(result)).toContain('TOTAL_MARKS_MISMATCH')
  })

  test('rejects a question attached to a group section', () => {
    const paper = buildGateCsPaper()
    paper.questions[0].sectionId = 'subject'
    const result = validateExamPaper(GATE_CS_2027, paper)
    expect(result.ok).toBe(false)
    expect(errorCodes(result)).toContain('SECTION_NOT_LEAF')
  })

  test('rejects a response type the section does not allow', () => {
    const paper = buildGateCsPaper()
    paper.questions[0].responseType = 'multiple'
    paper.questions[0].correctOptionId = null
    paper.questions[0].correctOptionIds = ['A']
    const result = validateExamPaper(GATE_CS_2027, paper)
    expect(result.ok).toBe(false)
    expect(errorCodes(result)).toContain('RESPONSE_TYPE_NOT_ALLOWED')
  })

  test('rejects a profile version mismatch', () => {
    const paper = buildUgcPaper()
    paper.profileVersion = '0.0.1'
    const result = validateExamPaper(UGC_NET_DEC_2026, paper)
    expect(result.ok).toBe(false)
    expect(errorCodes(result)).toContain('PROFILE_VERSION_MISMATCH')
  })

  test('rejects duplicate question ids', () => {
    const paper = buildUgcPaper()
    paper.questions[1].id = paper.questions[0].id
    const result = validateExamPaper(UGC_NET_DEC_2026, paper)
    expect(result.ok).toBe(false)
    expect(errorCodes(result)).toContain('DUPLICATE_QUESTION_ID')
  })

  test('rejects an empty option id in a multiple-select answer key', () => {
    const paper = buildGateCsPaper()
    const question = paper.questions.find(
      (candidate) => candidate.sectionId === 'computer-science',
    )
    if (!question) throw new Error('CS question missing')
    question.responseType = 'multiple'
    question.correctOptionId = null
    question.correctOptionIds = ['']
    const result = validateExamPaper(GATE_CS_2027, paper)
    expect(result.ok).toBe(false)
    expect(errorCodes(result)).toContain('INVALID_ANSWER_KEY')
  })

  test('rejects an out-of-range numeric answer precision', () => {
    const paper = buildGateCsPaper()
    const question = paper.questions.find(
      (candidate) => candidate.sectionId === 'computer-science',
    )
    if (!question) throw new Error('CS question missing')
    question.responseType = 'numeric'
    question.correctOptionId = null
    question.numericAnswer = { value: 1, precision: 7 }
    const result = validateExamPaper(GATE_CS_2027, paper)
    expect(result.ok).toBe(false)
    expect(errorCodes(result)).toContain('INVALID_ANSWER_KEY')
  })

  test('assertValidExamPaper throws a typed paper error', () => {
    const paper = buildUgcPaper()
    paper.questions[0].correctOptionId = null
    expect(() => assertValidExamPaper(UGC_NET_DEC_2026, paper)).toThrow(
      ExamPaperValidationError,
    )
  })
})

describe('versioned profile registry', () => {
  test('registers all shipped profiles and resolves by effective date', () => {
    const registry = createDefaultExamRegistry()
    const codes = registry.codes()
    expect(registry.size).toBe(25)
    expect(codes).toHaveLength(25)
    expect(codes).toContain('GATE-CS-2027')
    expect(codes).toContain('GATE-DA-2027')
    expect(codes).toContain('UGC-NET-DEC-2026')
    expect(codes).toContain('UGC-NET-DEC-2026-P1')
    expect(codes).toContain('UGC-NET-DEC-2026-P2-CS')
    expect(
      codes.filter((code) => code.startsWith('UGC-NET-DEC-2026-P1-U')),
    ).toHaveLength(10)
    expect(
      codes.filter((code) => code.startsWith('UGC-NET-DEC-2026-P2-U')),
    ).toHaveLength(10)
    expect(registry.resolve('GATE-CS-2027', { at: '2026-11-15' })?.version).toBe('1.0.0')
    expect(registry.resolve('UGC-NET-DEC-2026', { at: '2026-10-16' })?.code).toBe(
      'UGC-NET-DEC-2026',
    )
    expect(registry.resolve('GATE-CS-2027', { at: '2025-01-01' })).toBeNull()
    expect(registry.listByFamily('GATE').length).toBe(2)
  })

  test('rejects duplicate code/version registration', () => {
    const registry = createExamRegistry([GATE_CS_2027])
    expect(() => registry.register(GATE_CS_2027)).toThrow(
      ExamProfileRegistrationError,
    )
  })

  test('allows replacing a draft but never a published version', () => {
    const registry = createExamRegistry([GATE_CS_2027])
    const draft = cloneExamProfile(GATE_CS_2027)
    draft.version = '1.0.1'
    draft.status = 'draft'
    draft.publishedAt = null
    draft.effectiveFrom = null
    registry.register(draft)

    const edited = cloneExamProfile(draft)
    edited.instructions = [...edited.instructions, 'Draft edit']
    registry.register(edited, { replace: true })
    expect(registry.get('GATE-CS-2027', '1.0.1')?.instructions).toContain('Draft edit')

    expect(() => registry.register(GATE_CS_2027, { replace: true })).toThrow(
      ExamProfileRegistrationError,
    )
  })

  test('resolves the latest effective version after an admin registers a revision', () => {
    const registry = createDefaultExamRegistry()
    const revision = cloneExamProfile(GATE_CS_2027)
    revision.version = '1.1.0'
    revision.publishedAt = '2026-12-01'
    revision.effectiveFrom = '2027-01-01'
    revision.instructions = [...revision.instructions, 'Revision 1.1']
    registry.register(revision)

    expect(registry.get('GATE-CS-2027')?.version).toBe('1.1.0')
    expect(registry.resolve('GATE-CS-2027', { at: '2026-12-31' })?.version).toBe('1.0.0')
    expect(registry.resolve('GATE-CS-2027', { at: '2027-01-01' })?.version).toBe('1.1.0')
  })

  test('deep-freezes registered profiles and their nested sections', () => {
    const registry = createDefaultExamRegistry()
    const profile = registry.get('GATE-CS-2027')
    expect(profile).not.toBeNull()
    if (!profile) throw new Error('GATE CS profile missing')
    expect(Object.isFrozen(profile)).toBe(true)
    expect(Object.isFrozen(profile.sections[0])).toBe(true)
    expect(Object.isFrozen(profile.marking.incorrect.single)).toBe(true)
    expect(() => {
      ;(profile as unknown as { totalMarks: number }).totalMarks = 1
    }).toThrow()
  })

  test('rejects invalid configuration at registration time', () => {
    const registry = createExamRegistry()
    const invalid = cloneExamProfile(GATE_CS_2027)
    invalid.totalMarks = 101
    expect(() => registry.register(invalid)).toThrow(ExamConfigurationError)
  })
})
