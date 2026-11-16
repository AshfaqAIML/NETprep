/**
 * Runtime shape validation for examination profiles.
 *
 * Semantic rules (totals must add up, ids must be unique, marks must be
 * achievable) live in `validate.ts`. This file only guarantees the structure is
 * safe to read before semantic checks run.
 */

import { z } from 'zod'
import type { ExamSection } from './types'

const languageCode = z.enum(['en', 'hi'])
const responseType = z.enum(['single', 'multiple', 'numeric'])
const presentationType = z.enum([
  'text',
  'passage',
  'table',
  'diagram',
  'code',
  'mathematical',
  'data-interpretation',
])
const sectionKind = z.enum([
  'paper',
  'general-aptitude',
  'subject',
  'engineering-mathematics',
  'subject-core',
  'custom',
])

export const rationalSchema = z
  .object({
    numerator: z.number().int().min(0),
    denominator: z.number().int().positive(),
  })
  .strict()

export const questionRuleSchema = z
  .object({
    responseType,
    marks: z.number().int().positive(),
    count: z.number().int().positive().optional(),
    presentationTypes: z.array(presentationType).min(1).optional(),
  })
  .strict()

export const sectionLanguageSchema = z
  .object({
    default: languageCode,
    available: z.array(languageCode).min(1),
  })
  .strict()

export const examSectionSchema: z.ZodType<ExamSection> = z.lazy(() =>
  z
    .object({
      id: z.string().min(1),
      code: z.string().min(1),
      name: z.string().min(1),
      kind: sectionKind,
      order: z.number().int().min(0),
      questionCount: z.number().int().positive().nullable(),
      marks: z.number().int().positive(),
      questionRules: z.array(questionRuleSchema),
      children: z.array(examSectionSchema).min(1).optional(),
      selection: z
        .object({
          difficulty: z
            .object({
              easy: z.number().min(0).max(100).optional(),
              medium: z.number().min(0).max(100).optional(),
              hard: z.number().min(0).max(100).optional(),
            })
            .strict()
            .optional(),
          tags: z.array(z.string()).optional(),
          topicIds: z.array(z.string()).optional(),
          maxQuestionsPerTopic: z.number().int().positive().nullable().optional(),
        })
        .strict()
        .optional(),
      timing: z
        .object({
          durationMinutes: z.number().int().positive().nullable(),
          lockAfterExpiry: z.boolean(),
        })
        .strict()
        .optional(),
      language: sectionLanguageSchema.optional(),
      instructions: z.array(z.string()).optional(),
    })
    .strict(),
)

export const negativeMarkingSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('none') }).strict(),
  z
    .object({
      mode: z.literal('fraction-of-question-marks'),
      fraction: rationalSchema,
    })
    .strict(),
])

export const markingSchemeSchema = z
  .object({
    correct: z.literal('full-marks'),
    incorrect: z
      .object({
        single: negativeMarkingSchema,
        multiple: z
          .object({
            mode: z.literal('none'),
            partialMarking: z.literal(false),
            requiresExactMatch: z.literal(true),
          })
          .strict(),
        numeric: z
          .object({
            mode: z.literal('none'),
            partialMarking: z.literal(false),
          })
          .strict(),
      })
      .strict(),
    numeric: z
      .object({
        precision: z.number().int().min(0).max(6),
        defaultTolerance: z.number().min(0),
        toleranceMode: z.enum(['absolute', 'relative', 'none']),
      })
      .strict(),
    droppedQuestion: z.enum(['award-all', 'award-attempted', 'none']),
  })
  .strict()

export const languageSchema = z
  .object({
    default: languageCode,
    available: z.array(languageCode).min(1),
    bilingual: z.boolean(),
    fallback: languageCode,
    note: z.string().optional(),
  })
  .strict()

export const navigationSchema = z
  .object({
    allowBackwardNavigation: z.boolean(),
    allowSectionSwitching: z.boolean(),
    allowReviewMarking: z.boolean(),
    allowAnswerChange: z.boolean(),
    autoSubmitOnExpiry: z.boolean(),
    sectionLocking: z.enum(['none', 'sequential']),
    showQuestionPalette: z.boolean(),
    showSectionTimer: z.boolean(),
    questionOrder: z.enum(['fixed', 'randomized']),
    optionOrder: z.enum(['fixed', 'randomized']),
    calculator: z.enum(['none', 'virtual']),
  })
  .strict()

export const resultConfigSchema = z
  .object({
    roundingDecimals: z.number().int().min(0).max(6),
    clampTotalToZero: z.boolean(),
    includeSectionBreakdown: z.boolean(),
    includeQuestionBreakdown: z.boolean(),
    accuracyBasis: z.enum(['attempted', 'total']),
    showNegativePenalty: z.boolean(),
  })
  .strict()

export const selectionPolicySchema = z
  .object({
    mode: z.literal('blueprint'),
    allowQuestionReuse: z.boolean(),
    requireVerifiedQuestions: z.boolean(),
    allowedDifficulties: z.array(z.enum(['easy', 'medium', 'hard'])).min(1),
    maxQuestionsPerTopic: z.number().int().positive().nullable(),
  })
  .strict()

export const sourceReferenceSchema = z
  .object({
    title: z.string().min(1),
    url: z.string().url(),
    authority: z.enum(['NTA', 'IIT_MADRAS']),
    documentType: z.enum(['information-bulletin', 'pattern', 'syllabus', 'faq', 'other']),
    retrievedAt: z.string().min(1),
  })
  .strict()

export const examProfileSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    id: z.string().min(1),
    code: z.string().min(1),
    family: z.enum(['UGC_NET', 'GATE']),
    authority: z.enum(['NTA', 'IIT_MADRAS']),
    name: z.string().min(1),
    shortName: z.string().min(1),
    subjectCode: z.string().min(1).nullable(),
    subjectName: z.string().min(1).nullable(),
    examYear: z.number().int().min(2000).max(2100),
    session: z.string().min(1).nullable(),
    version: z.string().min(1),
    status: z.enum(['draft', 'published', 'retired']),
    publishedAt: z.string().min(1).nullable(),
    effectiveFrom: z.string().min(1).nullable(),
    effectiveTo: z.string().min(1).nullable(),
    supersedes: z.string().min(1).nullable(),
    durationMinutes: z.number().int().positive(),
    totalQuestions: z.number().int().positive(),
    totalMarks: z.number().int().positive(),
    questionTypes: z.array(responseType).min(1),
    presentationTypes: z.array(presentationType).min(1),
    sections: z.array(examSectionSchema).min(1),
    marking: markingSchemeSchema,
    language: languageSchema,
    navigation: navigationSchema,
    result: resultConfigSchema,
    selection: selectionPolicySchema,
    instructions: z.array(z.string()),
    sources: z.array(sourceReferenceSchema),
    metadata: z
      .record(
        z.string(),
        z.union([z.string(), z.number(), z.boolean(), z.null()]),
      )
      .optional(),
  })
  .strict()
