import type { UgcPaper } from './types'

/**
 * Coverage plan for the original UGC-NET practice bank.
 *
 * `existing` is the number of published single-response questions already in
 * the database when the expansion began. `newCount` is the number of original
 * questions authored in this bank to bring every official unit to at least 40.
 * The importer re-checks the live database and refuses to publish a unit that
 * does not reach `targetTotal` after review.
 */
export interface UgcBankUnit {
  code: string
  paper: UgcPaper
  name: string
  shortName: string
  subject: 'General Paper I' | 'Computer Science & Applications'
  /** Editorial Unit name used by the existing Topic hierarchy. */
  legacyUnit: string
  /** Existing published single-response questions at expansion start. */
  existing: number
  /** Original questions authored in this bank. */
  newCount: number
  targetTotal: number
  /** Topic areas that the new batch must cover. */
  coverage: string[]
  /** Directory and file prefix, e.g. paper-1/u01. */
  filePrefix: string
}

export const UGC_BANK_UNITS: readonly UgcBankUnit[] = [
  {
    code: 'P1-U01',
    paper: 'I',
    name: 'Teaching Aptitude',
    shortName: 'Teaching Aptitude',
    subject: 'General Paper I',
    legacyUnit: 'Teaching Aptitude',
    existing: 11,
    newCount: 29,
    targetTotal: 40,
    coverage: [
      'nature, objectives and characteristics of teaching',
      'learner characteristics and learning styles',
      'factors affecting teaching',
      'teaching methods and approaches',
      'teaching aids and classroom assessment',
      'evaluation systems and feedback',
    ],
    filePrefix: 'paper-1/u01',
  },
  {
    code: 'P1-U02',
    paper: 'I',
    name: 'Research Aptitude',
    shortName: 'Research Aptitude',
    subject: 'General Paper I',
    legacyUnit: 'Research Aptitude',
    existing: 10,
    newCount: 30,
    targetTotal: 40,
    coverage: [
      'meaning, types and characteristics of research',
      'research process and problem formulation',
      'hypothesis, variables and sampling',
      'qualitative and quantitative methods',
      'thesis and research-paper writing',
      'research ethics, plagiarism and ICT in research',
    ],
    filePrefix: 'paper-1/u02',
  },
  {
    code: 'P1-U03',
    paper: 'I',
    name: 'Comprehension',
    shortName: 'Comprehension',
    subject: 'General Paper I',
    legacyUnit: 'Reading Comprehension',
    existing: 5,
    newCount: 35,
    targetTotal: 40,
    coverage: [
      'main idea and central argument',
      'explicit detail and inference',
      'tone, attitude and author purpose',
      'vocabulary in context',
      'passage structure and coherence',
      'multi-paragraph synthesis',
    ],
    filePrefix: 'paper-1/u03',
  },
  {
    code: 'P1-U04',
    paper: 'I',
    name: 'Communication',
    shortName: 'Communication',
    subject: 'General Paper I',
    legacyUnit: 'Communication',
    existing: 7,
    newCount: 33,
    targetTotal: 40,
    coverage: [
      'meaning, process and elements of communication',
      'verbal, non-verbal and interpersonal communication',
      'classroom communication',
      'barriers and effective communication',
      'mass media and mass communication',
      'communication models and theories',
    ],
    filePrefix: 'paper-1/u04',
  },
  {
    code: 'P1-U05',
    paper: 'I',
    name: 'Mathematical Reasoning and Aptitude',
    shortName: 'Mathematical Reasoning',
    subject: 'General Paper I',
    legacyUnit: 'Mathematical Reasoning & Aptitude',
    existing: 5,
    newCount: 35,
    targetTotal: 40,
    coverage: [
      'number series and patterns',
      'coding-decoding and symbolic operations',
      'blood relations and direction sense',
      'ratios, percentages and averages',
      'time, speed, work and mixtures',
      'counting, probability and mathematical puzzles',
    ],
    filePrefix: 'paper-1/u05',
  },
  {
    code: 'P1-U06',
    paper: 'I',
    name: 'Logical Reasoning',
    shortName: 'Logical Reasoning',
    subject: 'General Paper I',
    legacyUnit: 'Logical Reasoning',
    existing: 8,
    newCount: 32,
    targetTotal: 40,
    coverage: [
      'argument structure, premises and conclusions',
      'deductive and inductive reasoning',
      'analogies and classification',
      'syllogism and Venn diagrams',
      'Indian logic and pramanas',
      'fallacies and critical thinking',
    ],
    filePrefix: 'paper-1/u06',
  },
  {
    code: 'P1-U07',
    paper: 'I',
    name: 'Data Interpretation',
    shortName: 'Data Interpretation',
    subject: 'General Paper I',
    legacyUnit: 'Data Interpretation',
    existing: 5,
    newCount: 35,
    targetTotal: 40,
    coverage: [
      'data sources and data acquisition',
      'quantitative and qualitative data',
      'table interpretation',
      'bar charts and pie charts',
      'line graphs and mixed charts',
      'trend analysis and data-based decisions',
    ],
    filePrefix: 'paper-1/u07',
  },
  {
    code: 'P1-U08',
    paper: 'I',
    name: 'Information and Communication Technology',
    shortName: 'ICT',
    subject: 'General Paper I',
    legacyUnit: 'Information & Communication Technology (ICT)',
    existing: 5,
    newCount: 35,
    targetTotal: 40,
    coverage: [
      'computer fundamentals and number systems',
      'internet, web and search',
      'ICT in teaching, learning and evaluation',
      'cloud computing and digital resources',
      'information security and cyber ethics',
      'emerging technologies and digital governance',
    ],
    filePrefix: 'paper-1/u08',
  },
  {
    code: 'P1-U09',
    paper: 'I',
    name: 'People, Development and Environment',
    shortName: 'People & Environment',
    subject: 'General Paper I',
    legacyUnit: 'People, Development & Environment',
    existing: 5,
    newCount: 35,
    targetTotal: 40,
    coverage: [
      'development and environment',
      'ecosystems, biodiversity and conservation',
      'pollution and waste management',
      'climate change and global initiatives',
      'sustainable development goals',
      'environmental ethics and disaster management',
    ],
    filePrefix: 'paper-1/u09',
  },
  {
    code: 'P1-U10',
    paper: 'I',
    name: 'Higher Education System',
    shortName: 'Higher Education',
    subject: 'General Paper I',
    legacyUnit: 'Higher Education System',
    existing: 5,
    newCount: 35,
    targetTotal: 40,
    coverage: [
      'institutions of higher education',
      'governance, funding and regulation',
      'professional, technical and vocational education',
      'commissions, policies and committees',
      'value education, ethics and skill development',
      'quality assurance and internationalisation',
    ],
    filePrefix: 'paper-1/u10',
  },
  {
    code: 'P2-U01',
    paper: 'II',
    name: 'Discrete Structures and Optimization',
    shortName: 'Discrete Structures',
    subject: 'Computer Science & Applications',
    legacyUnit: 'Discrete Structures & Optimization',
    existing: 10,
    newCount: 30,
    targetTotal: 40,
    coverage: [
      'sets, relations and functions',
      'propositional and predicate logic',
      'combinatorics and recurrence relations',
      'group theory and algebraic structures',
      'lattices and Boolean algebra',
      'graph theory and optimisation',
    ],
    filePrefix: 'paper-2/u01',
  },
  {
    code: 'P2-U02',
    paper: 'II',
    name: 'Computer System Architecture',
    shortName: 'Computer Architecture',
    subject: 'Computer Science & Applications',
    legacyUnit: 'Computer Organization & Architecture',
    existing: 11,
    newCount: 29,
    targetTotal: 40,
    coverage: [
      'digital logic and Boolean circuits',
      'combinational and sequential circuits',
      'instruction formats and addressing modes',
      'ALU, datapath and control unit',
      'pipelining and instruction-level parallelism',
      'memory hierarchy, cache and I/O organisation',
    ],
    filePrefix: 'paper-2/u02',
  },
  {
    code: 'P2-U03',
    paper: 'II',
    name: 'Programming Languages and Computer Graphics',
    shortName: 'Programming & Graphics',
    subject: 'Computer Science & Applications',
    legacyUnit: 'Programming & Data Structures',
    existing: 10,
    newCount: 30,
    targetTotal: 40,
    coverage: [
      'programming paradigms and language translation',
      'C/C++ semantics and recursion',
      'object-oriented concepts',
      'graphics primitives and line/circle algorithms',
      '2D and 3D transformations',
      'clipping, projection and rendering concepts',
    ],
    filePrefix: 'paper-2/u03',
  },
  {
    code: 'P2-U04',
    paper: 'II',
    name: 'Database Management Systems',
    shortName: 'DBMS',
    subject: 'Computer Science & Applications',
    legacyUnit: 'Database Management Systems',
    existing: 13,
    newCount: 27,
    targetTotal: 40,
    coverage: [
      'ER model and relational model',
      'relational algebra and calculus',
      'SQL queries and constraints',
      'normalisation and functional dependencies',
      'transactions, concurrency and recovery',
      'indexing, query processing, warehousing and data mining',
    ],
    filePrefix: 'paper-2/u04',
  },
  {
    code: 'P2-U05',
    paper: 'II',
    name: 'System Software and Operating System',
    shortName: 'System Software & OS',
    subject: 'Computer Science & Applications',
    legacyUnit: 'Operating Systems',
    existing: 15,
    newCount: 25,
    targetTotal: 40,
    coverage: [
      'assemblers, loaders and linkers',
      'processes, threads and scheduling',
      'synchronisation and deadlocks',
      'memory management and paging',
      'virtual memory and page replacement',
      'file systems, disk scheduling and I/O',
    ],
    filePrefix: 'paper-2/u05',
  },
  {
    code: 'P2-U06',
    paper: 'II',
    name: 'Software Engineering',
    shortName: 'Software Engineering',
    subject: 'Computer Science & Applications',
    legacyUnit: 'Software Engineering',
    existing: 10,
    newCount: 30,
    targetTotal: 40,
    coverage: [
      'software process and SDLC models',
      'requirements engineering',
      'software design and architecture',
      'testing and quality assurance',
      'estimation, metrics and project management',
      'maintenance, configuration management and risk',
    ],
    filePrefix: 'paper-2/u06',
  },
  {
    code: 'P2-U07',
    paper: 'II',
    name: 'Data Structures and Algorithms',
    shortName: 'Data Structures & Algorithms',
    subject: 'Computer Science & Applications',
    legacyUnit: 'Algorithms',
    existing: 17,
    newCount: 23,
    targetTotal: 40,
    coverage: [
      'arrays, stacks, queues and linked lists',
      'trees, heaps and balanced trees',
      'graphs and traversal',
      'hashing and collision resolution',
      'sorting, searching and selection',
      'complexity analysis and algorithm design',
    ],
    filePrefix: 'paper-2/u07',
  },
  {
    code: 'P2-U08',
    paper: 'II',
    name: 'Theory of Computation and Compilers',
    shortName: 'Theory of Computation',
    subject: 'Computer Science & Applications',
    legacyUnit: 'Theory of Computation',
    existing: 11,
    newCount: 29,
    targetTotal: 40,
    coverage: [
      'finite automata and regular languages',
      'regular expressions and pumping lemma',
      'context-free grammars and pushdown automata',
      'Turing machines and decidability',
      'lexical analysis and parsing',
      'syntax-directed translation and code generation',
    ],
    filePrefix: 'paper-2/u08',
  },
  {
    code: 'P2-U09',
    paper: 'II',
    name: 'Data Communication and Computer Networks',
    shortName: 'Computer Networks',
    subject: 'Computer Science & Applications',
    legacyUnit: 'Computer Networks',
    existing: 12,
    newCount: 28,
    targetTotal: 40,
    coverage: [
      'network architecture, OSI and TCP/IP',
      'physical and data-link layers',
      'MAC, switching and LAN technologies',
      'IP addressing, routing and congestion control',
      'transport protocols and application protocols',
      'network security and web technologies',
    ],
    filePrefix: 'paper-2/u09',
  },
  {
    code: 'P2-U10',
    paper: 'II',
    name: 'Artificial Intelligence',
    shortName: 'Artificial Intelligence',
    subject: 'Computer Science & Applications',
    legacyUnit: 'Artificial Intelligence',
    existing: 10,
    newCount: 30,
    targetTotal: 40,
    coverage: [
      'intelligent agents and search algorithms',
      'heuristics and adversarial search',
      'knowledge representation and reasoning',
      'machine learning foundations',
      'neural networks and deep learning',
      'natural language processing and expert systems',
    ],
    filePrefix: 'paper-2/u10',
  },
] as const

export const UGC_BANK_BY_CODE: ReadonlyMap<string, UgcBankUnit> = new Map(
  UGC_BANK_UNITS.map((unit) => [unit.code, unit]),
)

/**
 * Minimum tag coverage for units whose syllabus explicitly demands a skill
 * that a pure text MCQ would not exercise. Tags are authored in each question.
 */
export const UGC_BANK_REQUIRED_TAGS: Record<
  string,
  Array<{ tag: string; min: number }>
> = {
  'P1-U03': [
    { tag: 'passage', min: 12 },
    { tag: 'inference', min: 4 },
    { tag: 'vocabulary', min: 3 },
  ],
  'P1-U05': [{ tag: 'calculation', min: 12 }],
  'P1-U07': [
    { tag: 'table', min: 8 },
    { tag: 'data-interpretation', min: 8 },
    { tag: 'calculation', min: 12 },
  ],
  'P2-U01': [
    { tag: 'graph', min: 5 },
    { tag: 'boolean', min: 2 },
    { tag: 'calculation', min: 8 },
  ],
  'P2-U02': [
    { tag: 'boolean', min: 3 },
    { tag: 'circuit', min: 2 },
    { tag: 'calculation', min: 6 },
  ],
  'P2-U04': [
    { tag: 'sql', min: 4 },
    { tag: 'calculation', min: 3 },
  ],
  'P2-U05': [{ tag: 'calculation', min: 5 }],
  'P2-U07': [
    { tag: 'code', min: 4 },
    { tag: 'calculation', min: 8 },
  ],
  'P2-U08': [
    { tag: 'automata', min: 5 },
    { tag: 'dfa', min: 2 },
    { tag: 'calculation', min: 4 },
  ],
  'P2-U09': [{ tag: 'calculation', min: 4 }],
  'P2-U10': [{ tag: 'calculation', min: 4 }],
}

export function ugcBankUnit(code: string): UgcBankUnit {
  const unit = UGC_BANK_BY_CODE.get(code)
  if (!unit) throw new Error(`Unknown UGC bank unit: ${code}`)
  return unit
}
