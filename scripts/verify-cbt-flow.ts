/**
 * End-to-end CBT attempt lifecycle verification.
 *
 * Run: bun scripts/verify-cbt-flow.ts
 *
 * This exercises the server lifecycle without a browser:
 *   start -> save MCQ/MSQ/NAT -> mark for review -> clear -> move position ->
 *   heartbeat -> refresh/resume -> submit with client merge -> result ->
 *   idempotent resubmission -> server-side expiry.
 *
 * It also asserts that the delivered paper never leaks answer keys and that
 * another user cannot read the attempt. Every test attempt is deleted at the
 * end, so the script is safe to run against the development database.
 */

import { db } from '../src/lib/db'
import {
  CbtAttemptError,
  getAttemptPayload,
  getAttemptResult,
  heartbeat,
  listActiveAttempts,
  saveAttempt,
  startAttempt,
  submitAttempt,
} from '../src/lib/cbt/attempt'
import type {
  CbtAttemptQuestion,
  CbtPaperSnapshot,
} from '../src/lib/cbt/types'

const USER_ID = 'cbt-flow-verification'
const MAIN_PROFILE = 'GATE-CS-2027'
const EXPIRY_PROFILE = 'UGC-NET-DEC-2026-P1'
const CANDIDATE = {
  name: 'Flow Verification Candidate',
  id: 'NETP-2026-000000',
}

let passed = 0

function check(condition: boolean, message: string): void {
  passed += 1
  if (!condition) throw new Error(message)
  console.log(`  PASS  ${message}`)
}

function requireQuestion(
  question: CbtAttemptQuestion | undefined,
  label: string,
): CbtAttemptQuestion {
  if (!question) {
    throw new Error(`The delivered paper has no usable ${label} question`)
  }
  return question
}

async function cleanup(): Promise<void> {
  await db.examAttempt.deleteMany({ where: { userId: USER_ID } })
}

async function snapshotFor(attemptId: string): Promise<CbtPaperSnapshot> {
  const row = await db.examAttempt.findUnique({ where: { id: attemptId } })
  if (!row) throw new Error(`Attempt ${attemptId} was not stored`)
  return JSON.parse(row.paperJson) as CbtPaperSnapshot
}

async function expectError(
  action: () => Promise<unknown>,
  statusCode: number,
  message: string,
): Promise<void> {
  try {
    await action()
  } catch (error) {
    if (error instanceof CbtAttemptError && error.statusCode === statusCode) {
      check(true, message)
      return
    }
    throw error
  }
  throw new Error(`${message}: expected a ${statusCode} error`)
}

async function main(): Promise<void> {
  await cleanup()

  console.log(`\nStart and delivery (${MAIN_PROFILE})`)
  const started = await startAttempt({
    userId: USER_ID,
    candidate: CANDIDATE,
    profileCode: MAIN_PROFILE,
  })
  check(started.resumed === false, 'a new attempt is created')
  check(started.attempt.status === 'in_progress', 'the attempt starts in progress')
  check(started.attempt.candidate.id === CANDIDATE.id, 'the candidate id is stored')
  check(started.paper.questions.length === 65, 'the GATE CS paper delivers 65 questions')
  check(started.attempt.durationSec === 10_800, 'the attempt stores a 180-minute duration')
  check(
    started.attempt.remainingSec > 10_700,
    'remaining time is derived from the stored expiry',
  )

  const delivered = JSON.stringify(started.paper)
  check(!delivered.includes('"correctOptionId"'), 'the delivered paper omits correctOptionId')
  check(!delivered.includes('"correctOptionIds"'), 'the delivered paper omits correctOptionIds')
  check(!delivered.includes('"numericAnswer"'), 'the delivered paper omits numericAnswer')
  check(!delivered.includes('"explanation"'), 'the delivered paper omits explanations')

  const snapshot = await snapshotFor(started.attempt.id)
  check(snapshot.questions.length === 65, 'the stored snapshot freezes all 65 questions')

  const single = requireQuestion(
    snapshot.questions.find((question) => question.responseType === 'single' && question.correctOptionId),
    'single-choice',
  )
  const singleKey = single.correctOptionId
  if (!singleKey) throw new Error('The single-choice question has no answer key')

  const secondSingle = requireQuestion(
    snapshot.questions.find(
      (question) =>
        question.responseType === 'single' &&
        question.correctOptionId &&
        question.id !== single.id,
    ),
    'second single-choice',
  )
  const secondSingleKey = secondSingle.correctOptionId
  if (!secondSingleKey) throw new Error('The second single-choice question has no answer key')

  const thirdSingle = requireQuestion(
    snapshot.questions.find(
      (question) =>
        question.responseType === 'single' &&
        question.correctOptionId &&
        question.id !== single.id &&
        question.id !== secondSingle.id,
    ),
    'third single-choice',
  )
  const thirdSingleKey = thirdSingle.correctOptionId
  if (!thirdSingleKey) throw new Error('The third single-choice question has no answer key')

  const multiple = requireQuestion(
    snapshot.questions.find(
      (question) =>
        question.responseType === 'multiple' && (question.correctOptionIds?.length ?? 0) > 0,
    ),
    'multiple-select',
  )
  const multipleKey = multiple.correctOptionIds
  if (!multipleKey || multipleKey.length === 0) {
    throw new Error('The multiple-select question has no answer key')
  }

  const numeric = requireQuestion(
    snapshot.questions.find(
      (question) => question.responseType === 'numeric' && question.numericAnswer,
    ),
    'numeric',
  )
  const numericKey = numeric.numericAnswer
  if (!numericKey) throw new Error('The numeric question has no answer key')
  const numericText = String(numericKey.value)

  console.log('\nSaving responses')
  const afterSingle = await saveAttempt(started.attempt.id, USER_ID, {
    response: {
      questionId: single.id,
      selectedOptionId: singleKey,
      markedForReview: true,
      visited: true,
      timeSpentSec: 42,
    },
  })
  check(
    afterSingle.attempt.responses[single.id]?.selectedOptionId === singleKey,
    'the MCQ answer is stored',
  )
  check(
    afterSingle.attempt.responses[single.id]?.markedForReview === true,
    'the review flag is stored',
  )
  check(
    afterSingle.attempt.responses[single.id]?.timeSpentSec === 42,
    'the time spent on the question is stored',
  )
  check(
    afterSingle.attempt.counts.answeredMarked === 1,
    'the palette counts an answered and marked question',
  )

  const afterMultiple = await saveAttempt(started.attempt.id, USER_ID, {
    response: {
      questionId: multiple.id,
      selectedOptionIds: multipleKey,
      visited: true,
    },
  })
  check(
    afterMultiple.attempt.responses[multiple.id]?.selectedOptionIds?.join(',') ===
      multipleKey.join(','),
    'the MSQ combination is stored',
  )
  check(afterMultiple.attempt.counts.answered === 1, 'the MSQ increments the answered count')

  const afterNumeric = await saveAttempt(started.attempt.id, USER_ID, {
    response: {
      questionId: numeric.id,
      numericValue: numericText,
      visited: true,
    },
  })
  check(
    afterNumeric.attempt.responses[numeric.id]?.numericValue === numericText,
    'the NAT value is stored',
  )
  check(afterNumeric.attempt.counts.answered === 2, 'the NAT increments the answered count')

  const answeredSecond = await saveAttempt(started.attempt.id, USER_ID, {
    response: {
      questionId: secondSingle.id,
      selectedOptionId: secondSingleKey,
      visited: true,
    },
  })
  check(answeredSecond.attempt.counts.answered === 3, 'a third answer is counted')

  const cleared = await saveAttempt(started.attempt.id, USER_ID, {
    response: { questionId: secondSingle.id, selectedOptionId: null },
  })
  check(cleared.attempt.counts.answered === 2, 'clearing an answer removes it from answered')
  check(
    cleared.attempt.responses[secondSingle.id]?.selectedOptionId === null,
    'the cleared response is stored as null',
  )

  const markedSecond = await saveAttempt(started.attempt.id, USER_ID, {
    response: { questionId: secondSingle.id, markedForReview: true },
  })
  check(markedSecond.attempt.counts.marked === 1, 'a cleared question can be marked for review')
  check(
    markedSecond.attempt.counts.answered === 2 &&
      markedSecond.attempt.counts.answeredMarked === 1,
    'answered and answered-marked counts stay separate',
  )

  const lastQuestion = snapshot.questions[snapshot.questions.length - 1]
  const positioned = await saveAttempt(started.attempt.id, USER_ID, {
    position: {
      currentSectionId: lastQuestion.sectionId,
      currentQuestionId: lastQuestion.id,
    },
  })
  check(
    positioned.attempt.currentQuestionId === lastQuestion.id,
    'the current question position is stored',
  )
  check(
    positioned.attempt.currentSectionId === lastQuestion.sectionId,
    'the current section follows the position',
  )

  await expectError(
    () =>
      saveAttempt(started.attempt.id, USER_ID, {
        position: { currentSectionId: 'unknown-section', currentQuestionId: lastQuestion.id },
      }),
    400,
    'an unknown section is rejected',
  )
  await expectError(
    () =>
      saveAttempt(started.attempt.id, USER_ID, {
        response: { questionId: single.id, selectedOptionId: 'ZZ' },
      }),
    400,
    'an unknown option id is rejected',
  )

  console.log('\nHeartbeat and refresh/resume')
  const beat = await heartbeat(started.attempt.id, USER_ID)
  check(beat.status === 'in_progress', 'the heartbeat reports the attempt in progress')
  check(
    beat.remainingSec > 0 && beat.remainingSec <= started.attempt.remainingSec,
    'the heartbeat re-anchors the remaining time',
  )

  const resumed = await getAttemptPayload(started.attempt.id, USER_ID)
  check(
    resumed.attempt.responses[single.id]?.selectedOptionId === singleKey,
    'a refresh returns the saved MCQ',
  )
  check(
    resumed.attempt.responses[multiple.id]?.selectedOptionIds?.join(',') ===
      multipleKey.join(','),
    'a refresh returns the saved MSQ',
  )
  check(
    resumed.attempt.responses[numeric.id]?.numericValue === numericText,
    'a refresh returns the saved NAT',
  )
  check(
    resumed.attempt.currentQuestionId === lastQuestion.id,
    'a refresh restores the current position',
  )
  check(
    resumed.attempt.counts.answered === 2 &&
      resumed.attempt.counts.answeredMarked === 1 &&
      resumed.attempt.counts.marked === 1,
    'a refresh restores the palette counts',
  )

  await expectError(
    () => getAttemptPayload(started.attempt.id, 'another-user'),
    404,
    'an attempt is not readable by another user',
  )

  console.log('\nSubmission and result')
  const expectedScore = single.marks + multiple.marks + numeric.marks + thirdSingle.marks
  const submitted = await submitAttempt(started.attempt.id, USER_ID, {
    reason: 'manual',
    responses: {
      [thirdSingle.id]: {
        questionId: thirdSingle.id,
        selectedOptionId: thirdSingleKey,
        visited: true,
      },
    },
  })
  check(submitted.attempt.status === 'submitted', 'the attempt is submitted')
  check(submitted.attempt.submittedReason === 'manual', 'the submission reason is manual')
  check(submitted.result.totals.correct === 4, 'the merged client answers are scored')
  check(submitted.result.totals.incorrect === 0, 'no correct answer is marked incorrect')
  check(submitted.result.totals.answered === 4, 'the result reports four attempted questions')
  check(submitted.result.totals.unanswered === 61, 'the remaining questions are unanswered')
  check(submitted.result.totals.penalty === 0, 'correct answers incur no penalty')
  check(
    submitted.result.totals.finalScore === expectedScore,
    `the final score equals ${expectedScore}`,
  )
  check(submitted.result.totals.maxMarks === 100, 'the maximum marks are frozen at 100')
  check(submitted.result.review.length === 65, 'the result reviews every question')

  const reviewedSingle = submitted.result.review.find((question) => question.id === single.id)
  check(reviewedSingle?.outcome === 'correct', 'the scored MCQ is marked correct')
  check(
    reviewedSingle?.correctOptionId === singleKey,
    'the result exposes the correct option only after submission',
  )
  check(
    (reviewedSingle?.explanation ?? '').length > 0,
    'the result exposes the explanation only after submission',
  )

  const reviewedMarked = submitted.result.review.find(
    (question) => question.id === secondSingle.id,
  )
  check(reviewedMarked?.outcome === 'unanswered', 'the cleared question is scored unanswered')
  check(reviewedMarked?.markedForReview === true, 'the review flag survives submission')

  const repeated = await submitAttempt(started.attempt.id, USER_ID, {})
  check(repeated.attempt.status === 'submitted', 'a repeated submit keeps the attempt submitted')
  check(
    repeated.result.submittedAt === submitted.result.submittedAt,
    'a repeated submit preserves the original submission time',
  )
  check(
    repeated.result.totals.finalScore === submitted.result.totals.finalScore,
    'a repeated submit preserves the score',
  )

  const lateSave = await saveAttempt(started.attempt.id, USER_ID, {
    response: { questionId: thirdSingle.id, selectedOptionId: null },
  })
  check(lateSave.attempt.status === 'submitted', 'a save after submission reports submitted')
  check(
    lateSave.attempt.responses[thirdSingle.id]?.selectedOptionId === thirdSingleKey,
    'a save after submission cannot change an answer',
  )

  const fetched = await getAttemptResult(started.attempt.id, USER_ID)
  check(
    fetched.totals.finalScore === submitted.result.totals.finalScore,
    'the stored result is retrievable',
  )

  console.log(`\nServer-side expiry (${EXPIRY_PROFILE})`)
  const expiryStart = await startAttempt({
    userId: USER_ID,
    candidate: CANDIDATE,
    profileCode: EXPIRY_PROFILE,
  })
  check(expiryStart.resumed === false, 'a second profile starts its own attempt')
  check(expiryStart.paper.questions.length === 50, 'the Paper I profile delivers 50 questions')

  const expirySnapshot = await snapshotFor(expiryStart.attempt.id)
  const expirySingle = requireQuestion(
    expirySnapshot.questions.find(
      (question) => question.responseType === 'single' && question.correctOptionId,
    ),
    'single-choice',
  )
  const expiryKey = expirySingle.correctOptionId
  if (!expiryKey) throw new Error('The expiry question has no answer key')
  const expiryOther = requireQuestion(
    expirySnapshot.questions.find(
      (question) =>
        question.responseType === 'single' &&
        question.correctOptionId &&
        question.id !== expirySingle.id,
    ),
    'second single-choice',
  )
  const expiryOtherKey = expiryOther.correctOptionId
  if (!expiryOtherKey) throw new Error('The second expiry question has no answer key')

  await saveAttempt(expiryStart.attempt.id, USER_ID, {
    response: { questionId: expirySingle.id, selectedOptionId: expiryKey, visited: true },
  })

  const afterExpiry = new Date(Date.now() + 181 * 60_000)
  const expiredBeat = await heartbeat(expiryStart.attempt.id, USER_ID, afterExpiry)
  check(expiredBeat.status === 'submitted', 'a heartbeat after expiry finalizes the attempt')
  check(
    expiredBeat.submittedReason === 'timer_expired',
    'the expiry submission reason is recorded',
  )
  check(expiredBeat.remainingSec === 0, 'the remaining time is zero after expiry')
  check(expiredBeat.resultAvailable, 'the expired attempt stores a result')

  const expiryResult = await getAttemptResult(expiryStart.attempt.id, USER_ID, afterExpiry)
  check(expiryResult.submittedReason === 'timer_expired', 'the result reports the expiry reason')
  check(expiryResult.totals.correct === 1, 'the answer saved before expiry is scored')
  check(
    expiryResult.totals.finalScore === expirySingle.marks,
    'the expiry score matches the saved answer',
  )
  check(expiryResult.totals.unanswered === 49, 'the remaining questions are unanswered')

  const expiryReplay = await submitAttempt(expiryStart.attempt.id, USER_ID, {}, afterExpiry)
  check(
    expiryReplay.result.submittedAt === expiryResult.submittedAt,
    'an expired attempt cannot be resubmitted with a new timestamp',
  )

  const afterExpirySave = await saveAttempt(
    expiryStart.attempt.id,
    USER_ID,
    {
      response: { questionId: expiryOther.id, selectedOptionId: expiryOtherKey },
    },
    afterExpiry,
  )
  check(
    afterExpirySave.attempt.status === 'submitted',
    'a save after expiry reports the submitted state',
  )
  check(
    afterExpirySave.attempt.responses[expiryOther.id] === undefined,
    'a save after expiry cannot add an answer',
  )

  console.log('\nResume pointer')
  const newAttempt = await startAttempt({
    userId: USER_ID,
    candidate: CANDIDATE,
    profileCode: MAIN_PROFILE,
  })
  check(newAttempt.resumed === false, 'a completed attempt does not block a new one')
  const resumedAgain = await startAttempt({
    userId: USER_ID,
    candidate: CANDIDATE,
    profileCode: MAIN_PROFILE,
  })
  check(resumedAgain.resumed === true, 'starting the same profile resumes the open attempt')
  check(
    resumedAgain.attempt.id === newAttempt.attempt.id,
    'the resumed attempt is the same attempt',
  )

  const active = await listActiveAttempts(USER_ID)
  check(
    active[MAIN_PROFILE]?.id === newAttempt.attempt.id,
    'the catalogue exposes the active attempt',
  )
}

try {
  await main()
  console.log(`\nAll ${passed} CBT flow checks passed.`)
} finally {
  await cleanup()
  console.log('Test attempts removed.')
  await db.$disconnect()
}
