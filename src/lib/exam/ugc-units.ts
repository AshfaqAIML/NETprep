/**
 * Official UGC-NET syllabus units for Paper I and Paper II Computer Science.
 *
 * These codes are the stable join key between editorial content and the CBT
 * engine. Existing study-content units keep their own names; a question carries
 * the official syllabus unit separately so full papers and unit practice can be
 * assembled from the same bank without renaming the content hierarchy.
 */

import type { ExamLanguage } from './types'

export type UgcPaper = 'I' | 'II'

export interface UgcSyllabusUnit {
  /** Stable internal code, e.g. P1-U01. */
  code: string
  paper: UgcPaper
  /** 1-based position in the official syllabus. */
  order: number
  /** Official unit name. */
  name: string
  /** Short label for cards, tabs and result tables. */
  shortName: string
  description: string
}

export const UGC_PAPER_ONE_UNITS: readonly UgcSyllabusUnit[] = [
  {
    code: 'P1-U01',
    paper: 'I',
    order: 1,
    name: 'Teaching Aptitude',
    shortName: 'Teaching Aptitude',
    description:
      'Nature, objectives, characteristics and basic requirements of teaching; learner characteristics; factors affecting teaching; methods and evaluation systems.',
  },
  {
    code: 'P1-U02',
    paper: 'I',
    order: 2,
    name: 'Research Aptitude',
    shortName: 'Research Aptitude',
    description:
      'Meaning, characteristics, types, methods and steps of research; thesis and article writing; application of ICT in research; research ethics.',
  },
  {
    code: 'P1-U03',
    paper: 'I',
    order: 3,
    name: 'Comprehension',
    shortName: 'Comprehension',
    description:
      'Unseen passage-based comprehension: main idea, inference, tone, vocabulary in context and the author’s purpose.',
  },
  {
    code: 'P1-U04',
    paper: 'I',
    order: 4,
    name: 'Communication',
    shortName: 'Communication',
    description:
      'Meaning, types, characteristics and barriers to communication; effective classroom communication; mass media and mass communication.',
  },
  {
    code: 'P1-U05',
    paper: 'I',
    order: 5,
    name: 'Mathematical Reasoning and Aptitude',
    shortName: 'Mathematical Reasoning',
    description:
      'Number series, coding-decoding, blood relations, direction sense, mathematical puzzles and basic quantitative aptitude.',
  },
  {
    code: 'P1-U06',
    paper: 'I',
    order: 6,
    name: 'Logical Reasoning',
    shortName: 'Logical Reasoning',
    description:
      'Structure of arguments, deductive and inductive reasoning, analogies, Indian logic (pramanas) and fallacies.',
  },
  {
    code: 'P1-U07',
    paper: 'I',
    order: 7,
    name: 'Data Interpretation',
    shortName: 'Data Interpretation',
    description:
      'Sources and acquisition of data; quantitative and qualitative data; tables, bar charts, pie charts and line graphs.',
  },
  {
    code: 'P1-U08',
    paper: 'I',
    order: 8,
    name: 'Information and Communication Technology',
    shortName: 'ICT',
    description:
      'ICT basics, internet and web, cloud computing, ICT in education, security and emerging technologies.',
  },
  {
    code: 'P1-U09',
    paper: 'I',
    order: 9,
    name: 'People, Development and Environment',
    shortName: 'People & Environment',
    description:
      'Development and environment, ecological issues, pollution, climate change, sustainable development and environmental ethics.',
  },
  {
    code: 'P1-U10',
    paper: 'I',
    order: 10,
    name: 'Higher Education System',
    shortName: 'Higher Education',
    description:
      'Institutions of higher education, governance, professional education, policies and commissions, value and skill education.',
  },
] as const

export const UGC_PAPER_TWO_UNITS: readonly UgcSyllabusUnit[] = [
  {
    code: 'P2-U01',
    paper: 'II',
    order: 1,
    name: 'Discrete Structures and Optimization',
    shortName: 'Discrete Structures',
    description:
      'Sets, relations, functions, propositional and predicate logic, lattices, Boolean algebra, graph theory and optimisation.',
  },
  {
    code: 'P2-U02',
    paper: 'II',
    order: 2,
    name: 'Computer System Architecture',
    shortName: 'Computer Architecture',
    description:
      'Digital logic, machine instructions, addressing modes, ALU, control unit, pipelining, memory hierarchy and I/O organisation.',
  },
  {
    code: 'P2-U03',
    paper: 'II',
    order: 3,
    name: 'Programming Languages and Computer Graphics',
    shortName: 'Programming & Graphics',
    description:
      'Programming language concepts, C/C++ and object-oriented programming, and computer graphics primitives and transformations.',
  },
  {
    code: 'P2-U04',
    paper: 'II',
    order: 4,
    name: 'Database Management Systems',
    shortName: 'DBMS',
    description:
      'ER model, relational algebra, SQL, normalisation, transactions, concurrency control, indexing and recovery.',
  },
  {
    code: 'P2-U05',
    paper: 'II',
    order: 5,
    name: 'System Software and Operating System',
    shortName: 'System Software & OS',
    description:
      'Assemblers, loaders, linkers, process management, scheduling, deadlocks, memory management and file systems.',
  },
  {
    code: 'P2-U06',
    paper: 'II',
    order: 6,
    name: 'Software Engineering',
    shortName: 'Software Engineering',
    description:
      'SDLC models, requirements engineering, design, testing, metrics, estimation, project management and quality.',
  },
  {
    code: 'P2-U07',
    paper: 'II',
    order: 7,
    name: 'Data Structures and Algorithms',
    shortName: 'Data Structures & Algorithms',
    description:
      'Arrays, stacks, queues, linked lists, trees, graphs, hashing, sorting, searching and algorithm design techniques.',
  },
  {
    code: 'P2-U08',
    paper: 'II',
    order: 8,
    name: 'Theory of Computation and Compilers',
    shortName: 'Theory of Computation',
    description:
      'Automata, grammars, Turing machines, decidability, lexical analysis, parsing, syntax-directed translation and code generation.',
  },
  {
    code: 'P2-U09',
    paper: 'II',
    order: 9,
    name: 'Data Communication and Computer Networks',
    shortName: 'Computer Networks',
    description:
      'OSI and TCP/IP models, transmission media, data link control, routing, transport protocols, network security and web technologies.',
  },
  {
    code: 'P2-U10',
    paper: 'II',
    order: 10,
    name: 'Artificial Intelligence',
    shortName: 'Artificial Intelligence',
    description:
      'Search, knowledge representation, reasoning, machine learning, neural networks, NLP and expert systems.',
  },
] as const

export const UGC_SYLLABUS_UNITS: readonly UgcSyllabusUnit[] = [
  ...UGC_PAPER_ONE_UNITS,
  ...UGC_PAPER_TWO_UNITS,
] as const

export const UGC_UNIT_BY_CODE: ReadonlyMap<string, UgcSyllabusUnit> = new Map(
  UGC_SYLLABUS_UNITS.map((unit) => [unit.code, unit]),
)

export function ugcUnitsForPaper(paper: UgcPaper): readonly UgcSyllabusUnit[] {
  return paper === 'I' ? UGC_PAPER_ONE_UNITS : UGC_PAPER_TWO_UNITS
}

export function ugcUnitByCode(code: string | null | undefined): UgcSyllabusUnit | null {
  if (!code) return null
  return UGC_UNIT_BY_CODE.get(code) ?? null
}

export function ugcUnitName(code: string | null | undefined): string | null {
  return ugcUnitByCode(code)?.name ?? null
}

export function isUgcUnitCode(value: string | null | undefined): boolean {
  return typeof value === 'string' && UGC_UNIT_BY_CODE.has(value)
}

/** Questions per official unit in a complete Paper I / Paper II paper. */
export const UGC_FULL_PAPER_UNIT_QUESTION_COUNT: Record<UgcPaper, number> = {
  I: 5,
  II: 10,
}

/** Proportional share of the official combined session, used for unit practice. */
export function ugcPracticeDurationMinutes(questionCount: number): number {
  return Math.max(1, Math.round(questionCount * 1.2))
}

export function ugcLanguageLabel(language: ExamLanguage): string {
  return language === 'hi' ? 'हिंदी' : 'English'
}
