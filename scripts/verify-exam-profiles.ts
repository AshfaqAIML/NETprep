/**
 * Examination profile verification gate.
 *
 * Run: bun scripts/verify-exam-profiles.ts
 *
 * This script is intentionally independent of the database and the Next.js
 * server. It validates every shipped profile, checks the official pattern
 * invariants, exercises the versioned registry, and runs a small scoring smoke
 * test. A non-zero exit code means mock-test generation must not proceed.
 */

import {
  EXAM_PROFILES,
  GATE_CS_2027,
  GATE_DA_2027,
  UGC_NET_DEC_2026,
  UGC_NET_DEC_2026_P1,
  UGC_NET_DEC_2026_P2_CS,
  createDefaultExamRegistry,
  findSection,
  getSectionNodes,
  scoreQuestion,
  validateExamProfile,
} from '../src/lib/exam/index'
import type { ExamProfile, ExamQuestion, Rational } from '../src/lib/exam/index'

const failures: string[] = []

function check(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  PASS  ${message}`)
  } else {
    failures.push(message)
    console.error(`  FAIL  ${message}`)
  }
}

function equalRational(actual: Rational, expected: Rational): boolean {
  return (
    actual.numerator === expected.numerator &&
    actual.denominator === expected.denominator
  )
}

function ruleSummary(profile: ExamProfile): string {
  return getSectionNodes(profile)
    .map((node) => {
      const rules = node.section.questionRules
        .map(
          (rule) =>
            `${rule.responseType}:${rule.marks}${rule.count === undefined ? '' : `x${rule.count}`}`,
        )
        .join(', ')
      const indent = '  '.repeat(node.depth)
      const count = node.section.questionCount === null ? '?' : String(node.section.questionCount)
      return `${indent}${node.section.code.padEnd(8)} ${count.padStart(3)}q / ${String(node.section.marks).padStart(3)}m  ${rules || '(group)'}`
    })
    .join('\n')
}

console.log('Examination profile verification')
console.log('================================')

console.log('\nProfile matrix')
for (const profile of EXAM_PROFILES) {
  const validation = validateExamProfile(profile)
  console.log(
    `\n${profile.code}  v${profile.version}  [${profile.status}]  ` +
      `${profile.totalQuestions}q / ${profile.totalMarks}m / ${profile.durationMinutes}min  ` +
      `${profile.language.available.join('+')}`,
  )
  console.log(ruleSummary(profile))
  if (!validation.ok) {
    for (const error of validation.errors) {
      console.error(`  ERROR ${error.path} (${error.code}) ${error.message}`)
    }
  }
  check(validation.ok, `${profile.code} passes structural and semantic validation`)
  check(validation.warnings.length === 0, `${profile.code} has no configuration warnings`)
  check(Object.isFrozen(profile), `${profile.code} is deep-frozen`)
}

console.log('\nOfficial pattern invariants')
check(
  UGC_NET_DEC_2026.totalQuestions === 150 &&
    UGC_NET_DEC_2026.totalMarks === 300 &&
    UGC_NET_DEC_2026.durationMinutes === 180,
  'UGC NET combined is 150 questions / 300 marks / 180 minutes',
)
check(
  findSection(UGC_NET_DEC_2026, 'paper-1')?.questionCount === 50 &&
    findSection(UGC_NET_DEC_2026, 'paper-1')?.marks === 100,
  'UGC NET Paper I is 50 questions / 100 marks',
)
check(
  findSection(UGC_NET_DEC_2026, 'paper-2')?.questionCount === 100 &&
    findSection(UGC_NET_DEC_2026, 'paper-2')?.marks === 200,
  'UGC NET Paper II is 100 questions / 200 marks',
)
check(
  UGC_NET_DEC_2026_P1.totalQuestions === 50 && UGC_NET_DEC_2026_P1.totalMarks === 100,
  'UGC NET standalone Paper I is 50 questions / 100 marks',
)
check(
  UGC_NET_DEC_2026_P2_CS.totalQuestions === 100 &&
    UGC_NET_DEC_2026_P2_CS.totalMarks === 200,
  'UGC NET standalone Paper II CS is 100 questions / 200 marks',
)
check(
  UGC_NET_DEC_2026.marking.incorrect.single.mode === 'none',
  'UGC NET has no negative marking',
)
check(UGC_NET_DEC_2026.language.bilingual, 'UGC NET Paper I is bilingual')
check(
  UGC_NET_DEC_2026_P2_CS.language.available.length === 1 &&
    UGC_NET_DEC_2026_P2_CS.language.available[0] === 'en',
  'UGC NET Paper II Computer Science is English-only',
)

const gateGa = findSection(GATE_CS_2027, 'general-aptitude')
const gateSubject = findSection(GATE_CS_2027, 'subject')
const gateEm = findSection(GATE_CS_2027, 'engineering-mathematics')
const gateCs = findSection(GATE_CS_2027, 'computer-science')
check(
  GATE_CS_2027.totalQuestions === 65 &&
    GATE_CS_2027.totalMarks === 100 &&
    GATE_CS_2027.durationMinutes === 180,
  'GATE CS is 65 questions / 100 marks / 180 minutes',
)
check(gateGa?.questionCount === 10 && gateGa?.marks === 15, 'GATE CS GA is 10 questions / 15 marks')
check(gateSubject?.questionCount === 55 && gateSubject?.marks === 85, 'GATE CS subject is 55 questions / 85 marks')
check(gateEm?.marks === 13, 'GATE CS Engineering Mathematics carries 13 marks')
check(gateCs?.marks === 72, 'GATE CS subject component carries 72 marks')
check((gateEm?.marks ?? 0) + (gateCs?.marks ?? 0) === 85, 'GATE CS subject marks add up to 85')
check(gateEm?.questionCount === null && gateCs?.questionCount === null, 'GATE CS does not invent EM/CS question counts')

const gateDaGa = findSection(GATE_DA_2027, 'general-aptitude')
const gateDaSubject = findSection(GATE_DA_2027, 'data-science-ai')
check(
  GATE_DA_2027.totalQuestions === 65 &&
    GATE_DA_2027.totalMarks === 100 &&
    GATE_DA_2027.durationMinutes === 180,
  'GATE DA is 65 questions / 100 marks / 180 minutes',
)
check(gateDaGa?.questionCount === 10 && gateDaGa?.marks === 15, 'GATE DA GA is 10 questions / 15 marks')
check(
  gateDaSubject?.questionCount === 55 && gateDaSubject?.marks === 85,
  'GATE DA Data Science & AI is 55 questions / 85 marks',
)

console.log('\nMarking rules')
check(
  GATE_CS_2027.marking.incorrect.single.mode === 'fraction-of-question-marks' &&
    equalRational(GATE_CS_2027.marking.incorrect.single.fraction, {
      numerator: 1,
      denominator: 3,
    }),
  'GATE MCQ penalty is one third of question marks (1/3 for 1 mark, 2/3 for 2 marks)',
)
check(
  GATE_CS_2027.marking.incorrect.multiple.requiresExactMatch &&
    !GATE_CS_2027.marking.incorrect.multiple.partialMarking &&
    GATE_CS_2027.marking.incorrect.multiple.mode === 'none',
  'GATE MSQ requires the exact combination with no partial or negative marking',
)
check(
  GATE_CS_2027.marking.incorrect.numeric.mode === 'none' &&
    GATE_CS_2027.marking.numeric.precision === 2,
  'GATE NAT has no negative marking and configurable precision',
)

console.log('\nVersioned registry')
const registry = createDefaultExamRegistry()
check(registry.size === EXAM_PROFILES.length, `registry contains all ${EXAM_PROFILES.length} profiles`)
for (const profile of EXAM_PROFILES) {
  check(
    registry.resolve(profile.code, { at: '2026-11-15' })?.version === profile.version,
    `${profile.code} resolves to v${profile.version} on 2026-11-15`,
  )
}
check(
  registry.resolve('GATE-CS-2027', { at: '2025-01-01' }) === null,
  'registry does not resolve a profile before its effective date',
)
check(
  Object.isFrozen(registry.get('GATE-CS-2027')),
  'registry returns deep-frozen profiles',
)

console.log('\nScoring smoke test')
const gateOneMark: ExamQuestion = {
  id: 'verify-gate-1',
  sectionId: 'computer-science',
  responseType: 'single',
  marks: 1,
  correctOptionId: 'A',
}
const gateTwoMark: ExamQuestion = {
  id: 'verify-gate-2',
  sectionId: 'computer-science',
  responseType: 'single',
  marks: 2,
  correctOptionId: 'A',
}
const wrongOne = scoreQuestion(GATE_CS_2027, gateOneMark, {
  questionId: gateOneMark.id,
  selectedOptionId: 'B',
})
const wrongTwo = scoreQuestion(GATE_CS_2027, gateTwoMark, {
  questionId: gateTwoMark.id,
  selectedOptionId: 'B',
})
check(
  equalRational(wrongOne.netMarksExact, { numerator: -1, denominator: 3 }),
  'scoring a wrong 1-mark GATE MCQ yields exactly -1/3',
)
check(
  equalRational(wrongTwo.netMarksExact, { numerator: -2, denominator: 3 }),
  'scoring a wrong 2-mark GATE MCQ yields exactly -2/3',
)

const ugcQuestion: ExamQuestion = {
  id: 'verify-ugc',
  sectionId: 'paper-1',
  responseType: 'single',
  marks: 2,
  correctOptionId: 'A',
}
check(
  scoreQuestion(UGC_NET_DEC_2026, ugcQuestion, {
    questionId: ugcQuestion.id,
    selectedOptionId: 'B',
  }).netMarks === 0,
  'scoring a wrong UGC NET answer yields zero, not a penalty',
)

const msq: ExamQuestion = {
  id: 'verify-msq',
  sectionId: 'computer-science',
  responseType: 'multiple',
  marks: 2,
  correctOptionIds: ['A', 'C'],
}
check(
  scoreQuestion(GATE_CS_2027, msq, {
    questionId: msq.id,
    selectedOptionIds: ['A'],
  }).netMarks === 0,
  'MSQ subset receives no partial marks',
)
check(
  scoreQuestion(GATE_CS_2027, msq, {
    questionId: msq.id,
    selectedOptionIds: ['C', 'A'],
  }).netMarks === 2,
  'MSQ exact combination receives full marks',
)

const nat: ExamQuestion = {
  id: 'verify-nat',
  sectionId: 'computer-science',
  responseType: 'numeric',
  marks: 2,
  numericAnswer: { value: 3.14, precision: 2, tolerance: 0.01, toleranceMode: 'absolute' },
}
check(
  scoreQuestion(GATE_CS_2027, nat, {
    questionId: nat.id,
    numericValue: 3.145,
  }).outcome === 'correct',
  'NAT accepts an answer inside the configured tolerance',
)
check(
  scoreQuestion(GATE_CS_2027, nat, {
    questionId: nat.id,
    numericValue: 3.16,
  }).outcome === 'incorrect',
  'NAT rejects an answer outside the configured tolerance',
)

console.log('\n================================')
if (failures.length > 0) {
  console.error(`${failures.length} verification check(s) failed.`)
  for (const failure of failures) console.error(` - ${failure}`)
  process.exitCode = 1
} else {
  console.log('All examination profiles verified. Mock-test generation may proceed.')
}
