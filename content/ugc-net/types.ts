/**
 * Typed format for the NETPrep UGC-NET original practice bank.
 *
 * Every question is authored for NETPrep. The bank never claims to reproduce
 * an official previous-year paper. `verification` is mandatory for questions
 * whose answer depends on a calculation, executable code, SQL, an automaton,
 * a graph or a Boolean circuit; `scripts/validate-ugc-bank.ts` independently
 * re-computes those answers before content can enter the review queue.
 */

export type UgcPaper = 'I' | 'II'
export type UgcDifficulty = 'easy' | 'medium' | 'hard'
export type UgcCognitiveSkill =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyse'
  | 'evaluate'
  | 'create'
export type UgcQuestionType =
  | 'mcq'
  | 'assertion-reason'
  | 'match'
  | 'sequence'
  | 'case-based'
export type UgcPresentationType =
  | 'text'
  | 'passage'
  | 'table'
  | 'diagram'
  | 'code'
  | 'mathematical'
  | 'data-interpretation'

export interface UgcOptions {
  A: string
  B: string
  C: string
  D: string
}

/**
 * Independent answer verification.
 *
 * math     Evaluate `expression` and compare with `expected`.
 * code     Execute JavaScript or Python and compare stdout with `expectedOutput`.
 * sql      Create `schema` in an in-memory SQLite database, run `query`, and
 *          compare the returned rows with `expectedRows` (order-insensitive).
 * dfa      Validate the transition table and run every acceptance test.
 * graph    Recompute the requested property with an independent implementation.
 * boolean  Evaluate the expression for every assignment in `expectedTruthTable`.
 */
export type UgcVerification = {
  note?: string
  /** Optional normalized string that must occur in the correct option. */
  answerMatch?: string
} & (
  | {
      kind: 'math'
      expression: string
      expected: number
      tolerance?: number
    }
  | {
      kind: 'code'
      language: 'javascript' | 'python'
      code: string
      expectedOutput: string
    }
  | {
      kind: 'sql'
      schema: string
      query: string
      expectedRows: Array<Record<string, string | number | null>>
    }
  | {
      kind: 'dfa'
      states: string[]
      alphabet: string[]
      start: string
      accept: string[]
      transitions: Record<string, Record<string, string>>
      tests: Array<{ input: string; accepted: boolean }>
    }
  | {
      kind: 'graph'
      directed?: boolean
      vertices: string[]
      edges: Array<{ from: string; to: string; weight?: number }>
      check:
        | { type: 'mst-weight'; expected: number }
        | { type: 'shortest-path'; from: string; to: string; expected: number }
        | { type: 'connected'; expected: boolean }
        | { type: 'acyclic'; expected: boolean }
        | { type: 'bipartite'; expected: boolean }
    }
  | {
      kind: 'boolean'
      expression: string
      variables: string[]
      expectedTruthTable: Array<{
        assignment: Record<string, boolean>
        value: boolean
      }>
    }
)

export interface UgcQuestion {
  /** Stable identifier, e.g. UGC-P1-U01-101. Never reused. */
  code: string
  examName: 'UGC NET'
  subject: 'General Paper I' | 'Computer Science & Applications'
  paper: UgcPaper
  /** Official syllabus unit code, e.g. P1-U01. */
  unit: string
  unitName: string
  topic: string
  subtopic: string
  questionType: UgcQuestionType
  responseType: 'single'
  marks: 2
  difficulty: UgcDifficulty
  cognitiveSkill: UgcCognitiveSkill
  presentationType: UgcPresentationType
  passage?: string
  tableMarkdown?: string
  codeSnippet?: string
  imageUrl?: string
  questionText: string
  options: UgcOptions
  correctAnswer: keyof UgcOptions
  explanation: string
  source: 'NETPrep original practice bank'
  sourceType: 'practice'
  sourceUrl?: string
  /** Short statement of how the question and answer were checked. */
  provenance: string
  verification?: UgcVerification
  tags: string[]
  learningObjective: string
  /** Editorial batch label, e.g. P1-U01-B1. */
  batch: string
}
