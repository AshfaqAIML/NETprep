/**
 * Deterministic paper fixtures used by the examination engine tests.
 *
 * These are deliberately plain objects: the engine must be testable without a
 * database or a running Next.js server.
 */

import {
  GATE_CS_2027,
  GATE_DA_2027,
  UGC_NET_DEC_2026,
} from '../../src/lib/exam/index.ts'
import type {
  CandidateResponse,
  ExamPaper,
  ExamQuestion,
  ExamProfile,
} from '../../src/lib/exam/index.ts'

export function singleQuestion(
  id: string,
  sectionId: string,
  marks: number,
  correctOptionId = 'A',
): ExamQuestion {
  return {
    id,
    sectionId,
    responseType: 'single',
    marks,
    correctOptionId,
    presentationType: 'text',
  }
}

export function buildUgcPaper(profile: ExamProfile = UGC_NET_DEC_2026): ExamPaper {
  const questions: ExamQuestion[] = []
  for (let i = 0; i < 50; i += 1) {
    questions.push(singleQuestion(`ugc-p1-${i}`, 'paper-1', 2))
  }
  for (let i = 0; i < 100; i += 1) {
    questions.push(singleQuestion(`ugc-p2-${i}`, 'paper-2', 2))
  }
  return {
    id: 'ugc-net-dec-2026-fixture',
    profileCode: profile.code,
    profileVersion: profile.version,
    questions,
  }
}

/**
 * GATE CS: 10 GA + 55 subject = 65 questions / 100 marks.
 * GA 5x1 + 5x2 = 15; EM 5x1 + 4x2 = 13 (9 q); CS 20x1 + 26x2 = 72 (46 q).
 * This satisfies the official marks while keeping the subject at 55 questions.
 */
export function buildGateCsPaper(profile: ExamProfile = GATE_CS_2027): ExamPaper {
  const questions: ExamQuestion[] = []
  for (let i = 0; i < 5; i += 1) {
    questions.push(singleQuestion(`gate-ga-1-${i}`, 'general-aptitude', 1))
  }
  for (let i = 0; i < 5; i += 1) {
    questions.push(singleQuestion(`gate-ga-2-${i}`, 'general-aptitude', 2))
  }
  for (let i = 0; i < 5; i += 1) {
    questions.push(singleQuestion(`gate-em-1-${i}`, 'engineering-mathematics', 1))
  }
  for (let i = 0; i < 4; i += 1) {
    questions.push(singleQuestion(`gate-em-2-${i}`, 'engineering-mathematics', 2))
  }
  for (let i = 0; i < 20; i += 1) {
    questions.push(singleQuestion(`gate-cs-1-${i}`, 'computer-science', 1))
  }
  for (let i = 0; i < 26; i += 1) {
    questions.push(singleQuestion(`gate-cs-2-${i}`, 'computer-science', 2))
  }
  return {
    id: 'gate-cs-2027-fixture',
    profileCode: profile.code,
    profileVersion: profile.version,
    questions,
  }
}

/**
 * GATE DA: 10 GA + 55 DS&AI = 65 questions / 100 marks.
 * DS&AI 25x1 + 30x2 = 85.
 */
export function buildGateDaPaper(profile: ExamProfile = GATE_DA_2027): ExamPaper {
  const questions: ExamQuestion[] = []
  for (let i = 0; i < 5; i += 1) {
    questions.push(singleQuestion(`gate-da-ga-1-${i}`, 'general-aptitude', 1))
  }
  for (let i = 0; i < 5; i += 1) {
    questions.push(singleQuestion(`gate-da-ga-2-${i}`, 'general-aptitude', 2))
  }
  for (let i = 0; i < 25; i += 1) {
    questions.push(singleQuestion(`gate-da-1-${i}`, 'data-science-ai', 1))
  }
  for (let i = 0; i < 30; i += 1) {
    questions.push(singleQuestion(`gate-da-2-${i}`, 'data-science-ai', 2))
  }
  return {
    id: 'gate-da-2027-fixture',
    profileCode: profile.code,
    profileVersion: profile.version,
    questions,
  }
}

export function answerAll(
  paper: ExamPaper,
  selectedOptionId = 'A',
): Record<string, CandidateResponse> {
  const responses: Record<string, CandidateResponse> = {}
  for (const question of paper.questions) {
    responses[question.id] = {
      questionId: question.id,
      selectedOptionId,
    }
  }
  return responses
}

export function partialPaper(
  profile: ExamProfile,
  questions: ExamQuestion[],
): ExamPaper {
  return {
    id: `${profile.id}-partial-fixture`,
    profileCode: profile.code,
    profileVersion: profile.version,
    questions,
  }
}
