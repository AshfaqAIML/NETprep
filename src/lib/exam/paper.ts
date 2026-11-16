/**
 * Paper-level validation: proves that a delivered question paper actually
 * matches the profile before any score is calculated. This is the server-side
 * guard that prevents a mis-assembled mock test from being scored silently.
 */

import {
  descendantLeafIds,
  findSectionNode,
  getLeafSections,
  getSectionNodes,
  sectionAllowedMarks,
  sectionAllowedPresentationTypes,
  sectionAllowsResponseType,
} from './blueprint'
import type {
  ExamPaper,
  ExamProfile,
  ExamQuestion,
  PaperValidation,
  ValidationIssue,
} from './types'

export interface PaperValidationOptions {
  enforceQuestionCount?: boolean
  enforceMarks?: boolean
  enforceProfileVersion?: boolean
  allowEmpty?: boolean
}

function issue(path: string, code: string, message: string): ValidationIssue {
  return { path, code, message }
}

function answeredKeyMissing(question: ExamQuestion): boolean {
  if (question.status === 'dropped') return false
  if (question.responseType === 'single') {
    return !question.correctOptionId || question.correctOptionId.trim() === ''
  }
  if (question.responseType === 'multiple') {
    return !question.correctOptionIds || question.correctOptionIds.length === 0
  }
  return (
    !question.numericAnswer ||
    !Number.isFinite(question.numericAnswer.value)
  )
}

export function validateExamPaper(
  profile: ExamProfile,
  paper: ExamPaper,
  options: PaperValidationOptions = {},
): PaperValidation {
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []
  const enforceCount = options.enforceQuestionCount !== false
  const enforceMarks = options.enforceMarks !== false
  const enforceVersion = options.enforceProfileVersion !== false

  if (paper.profileCode !== profile.code) {
    errors.push(
      issue(
        'profileCode',
        'PROFILE_CODE_MISMATCH',
        `Paper targets ${paper.profileCode} but the profile is ${profile.code}`,
      ),
    )
  }
  if (enforceVersion && paper.profileVersion !== profile.version) {
    errors.push(
      issue(
        'profileVersion',
        'PROFILE_VERSION_MISMATCH',
        `Paper targets version ${paper.profileVersion} but the profile is ${profile.version}`,
      ),
    )
  }
  if (paper.questions.length === 0) {
    if (!options.allowEmpty) {
      errors.push(issue('questions', 'EMPTY_PAPER', 'A paper must contain at least one question'))
    }
  }

  const seen = new Map<string, number>()
  const questionsBySection = new Map<string, ExamQuestion[]>()

  for (const [index, question] of paper.questions.entries()) {
    const path = `questions[${index}]`
    if (seen.has(question.id)) {
      errors.push(
        issue(path, 'DUPLICATE_QUESTION_ID', `Question id "${question.id}" is duplicated (first at questions[${seen.get(question.id)}])`),
      )
    } else {
      seen.set(question.id, index)
    }

    const node = findSectionNode(profile, question.sectionId)
    if (!node) {
      errors.push(
        issue(
          `${path}.sectionId`,
          'UNKNOWN_SECTION',
          `Question "${question.id}" references unknown section "${question.sectionId}"`,
        ),
      )
      continue
    }
    if (!node.isLeaf) {
      errors.push(
        issue(
          `${path}.sectionId`,
          'SECTION_NOT_LEAF',
          `Question "${question.id}" must reference a leaf section; "${question.sectionId}" is a group`,
        ),
      )
      continue
    }

    const section = node.section
    if (!profile.questionTypes.includes(question.responseType)) {
      errors.push(
        issue(
          `${path}.responseType`,
          'UNSUPPORTED_RESPONSE_TYPE',
          `Response type "${question.responseType}" is not supported by ${profile.code}`,
        ),
      )
    }
    if (!sectionAllowsResponseType(section, question.responseType)) {
      errors.push(
        issue(
          `${path}.responseType`,
          'RESPONSE_TYPE_NOT_ALLOWED',
          `Section "${section.id}" does not allow ${question.responseType} questions`,
        ),
      )
    }

    const allowedMarks = sectionAllowedMarks(section, question.responseType)
    if (!allowedMarks.includes(question.marks)) {
      errors.push(
        issue(
          `${path}.marks`,
          'QUESTION_MARKS_NOT_ALLOWED',
          `Section "${section.id}" allows ${allowedMarks.join('/')}-mark ${question.responseType} questions, received ${question.marks}`,
        ),
      )
    }

    if (question.presentationType) {
      if (!profile.presentationTypes.includes(question.presentationType)) {
        errors.push(
          issue(
            `${path}.presentationType`,
            'PRESENTATION_TYPE_NOT_ALLOWED',
            `Presentation type "${question.presentationType}" is not supported by the profile`,
          ),
        )
      } else {
        const allowedPresentation = sectionAllowedPresentationTypes(
          profile,
          section,
          question.responseType,
        )
        if (!allowedPresentation.includes(question.presentationType)) {
          errors.push(
            issue(
              `${path}.presentationType`,
              'PRESENTATION_TYPE_NOT_ALLOWED',
              `Section "${section.id}" does not allow "${question.presentationType}" for ${question.responseType} questions`,
            ),
          )
        }
      }
    }

    if (answeredKeyMissing(question)) {
      errors.push(
        issue(
          path,
          'MISSING_ANSWER_KEY',
          `Question "${question.id}" has no valid answer key for ${question.responseType}`,
        ),
      )
    }
    if (question.responseType === 'multiple' && question.correctOptionIds) {
      if (
        question.correctOptionIds.some(
          (optionId) => typeof optionId !== 'string' || optionId.trim() === '',
        )
      ) {
        errors.push(
          issue(path, 'INVALID_ANSWER_KEY', `Question "${question.id}" has an empty correct option id`),
        )
      }
      if (
        new Set(question.correctOptionIds.map((id) => id.trim())).size !==
        question.correctOptionIds.length
      ) {
        errors.push(
          issue(path, 'INVALID_ANSWER_KEY', `Question "${question.id}" has duplicate correct option ids`),
        )
      }
    }
    if (question.numericAnswer) {
      const tolerance = question.numericAnswer.tolerance
      if (tolerance !== undefined && tolerance < 0) {
        errors.push(
          issue(`${path}.numericAnswer.tolerance`, 'INVALID_ANSWER_KEY', 'Numeric tolerance cannot be negative'),
        )
      }
      const precision = question.numericAnswer.precision
      if (
        precision !== undefined &&
        (!Number.isInteger(precision) || precision < 0 || precision > 6)
      ) {
        errors.push(
          issue(
            `${path}.numericAnswer.precision`,
            'INVALID_ANSWER_KEY',
            'Numeric precision must be an integer between 0 and 6',
          ),
        )
      }
    }

    const list = questionsBySection.get(question.sectionId) ?? []
    list.push(question)
    questionsBySection.set(question.sectionId, list)
  }

  if (enforceCount) {
    for (const node of getSectionNodes(profile)) {
      if (node.section.questionCount === null) continue
      const leaves = descendantLeafIds(node.section)
      const actual = leaves.reduce(
        (sum, leafId) => sum + (questionsBySection.get(leafId)?.length ?? 0),
        0,
      )
      if (actual !== node.section.questionCount) {
        errors.push(
          issue(
            `sections.${node.section.id}`,
            'SECTION_QUESTION_COUNT_MISMATCH',
            `Section "${node.section.id}" expects ${node.section.questionCount} questions, received ${actual}`,
          ),
        )
      }
    }
    if (paper.questions.length !== profile.totalQuestions) {
      errors.push(
        issue(
          'questions',
          'TOTAL_QUESTION_COUNT_MISMATCH',
          `Profile ${profile.code} expects ${profile.totalQuestions} questions, received ${paper.questions.length}`,
        ),
      )
    }
  }

  if (enforceMarks) {
    for (const node of getLeafSections(profile)) {
      const questions = questionsBySection.get(node.section.id) ?? []
      const actual = questions.reduce((sum, question) => sum + question.marks, 0)
      if (actual !== node.section.marks) {
        errors.push(
          issue(
            `sections.${node.section.id}`,
            'SECTION_MARKS_MISMATCH',
            `Section "${node.section.id}" expects ${node.section.marks} marks, received ${actual}`,
          ),
        )
      }
    }
    const totalMarks = paper.questions.reduce((sum, question) => sum + question.marks, 0)
    if (totalMarks !== profile.totalMarks) {
      errors.push(
        issue(
          'questions',
          'TOTAL_MARKS_MISMATCH',
          `Profile ${profile.code} expects ${profile.totalMarks} marks, received ${totalMarks}`,
        ),
      )
    }
  }

  if (paper.questions.length > 0 && questionsBySection.size === 0) {
    warnings.push(
      issue('questions', 'NO_VALID_SECTIONS', 'No question could be mapped to a valid leaf section'),
    )
  }

  return { ok: errors.length === 0, errors, warnings }
}

export class ExamPaperValidationError extends Error {
  readonly issues: ValidationIssue[]

  constructor(message: string, issues: ValidationIssue[]) {
    super(`${message}: ${issues.map((i) => `${i.path} (${i.code}) ${i.message}`).join('; ')}`)
    this.name = 'ExamPaperValidationError'
    this.issues = issues
  }
}

export function assertValidExamPaper(
  profile: ExamProfile,
  paper: ExamPaper,
  options: PaperValidationOptions = {},
): void {
  const validation = validateExamPaper(profile, paper, options)
  if (!validation.ok) {
    throw new ExamPaperValidationError('Invalid examination paper', validation.errors)
  }
}
