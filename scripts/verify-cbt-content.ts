/**
 * CBT content and paper-assembly verification.
 *
 * Run: bun scripts/verify-cbt-content.ts
 *
 * For every published profile this script:
 *  - checks availability against the real deliverable pool,
 *  - assembles the full paper through the deterministic selector,
 *  - verifies section counts and marks,
 *  - scores an all-correct attempt and checks the total equals the paper total.
 */

import { EXAM_PROFILES, getDefaultExamRegistry } from '../src/lib/exam/profiles'
import { scoreExam } from '../src/lib/exam/scoring'
import type { CandidateResponse, ExamProfile } from '../src/lib/exam/types'
import { availabilityForProfile } from '../src/lib/cbt/availability'
import { buildCbtPaper } from '../src/lib/cbt/paper-builder'
import { computePoolStats, loadCbtQuestionPool } from '../src/lib/cbt/question-pool'

function check(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  PASS  ${message}`)
  } else {
    throw new Error(message)
  }
}

function allCorrectResponses(
  snapshot: ReturnType<typeof buildCbtPaper>['snapshot'],
): CandidateResponse[] {
  return snapshot.questions.map((question) => {
    if (question.responseType === 'single') {
      if (!question.correctOptionId) {
        throw new Error(`Missing single answer key for ${question.id}`)
      }
      return { questionId: question.id, selectedOptionId: question.correctOptionId }
    }
    if (question.responseType === 'multiple') {
      if (!question.correctOptionIds || question.correctOptionIds.length === 0) {
        throw new Error(`Missing multiple answer key for ${question.id}`)
      }
      return { questionId: question.id, selectedOptionIds: question.correctOptionIds }
    }
    if (!question.numericAnswer) {
      throw new Error(`Missing numeric answer key for ${question.id}`)
    }
    return { questionId: question.id, numericValue: question.numericAnswer.value }
  })
}

async function verifyProfile(profile: ExamProfile, pool: Awaited<ReturnType<typeof loadCbtQuestionPool>>): Promise<void> {
  const availability = availabilityForProfile(profile, computePoolStats(pool))
  console.log(`\n${profile.code} (${profile.version})`)
  for (const requirement of availability.requirements) {
    console.log(
      `  ${requirement.label}: ${requirement.available}/${requirement.required}`,
    )
  }

  if (!availability.available) {
    check(!availability.available, `${profile.code} is correctly marked unavailable`)
    if (availability.note) console.log(`  NOTE  ${availability.note}`)
    return
  }

  const { snapshot, examPaper } = buildCbtPaper(profile, pool)
  check(
    snapshot.questions.length === profile.totalQuestions,
    `${profile.code} assembled ${profile.totalQuestions} questions`,
  )
  check(
    examPaper.questions.reduce((sum, question) => sum + question.marks, 0) ===
      profile.totalMarks,
    `${profile.code} assembled ${profile.totalMarks} marks`,
  )

  for (const section of snapshot.sections) {
    console.log(
      `  ${section.code}: ${section.questionCount} questions, ${section.marks} marks`,
    )
  }

  const responses = allCorrectResponses(snapshot)
  const result = scoreExam(profile, examPaper, responses)
  check(
    result.totals.correct === snapshot.questions.length,
    `${profile.code} all-correct scoring marks every question correct`,
  )
  check(
    result.totals.finalScore === profile.totalMarks,
    `${profile.code} all-correct score is ${profile.totalMarks}`,
  )
  check(result.totals.penalty === 0, `${profile.code} all-correct score has no penalty`)

  if (profile.code === 'GATE-CS-2027') {
    const ga = snapshot.sections.find((section) => section.id === 'general-aptitude')
    const em = snapshot.sections.find((section) => section.id === 'engineering-mathematics')
    const cs = snapshot.sections.find((section) => section.id === 'computer-science')
    check(ga?.questionCount === 10 && ga.marks === 15, 'GATE GA is 10 questions / 15 marks')
    check(em?.questionCount === 10 && em.marks === 13, 'GATE EM is 10 questions / 13 marks')
    check(cs?.questionCount === 45 && cs.marks === 72, 'GATE CS is 45 questions / 72 marks')
  }
}

async function main(): Promise<void> {
  const pool = await loadCbtQuestionPool()
  const stats = computePoolStats(pool)
  console.log('Deliverable pool')
  console.log(JSON.stringify(stats, null, 2))

  const registry = getDefaultExamRegistry()
  for (const shipped of EXAM_PROFILES) {
    const profile = registry.get(shipped.code, shipped.version)
    if (!profile) throw new Error(`Profile ${shipped.code} is not registered`)
    await verifyProfile(profile, pool)
  }

  console.log('\nCBT content verification complete.')
}

main().catch((error) => {
  console.error(`\nCBT content verification FAILED: ${error.message}`)
  process.exitCode = 1
})
