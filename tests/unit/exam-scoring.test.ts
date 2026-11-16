/**
 * Server-side scoring tests for the centralized examination engine.
 *
 * Run: bun test tests/unit/exam-scoring.test.ts
 */

import { describe, expect, test } from 'bun:test'
import {
  GATE_CS_2027,
  GATE_DA_2027,
  UGC_NET_DEC_2026,
  ExamScoringError,
  cloneExamProfile,
  scoreExam,
  scoreQuestion,
} from '../../src/lib/exam/index.ts'
import type { ExamQuestion } from '../../src/lib/exam/index.ts'
import {
  answerAll,
  buildGateCsPaper,
  buildGateDaPaper,
  buildUgcPaper,
  partialPaper,
  singleQuestion,
} from './exam-fixtures.ts'

const partialValidation = {
  enforceQuestionCount: false,
  enforceMarks: false,
} as const

const fixedNow = '2026-11-15T00:00:00.000Z'

function resultFor(
  profile: typeof GATE_CS_2027,
  questions: ExamQuestion[],
  responses: Record<string, { questionId: string; selectedOptionId?: string; selectedOptionIds?: string[]; numericValue?: number | string | null }>,
) {
  return scoreExam(profile, partialPaper(profile, questions), responses, {
    paperValidation: partialValidation,
    now: fixedNow,
  })
}

describe('UGC NET scoring', () => {
  test('awards +2 per correct answer with no negative marking', () => {
    const paper = buildUgcPaper()
    const responses = answerAll(paper)
    responses['ugc-p1-0'] = { questionId: 'ugc-p1-0', selectedOptionId: 'B' }
    delete responses['ugc-p1-1']

    const result = scoreExam(UGC_NET_DEC_2026, paper, responses, { now: fixedNow })
    expect(result.totals.correct).toBe(148)
    expect(result.totals.incorrect).toBe(1)
    expect(result.totals.unanswered).toBe(1)
    expect(result.totals.marksAwarded).toBe(296)
    expect(result.totals.penalty).toBe(0)
    expect(result.totals.finalScore).toBe(296)
    expect(result.totals.maxMarks).toBe(300)
    expect(result.exact.finalScore).toEqual({ numerator: 296, denominator: 1 })

    const paper1 = result.sections.find((section) => section.sectionId === 'paper-1')
    const paper2 = result.sections.find((section) => section.sectionId === 'paper-2')
    expect(paper1?.correct).toBe(48)
    expect(paper1?.finalScore).toBe(96)
    expect(paper2?.correct).toBe(100)
    expect(paper2?.finalScore).toBe(200)
  })

  test('computes accuracy on the attempted basis by default', () => {
    const questions = [
      singleQuestion('u1', 'paper-1', 2),
      singleQuestion('u2', 'paper-1', 2),
      singleQuestion('u3', 'paper-1', 2),
      singleQuestion('u4', 'paper-1', 2),
    ]
    const responses = {
      u1: { questionId: 'u1', selectedOptionId: 'A' },
      u2: { questionId: 'u2', selectedOptionId: 'A' },
      u3: { questionId: 'u3', selectedOptionId: 'B' },
    }
    const result = resultFor(UGC_NET_DEC_2026, questions, responses)
    expect(result.totals.correct).toBe(2)
    expect(result.totals.incorrect).toBe(1)
    expect(result.totals.unanswered).toBe(1)
    expect(result.totals.finalScore).toBe(4)
    expect(result.totals.accuracy).toBe(66.67)
  })

  test('can compute accuracy on the total-question basis when configured', () => {
    const profile = cloneExamProfile(UGC_NET_DEC_2026)
    profile.result.accuracyBasis = 'total'
    const questions = [
      singleQuestion('u1', 'paper-1', 2),
      singleQuestion('u2', 'paper-1', 2),
      singleQuestion('u3', 'paper-1', 2),
      singleQuestion('u4', 'paper-1', 2),
    ]
    const result = scoreExam(
      profile,
      partialPaper(profile, questions),
      {
        u1: { questionId: 'u1', selectedOptionId: 'A' },
        u2: { questionId: 'u2', selectedOptionId: 'A' },
        u3: { questionId: 'u3', selectedOptionId: 'B' },
      },
      { paperValidation: partialValidation, now: fixedNow },
    )
    expect(result.totals.accuracy).toBe(50)
  })
})

describe('GATE MCQ negative marking', () => {
  test('deducts exactly 1/3 for a wrong 1-mark MCQ and 2/3 for a wrong 2-mark MCQ', () => {
    const questions = [
      singleQuestion('g1', 'computer-science', 1),
      singleQuestion('g2', 'computer-science', 2),
    ]
    const result = resultFor(GATE_CS_2027, questions, {
      g1: { questionId: 'g1', selectedOptionId: 'B' },
      g2: { questionId: 'g2', selectedOptionId: 'B' },
    })

    expect(result.questions[0].outcome).toBe('incorrect')
    expect(result.questions[0].marksAwardedExact).toEqual({ numerator: 0, denominator: 1 })
    expect(result.questions[0].penaltyExact).toEqual({ numerator: 1, denominator: 3 })
    expect(result.questions[0].netMarksExact).toEqual({ numerator: -1, denominator: 3 })

    expect(result.questions[1].outcome).toBe('incorrect')
    expect(result.questions[1].penaltyExact).toEqual({ numerator: 2, denominator: 3 })
    expect(result.questions[1].netMarksExact).toEqual({ numerator: -2, denominator: 3 })

    expect(result.exact.rawScore).toEqual({ numerator: -1, denominator: 1 })
    expect(result.totals.rawScore).toBe(-1)
    expect(result.totals.penalty).toBe(1)
  })

  test('awards full marks for correct MCQs and zero for skipped MCQs', () => {
    const questions = [
      singleQuestion('g1', 'computer-science', 1),
      singleQuestion('g2', 'computer-science', 2),
    ]
    const result = resultFor(GATE_CS_2027, questions, {
      g1: { questionId: 'g1', selectedOptionId: 'A' },
    })
    expect(result.totals.correct).toBe(1)
    expect(result.totals.unanswered).toBe(1)
    expect(result.totals.finalScore).toBe(1)
    expect(result.exact.finalScore).toEqual({ numerator: 1, denominator: 1 })
  })

  test('preserves the exact fraction while rounding only the display score', () => {
    const profile = cloneExamProfile(GATE_CS_2027)
    profile.result.roundingDecimals = 3
    const result = scoreExam(
      profile,
      partialPaper(profile, [singleQuestion('g1', 'computer-science', 1)]),
      { g1: { questionId: 'g1', selectedOptionId: 'B' } },
      { paperValidation: partialValidation, now: fixedNow },
    )
    expect(result.totals.rawScore).toBe(-0.333)
    expect(result.totals.finalScore).toBe(-0.333)
    expect(result.exact.finalScore).toEqual({ numerator: -1, denominator: 3 })
  })

  test('clamps a negative total only when the profile requests it', () => {
    const wrong = { g1: { questionId: 'g1', selectedOptionId: 'B' } }
    const normal = resultFor(
      GATE_CS_2027,
      [singleQuestion('g1', 'computer-science', 1)],
      wrong,
    )
    expect(normal.totals.rawScore).toBe(-0.33)
    expect(normal.totals.finalScore).toBe(-0.33)
    expect(normal.exact.finalScore).toEqual({ numerator: -1, denominator: 3 })

    const clampedProfile = cloneExamProfile(GATE_CS_2027)
    clampedProfile.result.clampTotalToZero = true
    const clamped = scoreExam(
      clampedProfile,
      partialPaper(clampedProfile, [singleQuestion('g1', 'computer-science', 1)]),
      wrong,
      { paperValidation: partialValidation, now: fixedNow },
    )
    expect(clamped.totals.rawScore).toBe(-0.33)
    expect(clamped.totals.finalScore).toBe(0)
    expect(clamped.exact.rawScore).toEqual({ numerator: -1, denominator: 3 })
    expect(clamped.exact.finalScore).toEqual({ numerator: 0, denominator: 1 })
  })

  test('clamping the total does not rewrite signed section scores', () => {
    const profile = cloneExamProfile(GATE_CS_2027)
    profile.result.clampTotalToZero = true
    const questions = [
      singleQuestion('ga-correct', 'general-aptitude', 1),
      singleQuestion('cs-wrong-1', 'computer-science', 2),
      singleQuestion('cs-wrong-2', 'computer-science', 2),
      singleQuestion('cs-wrong-3', 'computer-science', 2),
    ]
    const result = scoreExam(
      profile,
      partialPaper(profile, questions),
      {
        'ga-correct': { questionId: 'ga-correct', selectedOptionId: 'A' },
        'cs-wrong-1': { questionId: 'cs-wrong-1', selectedOptionId: 'B' },
        'cs-wrong-2': { questionId: 'cs-wrong-2', selectedOptionId: 'B' },
        'cs-wrong-3': { questionId: 'cs-wrong-3', selectedOptionId: 'B' },
      },
      { paperValidation: partialValidation, now: fixedNow },
    )
    const ga = result.sections.find((section) => section.sectionId === 'general-aptitude')
    const cs = result.sections.find((section) => section.sectionId === 'computer-science')
    expect(result.totals.finalScore).toBe(0)
    expect(result.exact.finalScore).toEqual({ numerator: 0, denominator: 1 })
    expect(ga?.finalScore).toBe(1)
    expect(cs?.finalScore).toBe(-2)
  })
})

describe('GATE MSQ scoring', () => {
  const msq: ExamQuestion = {
    id: 'msq',
    sectionId: 'computer-science',
    responseType: 'multiple',
    marks: 2,
    correctOptionIds: ['A', 'C'],
    presentationType: 'text',
  }

  test('awards full marks only for the exact correct combination', () => {
    const exact = scoreQuestion(GATE_CS_2027, msq, {
      questionId: 'msq',
      selectedOptionIds: ['C', 'A'],
    })
    expect(exact.outcome).toBe('correct')
    expect(exact.marksAwarded).toBe(2)
    expect(exact.penalty).toBe(0)

    const subset = scoreQuestion(GATE_CS_2027, msq, {
      questionId: 'msq',
      selectedOptionIds: ['A'],
    })
    expect(subset.outcome).toBe('incorrect')
    expect(subset.marksAwarded).toBe(0)
    expect(subset.penalty).toBe(0)

    const superset = scoreQuestion(GATE_CS_2027, msq, {
      questionId: 'msq',
      selectedOptionIds: ['A', 'B', 'C'],
    })
    expect(superset.outcome).toBe('incorrect')
    expect(superset.marksAwarded).toBe(0)
    expect(superset.penalty).toBe(0)

    const unanswered = scoreQuestion(GATE_CS_2027, msq, null)
    expect(unanswered.outcome).toBe('unanswered')
    expect(unanswered.netMarks).toBe(0)
  })

  test('never applies partial marking through scoreExam', () => {
    const result = resultFor(GATE_CS_2027, [msq], {
      msq: { questionId: 'msq', selectedOptionIds: ['A'] },
    })
    expect(result.totals.correct).toBe(0)
    expect(result.totals.incorrect).toBe(1)
    expect(result.totals.finalScore).toBe(0)
    expect(result.totals.penalty).toBe(0)
  })
})

describe('GATE NAT scoring', () => {
  const nat: ExamQuestion = {
    id: 'nat',
    sectionId: 'computer-science',
    responseType: 'numeric',
    marks: 2,
    numericAnswer: { value: 3.14, precision: 2 },
    presentationType: 'text',
  }

  test('honours the configured decimal precision', () => {
    expect(
      scoreQuestion(GATE_CS_2027, nat, { questionId: 'nat', numericValue: 3.141 }).outcome,
    ).toBe('correct')
    expect(
      scoreQuestion(GATE_CS_2027, nat, { questionId: 'nat', numericValue: 3.146 }).outcome,
    ).toBe('incorrect')
    expect(
      scoreQuestion(GATE_CS_2027, nat, { questionId: 'nat', numericValue: '3.14' }).outcome,
    ).toBe('correct')
    expect(
      scoreQuestion(GATE_CS_2027, nat, { questionId: 'nat', numericValue: null }).outcome,
    ).toBe('unanswered')
  })

  test('honours absolute tolerance overrides', () => {
    const tolerant: ExamQuestion = {
      ...nat,
      numericAnswer: {
        value: 3.14,
        precision: 2,
        tolerance: 0.01,
        toleranceMode: 'absolute',
      },
    }
    expect(
      scoreQuestion(GATE_CS_2027, tolerant, {
        questionId: 'nat',
        numericValue: 3.145,
      }).outcome,
    ).toBe('correct')
    expect(
      scoreQuestion(GATE_CS_2027, tolerant, {
        questionId: 'nat',
        numericValue: 3.16,
      }).outcome,
    ).toBe('incorrect')
  })

  test('honours relative tolerance overrides', () => {
    const relative: ExamQuestion = {
      ...nat,
      numericAnswer: {
        value: 100,
        precision: 2,
        tolerance: 0.01,
        toleranceMode: 'relative',
      },
    }
    expect(
      scoreQuestion(GATE_CS_2027, relative, {
        questionId: 'nat',
        numericValue: 100.5,
      }).outcome,
    ).toBe('correct')
    expect(
      scoreQuestion(GATE_CS_2027, relative, {
        questionId: 'nat',
        numericValue: 101.5,
      }).outcome,
    ).toBe('incorrect')
  })

  test('toleranceMode none requires an exact rounded match', () => {
    const strict: ExamQuestion = {
      ...nat,
      numericAnswer: {
        value: 3.14,
        precision: 2,
        tolerance: 0.01,
        toleranceMode: 'none',
      },
    }
    expect(
      scoreQuestion(GATE_CS_2027, strict, {
        questionId: 'nat',
        numericValue: 3.145,
      }).outcome,
    ).toBe('incorrect')
    expect(
      scoreQuestion(GATE_CS_2027, strict, {
        questionId: 'nat',
        numericValue: 3.14,
      }).outcome,
    ).toBe('correct')
  })

  test('NAT never applies negative marking', () => {
    const result = resultFor(GATE_CS_2027, [nat], {
      nat: { questionId: 'nat', numericValue: 99 },
    })
    expect(result.totals.incorrect).toBe(1)
    expect(result.totals.penalty).toBe(0)
    expect(result.totals.finalScore).toBe(0)
  })
})

describe('dropped-question policy', () => {
  const dropped: ExamQuestion = {
    id: 'dropped',
    sectionId: 'computer-science',
    responseType: 'single',
    marks: 2,
    status: 'dropped',
  }

  test('award-all gives every candidate the question marks', () => {
    const profile = cloneExamProfile(GATE_CS_2027)
    profile.marking.droppedQuestion = 'award-all'
    const unanswered = scoreQuestion(profile, dropped, null)
    expect(unanswered.outcome).toBe('dropped-bonus')
    expect(unanswered.marksAwarded).toBe(2)
    expect(unanswered.netMarks).toBe(2)
    expect(unanswered.answered).toBe(false)

    const result = scoreExam(
      profile,
      partialPaper(profile, [dropped]),
      {},
      { paperValidation: partialValidation, now: fixedNow },
    )
    expect(result.totals.dropped).toBe(1)
    expect(result.totals.finalScore).toBe(2)
  })

  test('award-attempted only gives marks to candidates who answered', () => {
    const profile = cloneExamProfile(GATE_CS_2027)
    profile.marking.droppedQuestion = 'award-attempted'
    expect(scoreQuestion(profile, dropped, null).outcome).toBe('dropped')
    expect(scoreQuestion(profile, dropped, null).netMarks).toBe(0)

    const answered = scoreQuestion(profile, dropped, {
      questionId: 'dropped',
      selectedOptionId: 'B',
    })
    expect(answered.outcome).toBe('dropped-bonus')
    expect(answered.netMarks).toBe(2)
  })

  test('none gives no marks under any circumstances', () => {
    const profile = cloneExamProfile(GATE_CS_2027)
    profile.marking.droppedQuestion = 'none'
    expect(scoreQuestion(profile, dropped, null).netMarks).toBe(0)
    expect(
      scoreQuestion(profile, dropped, {
        questionId: 'dropped',
        selectedOptionId: 'A',
      }).netMarks,
    ).toBe(0)
  })
})

describe('full-paper totals and section breakdowns', () => {
  test('UGC combined paper totals 300 with Paper I and Paper II sections', () => {
    const paper = buildUgcPaper()
    const result = scoreExam(UGC_NET_DEC_2026, paper, answerAll(paper), { now: fixedNow })
    expect(result.totals.finalScore).toBe(300)
    expect(result.totals.correct).toBe(150)
    expect(result.totals.accuracy).toBe(100)
    expect(result.sections.find((section) => section.sectionId === 'paper-1')?.finalScore).toBe(100)
    expect(result.sections.find((section) => section.sectionId === 'paper-2')?.finalScore).toBe(200)
  })

  test('GATE CS totals 100 and exposes GA, subject, EM and CS sections', () => {
    const paper = buildGateCsPaper()
    const result = scoreExam(GATE_CS_2027, paper, answerAll(paper), { now: fixedNow })
    expect(result.totals.finalScore).toBe(100)
    expect(result.totals.correct).toBe(65)
    expect(result.totals.accuracy).toBe(100)

    const sections = new Map(result.sections.map((section) => [section.sectionId, section]))
    expect(sections.get('general-aptitude')?.questionCount).toBe(10)
    expect(sections.get('general-aptitude')?.maxMarks).toBe(15)
    expect(sections.get('general-aptitude')?.finalScore).toBe(15)
    expect(sections.get('subject')?.questionCount).toBe(55)
    expect(sections.get('subject')?.maxMarks).toBe(85)
    expect(sections.get('subject')?.finalScore).toBe(85)
    expect(sections.get('engineering-mathematics')?.questionCount).toBe(9)
    expect(sections.get('engineering-mathematics')?.maxMarks).toBe(13)
    expect(sections.get('engineering-mathematics')?.finalScore).toBe(13)
    expect(sections.get('engineering-mathematics')?.parentSectionIds).toEqual(['subject'])
    expect(sections.get('computer-science')?.questionCount).toBe(46)
    expect(sections.get('computer-science')?.maxMarks).toBe(72)
    expect(sections.get('computer-science')?.finalScore).toBe(72)
    expect(sections.get('computer-science')?.parentSectionIds).toEqual(['subject'])
  })

  test('GATE DA totals 100 with a 55-question/85-mark DS&AI section', () => {
    const paper = buildGateDaPaper()
    const result = scoreExam(GATE_DA_2027, paper, answerAll(paper), { now: fixedNow })
    expect(result.totals.finalScore).toBe(100)
    const ds = result.sections.find((section) => section.sectionId === 'data-science-ai')
    expect(ds?.questionCount).toBe(55)
    expect(ds?.maxMarks).toBe(85)
    expect(ds?.finalScore).toBe(85)
  })
})

describe('scoring safety', () => {
  test('refuses to score a paper that fails validation', () => {
    const paper = buildUgcPaper()
    paper.questions[0].correctOptionId = null
    expect(() => scoreExam(UGC_NET_DEC_2026, paper, {})).toThrow(ExamScoringError)
  })

  test('refuses to score with an invalid profile', () => {
    const invalid = cloneExamProfile(GATE_CS_2027)
    invalid.totalMarks = 101
    expect(() => scoreExam(invalid, buildGateCsPaper(), {})).toThrow(ExamScoringError)
  })

  test('rejects duplicate responses for the same question', () => {
    const paper = partialPaper(GATE_CS_2027, [
      singleQuestion('g1', 'computer-science', 1),
    ])
    expect(() =>
      scoreExam(
        GATE_CS_2027,
        paper,
        [
          { questionId: 'g1', selectedOptionId: 'A' },
          { questionId: 'g1', selectedOptionId: 'B' },
        ],
        { paperValidation: partialValidation, now: fixedNow },
      ),
    ).toThrow('Duplicate response')
  })
})
