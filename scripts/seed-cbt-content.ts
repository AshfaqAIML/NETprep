/**
 * Seed the CBT practice bank with the questions required to assemble every
 * published examination profile.
 *
 * Run: bun scripts/seed-cbt-content.ts
 *
 * The seed is idempotent: each question has a stable fingerprint and is
 * updated in place when the script is run again.
 */

import { db } from '../src/lib/db'
import {
  UGC_FULL_PAPER_UNIT_QUESTION_COUNT,
  UGC_SYLLABUS_UNITS,
} from '../src/lib/exam/ugc-units'

type ResponseType = 'single' | 'multiple' | 'numeric'
type PresentationType =
  | 'text'
  | 'passage'
  | 'table'
  | 'diagram'
  | 'code'
  | 'mathematical'
  | 'data-interpretation'

interface SeedHindi {
  questionText: string
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  passage?: string
  codeSnippet?: string
  tableMarkdown?: string
  explanation?: string
}

interface SeedQuestion {
  key: string
  unit: string
  topic: string
  paper: 'I' | 'II'
  /** Official UGC syllabus unit code, e.g. P1-U03 or P2-U10. */
  syllabusUnit?: string
  responseType: ResponseType
  questionType: 'mcq' | 'msq' | 'nat'
  presentationType: PresentationType
  gateSection?: 'general-aptitude' | 'engineering-mathematics' | 'computer-science' | 'data-science-ai'
  questionText: string
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  correctAnswer?: string
  correctOptions?: string[]
  numericAnswer?: number
  numericTolerance?: number
  numericToleranceMode?: 'absolute' | 'relative' | 'none'
  numericPrecision?: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  passage?: string
  codeSnippet?: string
  tableMarkdown?: string
  imageUrl?: string
  tags?: string
  learningObjective?: string
  syllabusVersion?: string
  /** Reviewed Hindi presentation. Seeded only when the translation is final. */
  hindi?: SeedHindi
}

/**
 * Legacy editorial unit name -> official UGC syllabus unit code. The content
 * hierarchy keeps its own names; this map is the bridge used by the CBT engine.
 */
const UGC_UNIT_BY_LEGACY_NAME: Record<string, string> = {
  'Teaching Aptitude': 'P1-U01',
  'Research Aptitude': 'P1-U02',
  'Reading Comprehension': 'P1-U03',
  Communication: 'P1-U04',
  'Mathematical Reasoning & Aptitude': 'P1-U05',
  'Logical Reasoning': 'P1-U06',
  'Data Interpretation': 'P1-U07',
  'Information & Communication Technology (ICT)': 'P1-U08',
  'People, Development & Environment': 'P1-U09',
  'Higher Education System': 'P1-U10',
  'Discrete Structures & Optimization': 'P2-U01',
  'Digital Logic': 'P2-U02',
  'Computer Organization & Architecture': 'P2-U02',
  'Programming & Data Structures': 'P2-U03',
  'Computer Graphics': 'P2-U03',
  'Database Management Systems': 'P2-U04',
  'Operating Systems': 'P2-U05',
  'Software Engineering': 'P2-U06',
  Algorithms: 'P2-U07',
  'Theory of Computation': 'P2-U08',
  'Compiler Design': 'P2-U08',
  'Computer Networks': 'P2-U09',
  'Internet Technologies & Web Programming': 'P2-U09',
  'Artificial Intelligence': 'P2-U10',
}

const TRANSLATION_REVIEWED_AT = new Date('2026-11-16T00:00:00.000Z')

const questions: SeedQuestion[] = [
  // -------------------------------------------------------------------------
  // UGC NET Paper II Computer Science — nine single-choice questions
  // -------------------------------------------------------------------------
  {
    key: 'ugc-p2-4nf',
    unit: 'Database Management Systems',
    topic: 'ER Model & Normalization',
    paper: 'II',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText: 'A relation is in fourth normal form (4NF) if it is in 3NF and:',
    optionA: 'Every non-prime attribute is fully dependent on the primary key',
    optionB: 'There is no non-trivial multivalued dependency',
    optionC: 'Every determinant is a candidate key',
    optionD: 'There is no transitive dependency',
    correctAnswer: 'B',
    explanation:
      '4NF removes non-trivial multivalued dependencies (MVDs). Option C describes BCNF, and option D describes 3NF.',
    difficulty: 'medium',
    tags: 'dbms,normalization,4nf',
    learningObjective: 'Distinguish 4NF from 3NF and BCNF.',
    syllabusVersion: '2026',
  },
  {
    key: 'ugc-p2-fcfs-table',
    unit: 'Operating Systems',
    topic: 'Process Scheduling',
    paper: 'II',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'table',
    questionText:
      'Four processes arrive at time 0 with the burst times shown in the table. Using First-Come, First-Served (FCFS) scheduling, what is the average waiting time?',
    tableMarkdown:
      '| Process | Burst time (ms) |\n| --- | ---: |\n| P1 | 6 |\n| P2 | 3 |\n| P3 | 1 |\n| P4 | 4 |',
    optionA: '3.50 ms',
    optionB: '5.00 ms',
    optionC: '6.25 ms',
    optionD: '7.50 ms',
    correctAnswer: 'C',
    explanation:
      'The waiting times are 0, 6, 9 and 10 ms. Their sum is 25 ms, so the average is 25/4 = 6.25 ms.',
    difficulty: 'easy',
    tags: 'os,scheduling,fcfs',
    learningObjective: 'Compute average waiting time for FCFS scheduling.',
    syllabusVersion: '2026',
  },
  {
    key: 'ugc-p2-cidr-broadcast',
    unit: 'Computer Networks',
    topic: 'OSI vs TCP/IP',
    paper: 'II',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText: 'What is the directed broadcast address of the subnet 192.168.10.0/26?',
    optionA: '192.168.10.31',
    optionB: '192.168.10.63',
    optionC: '192.168.10.127',
    optionD: '192.168.10.255',
    correctAnswer: 'B',
    explanation:
      'A /26 prefix leaves 6 host bits, so each subnet contains 64 addresses. The first subnet runs from 192.168.10.0 to 192.168.10.63, making .63 its broadcast address.',
    difficulty: 'medium',
    tags: 'networks,subnetting,cidr',
    learningObjective: 'Calculate a subnet broadcast address from a CIDR prefix.',
    syllabusVersion: '2026',
  },
  {
    key: 'ugc-p2-master-theorem',
    unit: 'Algorithms',
    topic: 'Asymptotic Analysis',
    paper: 'II',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'mathematical',
    questionText: 'The recurrence $T(n) = 2T(n/2) + n\\log n$ has the asymptotic solution:',
    optionA: '$\\Theta(n)$',
    optionB: '$\\Theta(n\\log n)$',
    optionC: '$\\Theta(n\\log^2 n)$',
    optionD: '$\\Theta(n^2)$',
    correctAnswer: 'C',
    explanation:
      'This is the extended Master Theorem case where $f(n) = n\\log n = \\Theta(n^{\\log_2 2}\\log^1 n)$. Therefore $T(n) = \\Theta(n\\log^2 n)$.',
    difficulty: 'hard',
    tags: 'algorithms,recurrence,master-theorem',
    learningObjective: 'Apply the extended Master Theorem to a recurrence.',
    syllabusVersion: '2026',
  },
  {
    key: 'ugc-p2-dfa-ending-01',
    unit: 'Theory of Computation',
    topic: 'Finite Automata',
    paper: 'II',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText:
      'What is the minimum number of states in a deterministic finite automaton (DFA) that accepts all binary strings ending in 01?',
    optionA: '2',
    optionB: '3',
    optionC: '4',
    optionD: '5',
    correctAnswer: 'B',
    explanation:
      'Three states suffice: the start state, a state reached after seeing a 0, and an accepting state reached after seeing 01. A two-state DFA cannot remember both the last symbol and the preceding 0.',
    difficulty: 'medium',
    tags: 'toc,dfa,automata',
    learningObjective: 'Design a minimal DFA for a suffix language.',
    syllabusVersion: '2026',
  },
  {
    key: 'ugc-p2-immediate-addressing',
    unit: 'Computer Organization & Architecture',
    topic: 'Addressing Modes',
    paper: 'II',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText: 'In which addressing mode is the operand value encoded directly in the instruction?',
    optionA: 'Immediate addressing',
    optionB: 'Direct addressing',
    optionC: 'Indirect addressing',
    optionD: 'Indexed addressing',
    correctAnswer: 'A',
    explanation:
      'Immediate addressing places the operand itself in the instruction. Direct addressing stores the operand address, and indirect addressing stores the address of an address.',
    difficulty: 'easy',
    tags: 'coa,addressing-modes',
    learningObjective: 'Identify immediate addressing from its operand location.',
    syllabusVersion: '2026',
  },
  {
    key: 'ugc-p2-spiral-risk',
    unit: 'Software Engineering',
    topic: 'SDLC Models',
    paper: 'II',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText:
      'Which software process model is explicitly driven by risk analysis and is suitable for large, high-risk projects?',
    optionA: 'Waterfall model',
    optionB: 'Spiral model',
    optionC: 'Incremental model',
    optionD: 'Prototype model',
    correctAnswer: 'B',
    explanation:
      'Each spiral cycle begins with risk analysis and includes a risk-reduction prototype, making the spiral model suitable for large, high-risk systems.',
    difficulty: 'easy',
    tags: 'software-engineering,sdlc,spiral',
    learningObjective: 'Relate software process models to project risk.',
    syllabusVersion: '2026',
  },
  {
    key: 'ugc-p2-astar-admissible',
    unit: 'Artificial Intelligence',
    topic: 'Search Algorithms',
    paper: 'II',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText: 'A heuristic function $h(n)$ is admissible for A* search if:',
    optionA: '$h(n)$ never overestimates the true cost to reach the goal from $n$',
    optionB: '$h(n)$ always equals the true remaining cost',
    optionC: '$h(n)$ is always non-negative',
    optionD: '$h(n)$ is monotonic along every path',
    correctAnswer: 'A',
    explanation:
      'Admissibility requires $0 \\le h(n) \\le h^*(n)$, where $h^*(n)$ is the true optimal cost to the goal. Option D describes consistency, which is stronger than admissibility.',
    difficulty: 'medium',
    tags: 'ai,search,a-star,heuristics',
    learningObjective: 'Define an admissible heuristic for A* search.',
    syllabusVersion: '2026',
  },
  {
    key: 'ugc-p2-recursion-output',
    unit: 'Programming & Data Structures',
    topic: 'Pointers & Recursion',
    paper: 'II',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'code',
    questionText: 'What is the output of the following recursive C program?',
    codeSnippet:
      '#include <stdio.h>\n\nint f(int n) {\n    if (n <= 1) return 1;\n    return n * f(n - 1);\n}\n\nint main(void) {\n    printf("%d", f(4));\n    return 0;\n}',
    optionA: '6',
    optionB: '12',
    optionC: '24',
    optionD: '120',
    correctAnswer: 'C',
    explanation:
      'The function computes the factorial of n. f(4) = 4 x 3 x 2 x 1 = 24.',
    difficulty: 'easy',
    tags: 'programming,c,recursion',
    learningObjective: 'Trace a recursive function call.',
    syllabusVersion: '2026',
  },

  // -------------------------------------------------------------------------
  // GATE Engineering Mathematics — five questions (single, MSQ, NAT, diagram)
  // -------------------------------------------------------------------------
  {
    key: 'gate-em-complement-edges',
    unit: 'Discrete Structures & Optimization',
    topic: 'Core Concepts',
    paper: 'II',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'mathematical',
    gateSection: 'engineering-mathematics',
    questionText:
      'Let $G$ be a simple undirected graph with 6 vertices and 9 edges. How many edges are present in the complement of $G$?',
    optionA: '3',
    optionB: '6',
    optionC: '9',
    optionD: '15',
    correctAnswer: 'B',
    explanation:
      'A simple graph on 6 vertices has at most $\\binom{6}{2} = 15$ edges. The complement therefore contains $15 - 9 = 6$ edges.',
    difficulty: 'easy',
    tags: 'gate,engineering-mathematics,graph-theory',
    learningObjective: 'Relate a graph to its complement.',
    syllabusVersion: '2027',
  },
  {
    key: 'gate-em-tautology',
    unit: 'Discrete Structures & Optimization',
    topic: 'Core Concepts',
    paper: 'II',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'mathematical',
    gateSection: 'engineering-mathematics',
    questionText: 'Which one of the following propositional formulas is a tautology?',
    optionA: '$(P \\land Q) \\rightarrow P$',
    optionB: '$(P \\rightarrow Q) \\rightarrow (Q \\rightarrow P)$',
    optionC: '$P \\leftrightarrow \\neg P$',
    optionD: '$(P \\lor Q) \\rightarrow P$',
    correctAnswer: 'A',
    explanation:
      'If $P \\land Q$ is true, then $P$ is true, so the implication is always true. The other formulas are false for at least one assignment: B fails for P false and Q true, C is always false, and D fails for P false and Q true.',
    difficulty: 'medium',
    tags: 'gate,engineering-mathematics,logic',
    learningObjective: 'Identify a tautology by truth-table reasoning.',
    syllabusVersion: '2027',
  },
  {
    key: 'gate-em-relation-msq',
    unit: 'Discrete Structures & Optimization',
    topic: 'Core Concepts',
    paper: 'II',
    responseType: 'multiple',
    questionType: 'msq',
    presentationType: 'mathematical',
    gateSection: 'engineering-mathematics',
    questionText:
      'Let $R$ be a binary relation on a non-empty finite set $A$. Which of the following statements are TRUE?',
    optionA: 'If $R$ is symmetric and transitive, then $R$ is reflexive.',
    optionB: 'If $R$ is an equivalence relation, then $R$ is reflexive, symmetric and transitive.',
    optionC: 'The composition of two symmetric relations on $A$ is always symmetric.',
    optionD: 'If $R$ is antisymmetric, then $R \\cap R^{-1}$ is contained in the identity relation.',
    correctOptions: ['B', 'D'],
    explanation:
      'An equivalence relation is reflexive, symmetric and transitive by definition. If R is antisymmetric and (x, y) is in both R and R inverse, then x = y, so the intersection lies in the identity relation. A is false because a symmetric and transitive relation need not be reflexive. C is false because composition of symmetric relations need not be symmetric.',
    difficulty: 'hard',
    tags: 'gate,engineering-mathematics,relations,msq',
    learningObjective: 'Reason about relation properties and composition.',
    syllabusVersion: '2027',
  },
  {
    key: 'gate-em-k4-spanning-trees',
    unit: 'Discrete Structures & Optimization',
    topic: 'Core Concepts',
    paper: 'II',
    responseType: 'numeric',
    questionType: 'nat',
    presentationType: 'mathematical',
    gateSection: 'engineering-mathematics',
    questionText:
      'The number of distinct spanning trees of the complete graph $K_4$ is ______.',
    numericAnswer: 16,
    numericTolerance: 0,
    numericToleranceMode: 'none',
    numericPrecision: 0,
    explanation:
      "Cayley's formula states that the complete graph $K_n$ has $n^{n-2}$ spanning trees. For $n = 4$, this is $4^{2} = 16$.",
    difficulty: 'medium',
    tags: 'gate,engineering-mathematics,spanning-trees,nat',
    learningObjective: 'Apply Cayley’s formula for spanning trees.',
    syllabusVersion: '2027',
  },
  {
    key: 'gate-em-poset-lub',
    unit: 'Discrete Structures & Optimization',
    topic: 'Core Concepts',
    paper: 'II',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'diagram',
    gateSection: 'engineering-mathematics',
    questionText:
      'The Hasse diagram of a partially ordered set $(P, \\le)$ is shown. What is the least upper bound of the elements $b$ and $c$?',
    imageUrl: '/cbt/em-poset.svg',
    optionA: '$a$',
    optionB: '$b$',
    optionC: '$c$',
    optionD: '$d$',
    correctAnswer: 'D',
    explanation:
      'The upper bounds of b and c are d and e. Since d is below e, the least upper bound is d.',
    difficulty: 'medium',
    tags: 'gate,engineering-mathematics,poset,hasse-diagram',
    learningObjective: 'Read a least upper bound from a Hasse diagram.',
    syllabusVersion: '2027',
  },

  // -------------------------------------------------------------------------
  // GATE Computer Science — five questions (code, MSQ, NAT, table, diagram)
  // -------------------------------------------------------------------------
  {
    key: 'gate-cs-static-output',
    unit: 'Programming & Data Structures',
    topic: 'Pointers & Recursion',
    paper: 'II',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'code',
    gateSection: 'computer-science',
    questionText: 'What is the output of the following C program?',
    codeSnippet:
      '#include <stdio.h>\n\nint f(int n) {\n    static int x = 0;\n    x += n;\n    return x;\n}\n\nint main(void) {\n    f(2);\n    f(3);\n    printf("%d", f(4));\n    return 0;\n}',
    optionA: '4',
    optionB: '7',
    optionC: '9',
    optionD: '24',
    correctAnswer: 'C',
    explanation:
      'The static local variable x persists across calls. After f(2), x = 2; after f(3), x = 5; after f(4), x = 9, which is printed.',
    difficulty: 'medium',
    tags: 'gate,computer-science,c,static-storage',
    learningObjective: 'Trace static local variable lifetime across calls.',
    syllabusVersion: '2027',
  },
  {
    key: 'gate-cs-tcp-msq',
    unit: 'Computer Networks',
    topic: 'OSI vs TCP/IP',
    paper: 'II',
    responseType: 'multiple',
    questionType: 'msq',
    presentationType: 'text',
    gateSection: 'computer-science',
    questionText: 'Which of the following statements about TCP are TRUE?',
    optionA: 'TCP is a connection-oriented transport protocol.',
    optionB: 'TCP provides reliable byte-stream delivery.',
    optionC: 'TCP preserves application message boundaries.',
    optionD: 'TCP uses a three-way handshake to establish a connection.',
    correctOptions: ['A', 'B', 'D'],
    explanation:
      'TCP is connection-oriented, reliable and byte-stream oriented, and it establishes connections with a three-way handshake. It does not preserve message boundaries; that is the responsibility of the application or a message-oriented protocol such as UDP with added framing.',
    difficulty: 'easy',
    tags: 'gate,computer-science,tcp,transport-layer,msq',
    learningObjective: 'Distinguish TCP service guarantees from message framing.',
    syllabusVersion: '2027',
  },
  {
    key: 'gate-cs-even-parity-dfa',
    unit: 'Theory of Computation',
    topic: 'Finite Automata',
    paper: 'II',
    responseType: 'numeric',
    questionType: 'nat',
    presentationType: 'text',
    gateSection: 'computer-science',
    questionText:
      'The minimum number of states in a deterministic finite automaton that accepts all binary strings containing an even number of 0s and an even number of 1s is ______.',
    numericAnswer: 4,
    numericTolerance: 0,
    numericToleranceMode: 'none',
    numericPrecision: 0,
    explanation:
      'The automaton must track the parity of both symbol counts, giving four combinations: (even, even), (even, odd), (odd, even) and (odd, odd). All four states are distinguishable, so the minimum is 4.',
    difficulty: 'medium',
    tags: 'gate,computer-science,dfa,parity,nat',
    learningObjective: 'Compute the minimal DFA size for a parity language.',
    syllabusVersion: '2027',
  },
  {
    key: 'gate-cs-fcfs-arrival',
    unit: 'Operating Systems',
    topic: 'Process Scheduling',
    paper: 'II',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'table',
    gateSection: 'computer-science',
    questionText:
      'Three processes arrive as shown in the table. Using non-preemptive First-Come, First-Served (FCFS) scheduling, what is the average waiting time?',
    tableMarkdown:
      '| Process | Arrival time (ms) | Burst time (ms) |\n| --- | ---: | ---: |\n| P1 | 0 | 4 |\n| P2 | 1 | 3 |\n| P3 | 2 | 1 |',
    optionA: '1.33 ms',
    optionB: '2.00 ms',
    optionC: '2.67 ms',
    optionD: '3.33 ms',
    correctAnswer: 'C',
    explanation:
      'FCFS runs P1 from 0 to 4, P2 from 4 to 7 and P3 from 7 to 8. The waiting times are 0, 3 and 5 ms, so the average is 8/3 = 2.67 ms.',
    difficulty: 'easy',
    tags: 'gate,computer-science,scheduling,fcfs',
    learningObjective: 'Compute FCFS waiting time with staggered arrivals.',
    syllabusVersion: '2027',
  },
  {
    key: 'gate-cs-mst-weight',
    unit: 'Algorithms',
    topic: 'Asymptotic Analysis',
    paper: 'II',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'diagram',
    gateSection: 'computer-science',
    questionText:
      'A weighted undirected graph $G$ is shown. What is the total weight of a minimum spanning tree of $G$?',
    imageUrl: '/cbt/cs-graph.svg',
    optionA: '10',
    optionB: '11',
    optionC: '12',
    optionD: '13',
    correctAnswer: 'C',
    explanation:
      "Kruskal's algorithm selects edges AB (1), BC (2), CD (3) and DE (6) without forming a cycle. The total weight is 1 + 2 + 3 + 6 = 12.",
    difficulty: 'hard',
    tags: 'gate,computer-science,mst,kruskal',
    learningObjective: 'Compute a minimum spanning tree weight.',
    syllabusVersion: '2027',
  },

  // -------------------------------------------------------------------------
  // UGC NET Paper I — official-unit coverage (Comprehension, Math, DI,
  // Environment, Higher Education)
  // -------------------------------------------------------------------------
  {
    key: 'ugc-p1-comp-main-idea',
    unit: 'Reading Comprehension',
    topic: 'Main Idea',
    paper: 'I',
    syllabusUnit: 'P1-U03',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'passage',
    passage:
      'Digital libraries have changed the way scholars interact with knowledge. Instead of travelling to a physical repository, a researcher can now search millions of records in seconds. Yet access alone does not produce understanding. A digital archive is most valuable when it is curated: metadata must be accurate, collections must be coherent, and users must be taught how to evaluate what they find. Without these conditions, the abundance of information can become a source of confusion rather than insight. The task of the modern librarian, therefore, is not merely to digitise materials but to create an environment in which discovery is both easy and trustworthy.',
    questionText:
      'Which of the following best captures the central idea of the passage?',
    optionA:
      'Digital libraries should replace physical libraries entirely.',
    optionB:
      'Digitisation must be accompanied by curation and information literacy.',
    optionC:
      'Researchers prefer digital archives mainly because they are faster.',
    optionD:
      'Metadata is the only factor that makes a digital library useful.',
    correctAnswer: 'B',
    explanation:
      'The passage accepts the speed of digital access but argues that curation, accurate metadata and user evaluation skills are what turn access into understanding. The other options either overstate one detail or contradict the passage.',
    difficulty: 'medium',
    tags: 'ugc,paper-1,comprehension,main-idea',
    learningObjective: 'Identify the central claim of an unseen passage.',
    syllabusVersion: '2026',
    hindi: {
      passage:
        'डिजिटल पुस्तकालयों ने विद्वानों के ज्ञान के साथ संवाद करने का तरीका बदल दिया है। अब किसी शोधकर्ता को भौतिक भंडार तक यात्रा करने के बजाय सेकंडों में लाखों अभिलेखों को खोजा जा सकता है। फिर भी, केवल पहुँच से समझ उत्पन्न नहीं होती। एक डिजिटल अभिलेख तब सबसे अधिक मूल्यवान होता है जब उसका संरक्षण और व्यवस्थापन किया गया हो: मेटाडेटा सटीक हो, संग्रह सुसंगत हों, और उपयोगकर्ताओं को यह सिखाया जाए कि जो वे पाते हैं उसका मूल्यांकन कैसे करें। इन शर्तों के बिना, सूचना की अधिकता समझ के बजाय भ्रम का स्रोत बन सकती है। इसलिए, आधुनिक पुस्तकालयाध्यक्ष का कार्य केवल सामग्री का डिजिटलीकरण करना नहीं, बल्कि ऐसा वातावरण बनाना है जिसमें खोज सरल और विश्वसनीय दोनों हो।',
      questionText:
        'निम्नलिखित में से कौन-सा विकल्प गद्यांश के केंद्रीय विचार को सर्वोत्तम रूप से व्यक्त करता है?',
      optionA:
        'डिजिटल पुस्तकालयों को भौतिक पुस्तकालयों का पूर्णतः स्थान लेना चाहिए।',
      optionB:
        'डिजिटलीकरण के साथ-साथ संरक्षण-व्यवस्थापन और सूचना साक्षरता भी आवश्यक है।',
      optionC:
        'शोधकर्ता डिजिटल अभिलेखों को मुख्यतः इसलिए पसंद करते हैं क्योंकि वे तेज़ हैं।',
      optionD:
        'मेटाडेटा ही किसी उपयोगी डिजिटल पुस्तकालय का एकमात्र कारक है।',
      explanation:
        'गद्यांश डिजिटल पहुँच की गति को स्वीकार करता है, परंतु तर्क देता है कि संरक्षण-व्यवस्थापन, सटीक मेटाडेटा और उपयोगकर्ता के मूल्यांकन कौशल ही पहुँच को समझ में बदलते हैं। शेष विकल्प किसी एक विवरण को अत्यधिक बढ़ा-चढ़ाकर प्रस्तुत करते हैं या गद्यांश का विरोध करते हैं।',
    },
  },
  {
    key: 'ugc-p1-comp-inference',
    unit: 'Reading Comprehension',
    topic: 'Inference Drawing',
    paper: 'I',
    syllabusUnit: 'P1-U03',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'passage',
    passage:
      'Digital libraries have changed the way scholars interact with knowledge. Instead of travelling to a physical repository, a researcher can now search millions of records in seconds. Yet access alone does not produce understanding. A digital archive is most valuable when it is curated: metadata must be accurate, collections must be coherent, and users must be taught how to evaluate what they find. Without these conditions, the abundance of information can become a source of confusion rather than insight. The task of the modern librarian, therefore, is not merely to digitise materials but to create an environment in which discovery is both easy and trustworthy.',
    questionText:
      'It can be inferred from the passage that a digital library with poor metadata is likely to:',
    optionA: 'attract more researchers than a curated archive.',
    optionB: 'make discovery less reliable for its users.',
    optionC: 'reduce the need for professional librarians.',
    optionD: 'eliminate the need for evaluating search results.',
    correctAnswer: 'B',
    explanation:
      'The passage links accurate metadata to trustworthy discovery. If metadata is poor, records become harder to identify and evaluate, so discovery is less reliable. The other options are not supported by the passage.',
    difficulty: 'medium',
    tags: 'ugc,paper-1,comprehension,inference',
    learningObjective: 'Draw a valid inference from an unseen passage.',
    syllabusVersion: '2026',
    hindi: {
      passage:
        'डिजिटल पुस्तकालयों ने विद्वानों के ज्ञान के साथ संवाद करने का तरीका बदल दिया है। अब किसी शोधकर्ता को भौतिक भंडार तक यात्रा करने के बजाय सेकंडों में लाखों अभिलेखों को खोजा जा सकता है। फिर भी, केवल पहुँच से समझ उत्पन्न नहीं होती। एक डिजिटल अभिलेख तब सबसे अधिक मूल्यवान होता है जब उसका संरक्षण और व्यवस्थापन किया गया हो: मेटाडेटा सटीक हो, संग्रह सुसंगत हों, और उपयोगकर्ताओं को यह सिखाया जाए कि जो वे पाते हैं उसका मूल्यांकन कैसे करें। इन शर्तों के बिना, सूचना की अधिकता समझ के बजाय भ्रम का स्रोत बन सकती है। इसलिए, आधुनिक पुस्तकालयाध्यक्ष का कार्य केवल सामग्री का डिजिटलीकरण करना नहीं, बल्कि ऐसा वातावरण बनाना है जिसमें खोज सरल और विश्वसनीय दोनों हो।',
      questionText:
        'गद्यांश से यह अनुमान लगाया जा सकता है कि खराब मेटाडेटा वाला डिजिटल पुस्तकालय संभवतः:',
      optionA:
        'संरक्षित अभिलेख की तुलना में अधिक शोधकर्ताओं को आकर्षित करेगा।',
      optionB: 'अपने उपयोगकर्ताओं के लिए खोज को कम विश्वसनीय बना देगा।',
      optionC: 'पेशेवर पुस्तकालयाध्यक्षों की आवश्यकता को कम कर देगा।',
      optionD: 'खोज परिणामों के मूल्यांकन की आवश्यकता को समाप्त कर देगा।',
      explanation:
        'गद्यांश सटीक मेटाडेटा को विश्वसनीय खोज से जोड़ता है। यदि मेटाडेटा खराब है, तो अभिलेखों की पहचान और मूल्यांकन कठिन हो जाता है, इसलिए खोज कम विश्वसनीय हो जाती है। शेष विकल्प गद्यांश से समर्थित नहीं हैं।',
    },
  },
  {
    key: 'ugc-p1-comp-tone',
    unit: 'Reading Comprehension',
    topic: 'Tone & Purpose',
    paper: 'I',
    syllabusUnit: 'P1-U03',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'passage',
    passage:
      'Digital libraries have changed the way scholars interact with knowledge. Instead of travelling to a physical repository, a researcher can now search millions of records in seconds. Yet access alone does not produce understanding. A digital archive is most valuable when it is curated: metadata must be accurate, collections must be coherent, and users must be taught how to evaluate what they find. Without these conditions, the abundance of information can become a source of confusion rather than insight. The task of the modern librarian, therefore, is not merely to digitise materials but to create an environment in which discovery is both easy and trustworthy.',
    questionText: 'The tone of the passage is best described as:',
    optionA: 'enthusiastic but uncritical.',
    optionB: 'cautious and analytical.',
    optionC: 'humorous and informal.',
    optionD: 'indifferent and detached.',
    correctAnswer: 'B',
    explanation:
      'The author recognises the benefits of digital libraries but carefully qualifies them and analyses the conditions needed for reliable discovery. That balanced, evidence-oriented stance is cautious and analytical rather than uncritical or indifferent.',
    difficulty: 'medium',
    tags: 'ugc,paper-1,comprehension,tone',
    learningObjective: 'Identify the tone of an unseen passage.',
    syllabusVersion: '2026',
    hindi: {
      passage:
        'डिजिटल पुस्तकालयों ने विद्वानों के ज्ञान के साथ संवाद करने का तरीका बदल दिया है। अब किसी शोधकर्ता को भौतिक भंडार तक यात्रा करने के बजाय सेकंडों में लाखों अभिलेखों को खोजा जा सकता है। फिर भी, केवल पहुँच से समझ उत्पन्न नहीं होती। एक डिजिटल अभिलेख तब सबसे अधिक मूल्यवान होता है जब उसका संरक्षण और व्यवस्थापन किया गया हो: मेटाडेटा सटीक हो, संग्रह सुसंगत हों, और उपयोगकर्ताओं को यह सिखाया जाए कि जो वे पाते हैं उसका मूल्यांकन कैसे करें। इन शर्तों के बिना, सूचना की अधिकता समझ के बजाय भ्रम का स्रोत बन सकती है। इसलिए, आधुनिक पुस्तकालयाध्यक्ष का कार्य केवल सामग्री का डिजिटलीकरण करना नहीं, बल्कि ऐसा वातावरण बनाना है जिसमें खोज सरल और विश्वसनीय दोनों हो।',
      questionText:
        'गद्यांश का स्वर सर्वोत्तम रूप से किस प्रकार वर्णित किया जा सकता है?',
      optionA: 'उत्साही परंतु अनालोचनात्मक।',
      optionB: 'सतर्क और विश्लेषणात्मक।',
      optionC: 'हास्यपूर्ण और अनौपचारिक।',
      optionD: 'उदासीन और तटस्थ।',
      explanation:
        'लेखक डिजिटल पुस्तकालयों के लाभों को स्वीकार करता है, परंतु सावधानीपूर्वक उनकी सीमाएँ बताता है और विश्वसनीय खोज के लिए आवश्यक शर्तों का विश्लेषण करता है। यह संतुलित, प्रमाण-उन्मुख दृष्टिकोण सतर्क और विश्लेषणात्मक है, न कि अनालोचनात्मक या उदासीन।',
    },
  },
  {
    key: 'ugc-p1-comp-vocabulary',
    unit: 'Reading Comprehension',
    topic: 'Vocabulary in Context',
    paper: 'I',
    syllabusUnit: 'P1-U03',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'passage',
    passage:
      'Digital libraries have changed the way scholars interact with knowledge. Instead of travelling to a physical repository, a researcher can now search millions of records in seconds. Yet access alone does not produce understanding. A digital archive is most valuable when it is curated: metadata must be accurate, collections must be coherent, and users must be taught how to evaluate what they find. Without these conditions, the abundance of information can become a source of confusion rather than insight. The task of the modern librarian, therefore, is not merely to digitise materials but to create an environment in which discovery is both easy and trustworthy.',
    questionText:
      'In the passage, the word "curated" most nearly means:',
    optionA: 'randomly collected without any plan.',
    optionB: 'carefully selected and organised.',
    optionC: 'digitally encrypted for security.',
    optionD: 'permanently stored without change.',
    correctAnswer: 'B',
    explanation:
      'The colon after "curated" explains it through accurate metadata, coherent collections and user guidance. This points to careful selection and organisation, not random collection, encryption or mere storage.',
    difficulty: 'easy',
    tags: 'ugc,paper-1,comprehension,vocabulary',
    learningObjective: 'Infer the meaning of a word from its context.',
    syllabusVersion: '2026',
    hindi: {
      passage:
        'डिजिटल पुस्तकालयों ने विद्वानों के ज्ञान के साथ संवाद करने का तरीका बदल दिया है। अब किसी शोधकर्ता को भौतिक भंडार तक यात्रा करने के बजाय सेकंडों में लाखों अभिलेखों को खोजा जा सकता है। फिर भी, केवल पहुँच से समझ उत्पन्न नहीं होती। एक डिजिटल अभिलेख तब सबसे अधिक मूल्यवान होता है जब उसका संरक्षण और व्यवस्थापन किया गया हो: मेटाडेटा सटीक हो, संग्रह सुसंगत हों, और उपयोगकर्ताओं को यह सिखाया जाए कि जो वे पाते हैं उसका मूल्यांकन कैसे करें। इन शर्तों के बिना, सूचना की अधिकता समझ के बजाय भ्रम का स्रोत बन सकती है। इसलिए, आधुनिक पुस्तकालयाध्यक्ष का कार्य केवल सामग्री का डिजिटलीकरण करना नहीं, बल्कि ऐसा वातावरण बनाना है जिसमें खोज सरल और विश्वसनीय दोनों हो।',
      questionText:
        'गद्यांश में "curated" शब्द का अर्थ निकटतम रूप से क्या है?',
      optionA: 'बिना किसी योजना के यादृच्छिक रूप से एकत्रित।',
      optionB: 'सावधानीपूर्वक चयनित और व्यवस्थित।',
      optionC: 'सुरक्षा के लिए डिजिटल रूप से एन्क्रिप्टेड।',
      optionD: 'बिना परिवर्तन के स्थायी रूप से संग्रहीत।',
      explanation:
        '"Curated" के बाद आया विराम-चिह्न सटीक मेटाडेटा, सुसंगत संग्रह और उपयोगकर्ता मार्गदर्शन के माध्यम से इसका अर्थ स्पष्ट करता है। यह सावधानीपूर्वक चयन और व्यवस्थापन की ओर संकेत करता है, यादृच्छिक संग्रह, एन्क्रिप्शन या केवल भंडारण की ओर नहीं।',
    },
  },
  {
    key: 'ugc-p1-comp-purpose',
    unit: 'Reading Comprehension',
    topic: 'Tone & Purpose',
    paper: 'I',
    syllabusUnit: 'P1-U03',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'passage',
    passage:
      'Digital libraries have changed the way scholars interact with knowledge. Instead of travelling to a physical repository, a researcher can now search millions of records in seconds. Yet access alone does not produce understanding. A digital archive is most valuable when it is curated: metadata must be accurate, collections must be coherent, and users must be taught how to evaluate what they find. Without these conditions, the abundance of information can become a source of confusion rather than insight. The task of the modern librarian, therefore, is not merely to digitise materials but to create an environment in which discovery is both easy and trustworthy.',
    questionText: "The author's main purpose is to:",
    optionA: 'argue that physical libraries are now obsolete.',
    optionB:
      'explain why curation and user education matter in digital libraries.',
    optionC: 'describe the historical development of libraries.',
    optionD:
      'criticise researchers for relying on search engines instead of books.',
    correctAnswer: 'B',
    explanation:
      'The passage moves from the convenience of digital access to the conditions that make it genuinely useful, namely curation, accurate metadata and user education. Its purpose is explanatory and evaluative, not a claim that physical libraries are obsolete.',
    difficulty: 'medium',
    tags: 'ugc,paper-1,comprehension,purpose',
    learningObjective: "Identify an author's purpose in an unseen passage.",
    syllabusVersion: '2026',
    hindi: {
      passage:
        'डिजिटल पुस्तकालयों ने विद्वानों के ज्ञान के साथ संवाद करने का तरीका बदल दिया है। अब किसी शोधकर्ता को भौतिक भंडार तक यात्रा करने के बजाय सेकंडों में लाखों अभिलेखों को खोजा जा सकता है। फिर भी, केवल पहुँच से समझ उत्पन्न नहीं होती। एक डिजिटल अभिलेख तब सबसे अधिक मूल्यवान होता है जब उसका संरक्षण और व्यवस्थापन किया गया हो: मेटाडेटा सटीक हो, संग्रह सुसंगत हों, और उपयोगकर्ताओं को यह सिखाया जाए कि जो वे पाते हैं उसका मूल्यांकन कैसे करें। इन शर्तों के बिना, सूचना की अधिकता समझ के बजाय भ्रम का स्रोत बन सकती है। इसलिए, आधुनिक पुस्तकालयाध्यक्ष का कार्य केवल सामग्री का डिजिटलीकरण करना नहीं, बल्कि ऐसा वातावरण बनाना है जिसमें खोज सरल और विश्वसनीय दोनों हो।',
      questionText: 'लेखक का मुख्य उद्देश्य क्या है?',
      optionA: 'यह तर्क देना कि भौतिक पुस्तकालय अब अप्रचलित हो गए हैं।',
      optionB:
        'यह समझाना कि डिजिटल पुस्तकालयों में संरक्षण-व्यवस्थापन और उपयोगकर्ता शिक्षा क्यों महत्वपूर्ण हैं।',
      optionC: 'पुस्तकालयों के ऐतिहासिक विकास का वर्णन करना।',
      optionD:
        'शोधकर्ताओं की पुस्तकों के बजाय सर्च इंजन पर निर्भरता की आलोचना करना।',
      explanation:
        'गद्यांश डिजिटल पहुँच की सुविधा से आगे बढ़कर उन शर्तों पर आता है जो उसे वास्तव में उपयोगी बनाती हैं—संरक्षण-व्यवस्थापन, सटीक मेटाडेटा और उपयोगकर्ता शिक्षा। इसका उद्देश्य व्याख्यात्मक और मूल्यांकनात्मक है, यह दावा नहीं कि भौतिक पुस्तकालय अप्रचलित हो गए हैं।',
    },
  },
  {
    key: 'ugc-p1-math-coding',
    unit: 'Mathematical Reasoning & Aptitude',
    topic: 'Coding-Decoding',
    paper: 'I',
    syllabusUnit: 'P1-U05',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText:
      'If the word TEACHER is coded as VGCEJGT, how is STUDENT coded in the same code?',
    optionA: 'UVWFGPV',
    optionB: 'UVWEGPV',
    optionC: 'TVWFGPV',
    optionD: 'UVWFGQV',
    correctAnswer: 'A',
    explanation:
      'Each letter is moved two positions forward: T→V, E→G, A→C, C→E, H→J, E→G, R→T. Applying the same rule, S→U, T→V, U→W, D→F, E→G, N→P, T→V, giving UVWFGPV.',
    difficulty: 'easy',
    tags: 'ugc,paper-1,mathematical-reasoning,coding-decoding',
    learningObjective: 'Apply a letter-shift coding rule consistently.',
    syllabusVersion: '2026',
    hindi: {
      questionText:
        'यदि शब्द TEACHER को VGCEJGT के रूप में कूटबद्ध किया जाता है, तो उसी कूट में STUDENT को कैसे कूटबद्ध किया जाएगा?',
      optionA: 'UVWFGPV',
      optionB: 'UVWEGPV',
      optionC: 'TVWFGPV',
      optionD: 'UVWFGQV',
      explanation:
        'प्रत्येक अक्षर को दो स्थान आगे बढ़ाया गया है: T→V, E→G, A→C, C→E, H→J, E→G, R→T। वही नियम लागू करने पर S→U, T→V, U→W, D→F, E→G, N→P, T→V प्राप्त होता है, अर्थात् UVWFGPV।',
    },
  },
  {
    key: 'ugc-p1-math-blood-relation',
    unit: 'Mathematical Reasoning & Aptitude',
    topic: 'Blood Relations',
    paper: 'I',
    syllabusUnit: 'P1-U05',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText:
      "Pointing to a photograph, a man says, \"She is the daughter of my grandfather's only son.\" How is the woman in the photograph related to the man?",
    optionA: 'Mother',
    optionB: 'Sister',
    optionC: 'Daughter',
    optionD: 'Aunt',
    correctAnswer: 'B',
    explanation:
      "The man's grandfather's only son is the man's father. The daughter of the man's father is the man's sister.",
    difficulty: 'easy',
    tags: 'ugc,paper-1,mathematical-reasoning,blood-relations',
    learningObjective: 'Resolve a family relationship from a verbal clue.',
    syllabusVersion: '2026',
    hindi: {
      questionText:
        'एक तस्वीर की ओर इशारा करते हुए एक व्यक्ति कहता है, "वह मेरे दादाजी के एकमात्र पुत्र की पुत्री है।" तस्वीर में दिख रही महिला उस व्यक्ति से किस संबंध में है?',
      optionA: 'माता',
      optionB: 'बहन',
      optionC: 'पुत्री',
      optionD: 'मौसी',
      explanation:
        'व्यक्ति के दादाजी का एकमात्र पुत्र उस व्यक्ति के पिता हैं। पिता की पुत्री उस व्यक्ति की बहन होती है।',
    },
  },
  {
    key: 'ugc-p1-math-direction',
    unit: 'Mathematical Reasoning & Aptitude',
    topic: 'Direction Sense',
    paper: 'I',
    syllabusUnit: 'P1-U05',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText:
      'A person walks 5 km north, turns right and walks 3 km, then turns right again and walks 5 km. How far and in which direction is the person from the starting point?',
    optionA: '3 km west',
    optionB: '3 km east',
    optionC: '5 km east',
    optionD: '8 km north',
    correctAnswer: 'B',
    explanation:
      'Starting at (0, 0), the person moves to (0, 5), then east to (3, 5), then south to (3, 0). The final position is 3 km east of the start.',
    difficulty: 'easy',
    tags: 'ugc,paper-1,mathematical-reasoning,direction-sense',
    learningObjective: 'Track displacement across successive turns.',
    syllabusVersion: '2026',
    hindi: {
      questionText:
        'एक व्यक्ति 5 किमी उत्तर की ओर चलता है, दाएँ मुड़कर 3 किमी चलता है, और फिर दाएँ मुड़कर 5 किमी चलता है। वह प्रारंभिक स्थान से कितनी दूर और किस दिशा में है?',
      optionA: '3 किमी पश्चिम',
      optionB: '3 किमी पूर्व',
      optionC: '5 किमी पूर्व',
      optionD: '8 किमी उत्तर',
      explanation:
        'प्रारंभिक बिंदु (0, 0) से व्यक्ति (0, 5) तक जाता है, फिर पूर्व की ओर (3, 5) और फिर दक्षिण की ओर (3, 0) पहुँचता है। अंतिम स्थान प्रारंभ से 3 किमी पूर्व में है।',
    },
  },
  {
    key: 'ugc-p1-di-enrolment',
    unit: 'Data Interpretation',
    topic: 'Tabular Data',
    paper: 'I',
    syllabusUnit: 'P1-U07',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'table',
    tableMarkdown:
      '| Programme | 2023 | 2024 |\n| --- | ---: | ---: |\n| B.A. | 240 | 300 |\n| B.Sc. | 360 | 420 |\n| B.Com. | 300 | 360 |\n| B.Tech. | 500 | 600 |',
    questionText:
      'The table shows the number of students enrolled in four programmes in 2023 and 2024. What is the percentage increase in total enrolment from 2023 to 2024?',
    optionA: '15%',
    optionB: '18%',
    optionC: '20%',
    optionD: '25%',
    correctAnswer: 'C',
    explanation:
      'Total enrolment in 2023 is 240 + 360 + 300 + 500 = 1400. In 2024 it is 300 + 420 + 360 + 600 = 1680. The increase is 280, and 280/1400 × 100 = 20%.',
    difficulty: 'easy',
    tags: 'ugc,paper-1,data-interpretation,percentage',
    learningObjective: 'Compute a percentage change from a two-year table.',
    syllabusVersion: '2026',
    hindi: {
      tableMarkdown:
        '| कार्यक्रम | 2023 | 2024 |\n| --- | ---: | ---: |\n| बी.ए. | 240 | 300 |\n| बी.एससी. | 360 | 420 |\n| बी.कॉम. | 300 | 360 |\n| बी.टेक. | 500 | 600 |',
      questionText:
        'तालिका चार कार्यक्रमों में 2023 और 2024 में नामांकित विद्यार्थियों की संख्या दर्शाती है। 2023 से 2024 तक कुल नामांकन में प्रतिशत वृद्धि कितनी है?',
      optionA: '15%',
      optionB: '18%',
      optionC: '20%',
      optionD: '25%',
      explanation:
        '2023 में कुल नामांकन 240 + 360 + 300 + 500 = 1400 था। 2024 में यह 300 + 420 + 360 + 600 = 1680 है। वृद्धि 280 है, और 280/1400 × 100 = 20%।',
    },
  },
  {
    key: 'ugc-p1-env-ozone',
    unit: 'People, Development & Environment',
    topic: 'Environmental Issues',
    paper: 'I',
    syllabusUnit: 'P1-U09',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText:
      'Which of the following is the main cause of stratospheric ozone depletion?',
    optionA: 'Carbon dioxide emissions',
    optionB: 'Chlorofluorocarbons (CFCs)',
    optionC: 'Sulphur dioxide emissions',
    optionD: 'Particulate matter',
    correctAnswer: 'B',
    explanation:
      'CFCs release chlorine radicals in the stratosphere, which catalyse the destruction of ozone molecules. Carbon dioxide is a greenhouse gas but is not the main ozone-depleting substance.',
    difficulty: 'easy',
    tags: 'ugc,paper-1,environment,ozone',
    learningObjective: 'Identify the principal ozone-depleting substances.',
    syllabusVersion: '2026',
    hindi: {
      questionText:
        'निम्नलिखित में से समतापमंडलीय ओज़ोन क्षय का मुख्य कारण क्या है?',
      optionA: 'कार्बन डाइऑक्साइड उत्सर्जन',
      optionB: 'क्लोरोफ्लोरोकार्बन (CFC)',
      optionC: 'सल्फर डाइऑक्साइड उत्सर्जन',
      optionD: 'कणिकीय पदार्थ',
      explanation:
        'CFC समतापमंडल में क्लोरीन मुक्त करते हैं, जो ओज़ोन अणुओं के क्षय को उत्प्रेरित करता है। कार्बन डाइऑक्साइड एक ग्रीनहाउस गैस है, परंतु मुख्य ओज़ोन-क्षयकारी पदार्थ नहीं है।',
    },
  },
  {
    key: 'ugc-p1-env-kyoto',
    unit: 'People, Development & Environment',
    topic: 'Climate Change',
    paper: 'I',
    syllabusUnit: 'P1-U09',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText:
      'The Kyoto Protocol is an international agreement primarily aimed at:',
    optionA: 'protecting biodiversity.',
    optionB: 'reducing greenhouse gas emissions.',
    optionC: 'controlling transboundary hazardous waste.',
    optionD: 'conserving wetlands.',
    correctAnswer: 'B',
    explanation:
      'The Kyoto Protocol (1997) set binding greenhouse-gas reduction targets for developed countries. Biodiversity is addressed by the CBD, hazardous waste by the Basel Convention, and wetlands by the Ramsar Convention.',
    difficulty: 'easy',
    tags: 'ugc,paper-1,environment,climate-change,kyoto',
    learningObjective: 'Associate international environmental agreements with their issues.',
    syllabusVersion: '2026',
    hindi: {
      questionText:
        'क्योटो प्रोटोकॉल मुख्य रूप से किस पर्यावरणीय मुद्दे से संबंधित अंतरराष्ट्रीय समझौता है?',
      optionA: 'जैव विविधता का संरक्षण',
      optionB: 'ग्रीनहाउस गैस उत्सर्जन में कमी',
      optionC: 'सीमा-पार खतरनाक अपशिष्ट का नियंत्रण',
      optionD: 'आर्द्रभूमियों का संरक्षण',
      explanation:
        'क्योटो प्रोटोकॉल (1997) ने विकसित देशों के लिए ग्रीनहाउस गैस उत्सर्जन में कमी के बाध्यकारी लक्ष्य निर्धारित किए। जैव विविधता हेतु CBD, खतरनाक अपशिष्ट हेतु बासेल सम्मेलन और आर्द्रभूमि हेतु रामसर सम्मेलन है।',
    },
  },
  {
    key: 'ugc-p1-heci',
    unit: 'Higher Education System',
    topic: 'Policies & Commissions',
    paper: 'I',
    syllabusUnit: 'P1-U10',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText:
      'Under the National Education Policy 2020, the proposed Higher Education Commission of India (HECI) is intended to replace which of the following as the principal regulator of higher education?',
    optionA: 'UGC and AICTE',
    optionB: 'CBSE and NCERT',
    optionC: 'NAAC and NBA',
    optionD: 'ICSSR and ICHR',
    correctAnswer: 'A',
    explanation:
      'NEP 2020 proposes a single overarching regulator, HECI, to replace UGC and AICTE, while excluding medical and legal education. NAAC and NBA remain separate accreditation bodies.',
    difficulty: 'medium',
    tags: 'ugc,paper-1,higher-education,nep-2020,heci',
    learningObjective: 'Relate NEP 2020 regulatory reform to existing bodies.',
    syllabusVersion: '2026',
    hindi: {
      questionText:
        'राष्ट्रीय शिक्षा नीति 2020 के अंतर्गत प्रस्तावित उच्च शिक्षा आयोग (HECI) को उच्च शिक्षा के प्रमुख नियामक के रूप में निम्नलिखित में से किसके स्थान पर लाने का प्रस्ताव है?',
      optionA: 'UGC और AICTE',
      optionB: 'CBSE और NCERT',
      optionC: 'NAAC और NBA',
      optionD: 'ICSSR और ICHR',
      explanation:
        'NEP 2020 एक व्यापक नियामक HECI का प्रस्ताव करती है, जो चिकित्सा और विधि शिक्षा को छोड़कर UGC और AICTE का स्थान लेगा। NAAC और NBA पृथक मान्यता निकाय बने रहेंगे।',
    },
  },
  {
    key: 'ugc-p1-ncrf',
    unit: 'Higher Education System',
    topic: 'Policies & Commissions',
    paper: 'I',
    syllabusUnit: 'P1-U10',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText:
      'The National Credit Framework (NCrF) introduced in India aims primarily to:',
    optionA: 'provide education loans to students.',
    optionB:
      'integrate academic and vocational learning through a common credit system.',
    optionC: 'replace all university examinations.',
    optionD: 'regulate foreign universities in India.',
    correctAnswer: 'B',
    explanation:
      'NCrF (2022) enables credit accumulation across school, higher and vocational education, supporting multiple entry and exit as well as lifelong learning. It does not provide loans, abolish examinations or regulate foreign universities.',
    difficulty: 'medium',
    tags: 'ugc,paper-1,higher-education,ncrf',
    learningObjective: 'Explain the purpose of the National Credit Framework.',
    syllabusVersion: '2026',
    hindi: {
      questionText:
        'भारत में शुरू किया गया राष्ट्रीय क्रेडिट फ्रेमवर्क (NCrF) मुख्य रूप से किस उद्देश्य से है?',
      optionA: 'विद्यार्थियों को शिक्षा ऋण उपलब्ध कराना।',
      optionB:
        'साझा क्रेडिट प्रणाली के माध्यम से शैक्षणिक और व्यावसायिक शिक्षा का एकीकरण करना।',
      optionC: 'सभी विश्वविद्यालय परीक्षाओं को बदलना।',
      optionD: 'भारत में विदेशी विश्वविद्यालयों को नियंत्रित करना।',
      explanation:
        'NCrF (2022) स्कूल, उच्च और व्यावसायिक शिक्षा में क्रेडिट संचय को सक्षम बनाता है, जिससे बहु-प्रवेश और निकास तथा आजीवन अधिगम को समर्थन मिलता है। यह ऋण नहीं देता, परीक्षाएँ समाप्त नहीं करता और विदेशी विश्वविद्यालयों को नियंत्रित नहीं करता।',
    },
  },

  // -------------------------------------------------------------------------
  // UGC NET Paper II — official-unit coverage (Discrete, Programming/Graphics,
  // Software Engineering, Artificial Intelligence)
  // -------------------------------------------------------------------------
  {
    key: 'ugc-p2-discrete-functions',
    unit: 'Discrete Structures & Optimization',
    topic: 'Core Concepts',
    paper: 'II',
    syllabusUnit: 'P2-U01',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText:
      'The number of functions from a set with 4 elements to a set with 3 elements is:',
    optionA: '12',
    optionB: '64',
    optionC: '81',
    optionD: '256',
    correctAnswer: 'C',
    explanation:
      'Each of the 4 domain elements can be mapped to any of the 3 codomain elements independently, so the number of functions is 3^4 = 81.',
    difficulty: 'easy',
    tags: 'ugc,paper-2,discrete-structures,functions',
    learningObjective: 'Count functions between finite sets.',
    syllabusVersion: '2026',
    hindi: {
      questionText:
        '4 अवयवों वाले समुच्चय से 3 अवयवों वाले समुच्चय तक कितने फलन संभव हैं?',
      optionA: '12',
      optionB: '64',
      optionC: '81',
      optionD: '256',
      explanation:
        'डोमेन के प्रत्येक 4 अवयव को सह-डोमेन के 3 अवयवों में से किसी एक पर स्वतंत्र रूप से प्रतिचित्रित किया जा सकता है, इसलिए फलनों की संख्या 3^4 = 81 है।',
    },
  },
  {
    key: 'ugc-p2-discrete-negation',
    unit: 'Discrete Structures & Optimization',
    topic: 'Core Concepts',
    paper: 'II',
    syllabusUnit: 'P2-U01',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'mathematical',
    questionText: 'What is the negation of the statement $\\forall x\\, P(x)$?',
    optionA: '$\\forall x\\, \\neg P(x)$',
    optionB: '$\\exists x\\, \\neg P(x)$',
    optionC: '$\\exists x\\, P(x)$',
    optionD: '$\\neg \\forall x\\, \\neg P(x)$',
    correctAnswer: 'B',
    explanation:
      'For quantifiers, the negation of a universal statement is an existential statement with a negated predicate: $\\neg \\forall x\\, P(x) \\equiv \\exists x\\, \\neg P(x)$.',
    difficulty: 'easy',
    tags: 'ugc,paper-2,discrete-structures,logic,quantifiers',
    learningObjective: 'Negate a universally quantified statement.',
    syllabusVersion: '2026',
    hindi: {
      questionText: 'कथन $\\forall x\\, P(x)$ का निषेध क्या है?',
      optionA: '$\\forall x\\, \\neg P(x)$',
      optionB: '$\\exists x\\, \\neg P(x)$',
      optionC: '$\\exists x\\, P(x)$',
      optionD: '$\\neg \\forall x\\, \\neg P(x)$',
      explanation:
        'परिमाणकों के लिए, सार्वत्रिक कथन का निषेध निषेधित विधेय वाला अस्तित्वगत कथन होता है: $\\neg \\forall x\\, P(x) \\equiv \\exists x\\, \\neg P(x)$।',
    },
  },
  {
    key: 'ugc-p2-graphics-bresenham',
    unit: 'Computer Graphics',
    topic: 'Core Concepts',
    paper: 'II',
    syllabusUnit: 'P2-U03',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText:
      'Which line-drawing algorithm uses only integer arithmetic and is therefore well suited to raster displays?',
    optionA: 'Digital Differential Analyser (DDA)',
    optionB: "Bresenham's line algorithm",
    optionC: 'Cohen-Sutherland algorithm',
    optionD: 'Sutherland-Hodgman algorithm',
    correctAnswer: 'B',
    explanation:
      "Bresenham's algorithm uses integer addition and decision parameters to choose pixels, whereas DDA uses floating-point arithmetic. Cohen-Sutherland is a line-clipping algorithm and Sutherland-Hodgman clips polygons.",
    difficulty: 'medium',
    tags: 'ugc,paper-2,computer-graphics,bresenham,rasterization',
    learningObjective: 'Distinguish raster line-drawing from clipping algorithms.',
    syllabusVersion: '2026',
    hindi: {
      questionText:
        'कौन-सा रेखा-चित्रण एल्गोरिद्म केवल पूर्णांक अंकगणित का उपयोग करता है और इसलिए रास्टर डिस्प्ले के लिए उपयुक्त है?',
      optionA: 'डिजिटल डिफरेंशियल एनालाइज़र (DDA)',
      optionB: 'ब्रेसेनहैम रेखा एल्गोरिद्म',
      optionC: 'कोहेन-सदरलैंड एल्गोरिद्म',
      optionD: 'सदरलैंड-हॉजमैन एल्गोरिद्म',
      explanation:
        'ब्रेसेनहैम एल्गोरिद्म पिक्सेल चुनने के लिए पूर्णांक जोड़ और निर्णय मापदंडों का उपयोग करता है, जबकि DDA फ्लोटिंग-पॉइंट अंकगणित करता है। कोहेन-सदरलैंड रेखा-क्लिपिंग और सदरलैंड-हॉजमैन बहुभुज-क्लिपिंग एल्गोरिद्म हैं।',
    },
  },
  {
    key: 'ugc-p2-graphics-translation',
    unit: 'Computer Graphics',
    topic: 'Core Concepts',
    paper: 'II',
    syllabusUnit: 'P2-U03',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'mathematical',
    questionText:
      'In homogeneous coordinates, a translation by $(t_x, t_y)$ is represented by which $3 \\times 3$ matrix?',
    optionA:
      '$\\begin{bmatrix}1 & 0 & t_x \\\\ 0 & 1 & t_y \\\\ 0 & 0 & 1\\end{bmatrix}$',
    optionB:
      '$\\begin{bmatrix}1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ t_x & t_y & 1\\end{bmatrix}$',
    optionC:
      '$\\begin{bmatrix}t_x & 0 & 0 \\\\ 0 & t_y & 0 \\\\ 0 & 0 & 1\\end{bmatrix}$',
    optionD:
      '$\\begin{bmatrix}1 & t_x & 0 \\\\ 0 & 1 & t_y \\\\ 0 & 0 & 1\\end{bmatrix}$',
    correctAnswer: 'A',
    explanation:
      'Multiplying the column vector $(x, y, 1)^T$ by the first matrix gives $(x + t_x, y + t_y, 1)^T$. In the column-vector convention, the translation components occupy the last column.',
    difficulty: 'medium',
    tags: 'ugc,paper-2,computer-graphics,transformation,homogeneous-coordinates',
    learningObjective: 'Identify the homogeneous translation matrix.',
    syllabusVersion: '2026',
    hindi: {
      questionText:
        'समांगी निर्देशांकों में $(t_x, t_y)$ द्वारा अनुवाद को किस $3 \\times 3$ आव्यूह से दर्शाया जाता है?',
      optionA:
        '$\\begin{bmatrix}1 & 0 & t_x \\\\ 0 & 1 & t_y \\\\ 0 & 0 & 1\\end{bmatrix}$',
      optionB:
        '$\\begin{bmatrix}1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ t_x & t_y & 1\\end{bmatrix}$',
      optionC:
        '$\\begin{bmatrix}t_x & 0 & 0 \\\\ 0 & t_y & 0 \\\\ 0 & 0 & 1\\end{bmatrix}$',
      optionD:
        '$\\begin{bmatrix}1 & t_x & 0 \\\\ 0 & 1 & t_y \\\\ 0 & 0 & 1\\end{bmatrix}$',
      explanation:
        'स्तंभ सदिश $(x, y, 1)^T$ को पहले आव्यूह से गुणा करने पर $(x + t_x, y + t_y, 1)^T$ प्राप्त होता है। स्तंभ-सदिश परिपाटी में अनुवाद के घटक अंतिम स्तंभ में होते हैं।',
    },
  },
  {
    key: 'ugc-p2-programming-c-stages',
    unit: 'Programming & Data Structures',
    topic: 'Compilation Process',
    paper: 'II',
    syllabusUnit: 'P2-U03',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText:
      'Which of the following is the correct order of the stages that a C source file passes through before execution?',
    optionA: 'Preprocessing → Compilation → Assembly → Linking',
    optionB: 'Compilation → Preprocessing → Linking → Assembly',
    optionC: 'Preprocessing → Linking → Compilation → Assembly',
    optionD: 'Assembly → Compilation → Preprocessing → Linking',
    correctAnswer: 'A',
    explanation:
      'The preprocessor expands directives and macros, the compiler translates the result into assembly, the assembler produces object code, and the linker combines object files and libraries into an executable.',
    difficulty: 'easy',
    tags: 'ugc,paper-2,programming,c,compilation,linking',
    learningObjective: 'Order the C build pipeline correctly.',
    syllabusVersion: '2026',
    hindi: {
      questionText:
        'C स्रोत फ़ाइल निष्पादन से पहले किन चरणों से गुजरती है, उनका सही क्रम क्या है?',
      optionA: 'प्रीप्रोसेसिंग → संकलन → असेंबली → लिंकिंग',
      optionB: 'संकलन → प्रीप्रोसेसिंग → लिंकिंग → असेंबली',
      optionC: 'प्रीप्रोसेसिंग → लिंकिंग → संकलन → असेंबली',
      optionD: 'असेंबली → संकलन → प्रीप्रोसेसिंग → लिंकिंग',
      explanation:
        'प्रीप्रोसेसर निर्देशों और मैक्रो का विस्तार करता है, संकलक परिणाम को असेंबली में अनुवादित करता है, असेंबलर ऑब्जेक्ट कोड बनाता है, और लिंकर ऑब्जेक्ट फ़ाइलों तथा लाइब्रेरी को जोड़कर निष्पादन योग्य फ़ाइल बनाता है।',
    },
  },
  {
    key: 'ugc-p2-se-black-box',
    unit: 'Software Engineering',
    topic: 'Software Testing',
    paper: 'II',
    syllabusUnit: 'P2-U06',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText:
      'Which of the following is a black-box testing technique?',
    optionA: 'Statement coverage',
    optionB: 'Equivalence partitioning',
    optionC: 'Branch coverage',
    optionD: 'Path coverage',
    correctAnswer: 'B',
    explanation:
      'Black-box techniques derive tests from requirements and specifications. Equivalence partitioning divides the input domain into classes that are expected to behave similarly. Statement, branch and path coverage are white-box structural techniques.',
    difficulty: 'easy',
    tags: 'ugc,paper-2,software-engineering,testing,black-box',
    learningObjective: 'Classify software testing techniques.',
    syllabusVersion: '2026',
    hindi: {
      questionText:
        'निम्नलिखित में से कौन-सी ब्लैक-बॉक्स परीक्षण तकनीक है?',
      optionA: 'स्टेटमेंट कवरेज',
      optionB: 'समतुल्यता विभाजन',
      optionC: 'शाखा कवरेज',
      optionD: 'पथ कवरेज',
      explanation:
        'ब्लैक-बॉक्स तकनीकें आवश्यकताओं और विनिर्देशों से परीक्षण व्युत्पन्न करती हैं। समतुल्यता विभाजन इनपुट क्षेत्र को ऐसे वर्गों में बाँटता है जिनका व्यवहार समान होने की अपेक्षा होती है। स्टेटमेंट, शाखा और पथ कवरेज व्हाइट-बॉक्स संरचनात्मक तकनीकें हैं।',
    },
  },
  {
    key: 'ugc-p2-se-cocomo',
    unit: 'Software Engineering',
    topic: 'SDLC Models',
    paper: 'II',
    syllabusUnit: 'P2-U06',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText:
      'In the Basic COCOMO model, effort is estimated primarily as a function of:',
    optionA: 'the number of modules.',
    optionB: 'thousands of delivered source lines of code (KLOC).',
    optionC: 'the number of test cases.',
    optionD: 'the size of the development team.',
    correctAnswer: 'B',
    explanation:
      'Basic COCOMO uses KLOC together with the project type (organic, semi-detached or embedded) to estimate effort and schedule. Module count, test-case count and team size are not the primary inputs.',
    difficulty: 'medium',
    tags: 'ugc,paper-2,software-engineering,cocomo,estimation',
    learningObjective: 'Identify the primary input to Basic COCOMO.',
    syllabusVersion: '2026',
    hindi: {
      questionText:
        'बेसिक COCOMO मॉडल में प्रयास (effort) मुख्य रूप से किसका फलन होता है?',
      optionA: 'मॉड्यूलों की संख्या।',
      optionB: 'वितरित स्रोत कोड की हज़ार पंक्तियाँ (KLOC)।',
      optionC: 'परीक्षण मामलों की संख्या।',
      optionD: 'विकास टीम का आकार।',
      explanation:
        'बेसिक COCOMO प्रयास और समय-सारणी का अनुमान लगाने के लिए KLOC तथा परियोजना प्रकार (organic, semi-detached या embedded) का उपयोग करता है। मॉड्यूल संख्या, परीक्षण मामलों की संख्या और टीम का आकार प्राथमिक इनपुट नहीं हैं।',
    },
  },
  {
    key: 'ugc-p2-se-srs',
    unit: 'Software Engineering',
    topic: 'Requirements Engineering',
    paper: 'II',
    syllabusUnit: 'P2-U06',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText:
      'Which of the following is a desirable characteristic of a Software Requirements Specification (SRS)?',
    optionA: 'Ambiguity',
    optionB: 'Inconsistency',
    optionC: 'Verifiability',
    optionD: 'Redundancy',
    correctAnswer: 'C',
    explanation:
      'A good SRS should be unambiguous, complete, consistent, verifiable, traceable and modifiable. Ambiguity, inconsistency and unnecessary redundancy are defects, not desirable properties.',
    difficulty: 'easy',
    tags: 'ugc,paper-2,software-engineering,srs,requirements',
    learningObjective: 'Recognise quality attributes of an SRS.',
    syllabusVersion: '2026',
    hindi: {
      questionText:
        'सॉफ़्टवेयर आवश्यकता विनिर्देश (SRS) की वांछनीय विशेषता निम्नलिखित में से कौन-सी है?',
      optionA: 'अस्पष्टता',
      optionB: 'असंगति',
      optionC: 'सत्यापन-योग्यता',
      optionD: 'अनावश्यक पुनरावृत्ति',
      explanation:
        'अच्छा SRS अस्पष्टता-रहित, पूर्ण, सुसंगत, सत्यापन-योग्य, ट्रेस-योग्य और संशोधन-योग्य होना चाहिए। अस्पष्टता, असंगति और अनावश्यक पुनरावृत्ति दोष हैं, वांछनीय गुण नहीं।',
    },
  },
  {
    key: 'ugc-p2-se-cyclomatic',
    unit: 'Software Engineering',
    topic: 'Cyclomatic Complexity',
    paper: 'II',
    syllabusUnit: 'P2-U06',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'mathematical',
    questionText:
      'For a connected control-flow graph with $E$ edges and $N$ nodes, cyclomatic complexity $V(G)$ is given by:',
    optionA: '$E - N + 1$',
    optionB: '$E - N + 2$',
    optionC: '$N - E + 2$',
    optionD: '$E + N - 2$',
    correctAnswer: 'B',
    explanation:
      'In general, $V(G) = E - N + 2P$, where $P$ is the number of connected components. For a connected graph $P = 1$, so $V(G) = E - N + 2$, which also equals the number of independent paths.',
    difficulty: 'medium',
    tags: 'ugc,paper-2,software-engineering,cyclomatic-complexity',
    learningObjective: 'Apply the cyclomatic-complexity formula.',
    syllabusVersion: '2026',
    hindi: {
      questionText:
        'संबद्ध नियंत्रण-प्रवाह ग्राफ में $E$ किनारे और $N$ नोड हों, तो चक्रीय जटिलता $V(G)$ किस सूत्र से दी जाती है?',
      optionA: '$E - N + 1$',
      optionB: '$E - N + 2$',
      optionC: '$N - E + 2$',
      optionD: '$E + N - 2$',
      explanation:
        'सामान्य रूप में $V(G) = E - N + 2P$, जहाँ $P$ संबद्ध घटकों की संख्या है। संबद्ध ग्राफ के लिए $P = 1$, अतः $V(G) = E - N + 2$, जो स्वतंत्र पथों की संख्या के भी बराबर होता है।',
    },
  },
  {
    key: 'ugc-p2-ai-alpha-beta',
    unit: 'Artificial Intelligence',
    topic: 'Search Algorithms',
    paper: 'II',
    syllabusUnit: 'P2-U10',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText:
      'Alpha-beta pruning, when applied to the minimax algorithm, does which of the following?',
    optionA: 'Always returns a different move from minimax.',
    optionB:
      'Reduces the number of nodes examined without changing the minimax result.',
    optionC: 'Guarantees finding the shortest path to the goal.',
    optionD: 'Removes the need for a heuristic function.',
    correctAnswer: 'B',
    explanation:
      'Alpha-beta pruning discards branches that cannot influence the final minimax decision. The move chosen is the same as with full minimax, but fewer nodes are evaluated.',
    difficulty: 'medium',
    tags: 'ugc,paper-2,artificial-intelligence,minimax,alpha-beta',
    learningObjective: 'Explain the effect of alpha-beta pruning.',
    syllabusVersion: '2026',
    hindi: {
      questionText:
        'मिनिमैक्स एल्गोरिद्म पर अल्फा-बीटा प्रूनिंग लागू करने से क्या होता है?',
      optionA: 'यह सदैव मिनिमैक्स से भिन्न चाल लौटाती है।',
      optionB:
        'यह जाँचे जाने वाले नोडों की संख्या कम करती है परंतु मिनिमैक्स परिणाम नहीं बदलती।',
      optionC: 'यह लक्ष्य तक सबसे छोटा पथ खोजने की गारंटी देती है।',
      optionD: 'यह ह्यूरिस्टिक फलन की आवश्यकता को समाप्त कर देती है।',
      explanation:
        'अल्फा-बीटा उन शाखाओं को काटती है जो अंतिम मिनिमैक्स निर्णय को प्रभावित नहीं कर सकतीं। चुनी गई चाल पूर्ण मिनिमैक्स जैसी ही रहती है, परंतु कम नोडों का मूल्यांकन होता है।',
    },
  },
  {
    key: 'ugc-p2-ai-sigmoid',
    unit: 'Artificial Intelligence',
    topic: 'Neural Networks',
    paper: 'II',
    syllabusUnit: 'P2-U10',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText:
      'Which activation function maps any real-valued input to the interval (0, 1)?',
    optionA: 'ReLU',
    optionB: 'Sigmoid',
    optionC: 'Tanh',
    optionD: 'Linear',
    correctAnswer: 'B',
    explanation:
      'The sigmoid function $\\sigma(z) = 1/(1 + e^{-z})$ outputs values strictly between 0 and 1. Tanh outputs values between -1 and 1, ReLU outputs values in $[0, \\infty)$, and a linear function is unbounded.',
    difficulty: 'easy',
    tags: 'ugc,paper-2,artificial-intelligence,neural-networks,activation',
    learningObjective: 'Match activation functions to their output ranges.',
    syllabusVersion: '2026',
    hindi: {
      questionText:
        'कौन-सा सक्रियण फलन किसी भी वास्तविक इनपुट को अंतराल (0, 1) में प्रतिचित्रित करता है?',
      optionA: 'ReLU',
      optionB: 'सिग्मॉइड',
      optionC: 'Tanh',
      optionD: 'रैखिक',
      explanation:
        'सिग्मॉइड फलन $\\sigma(z) = 1/(1 + e^{-z})$ का आउटपुट 0 और 1 के बीच होता है। Tanh का आउटपुट -1 और 1 के बीच, ReLU का $[0, \\infty)$ में और रैखिक फलन असीमित होता है।',
    },
  },
  {
    key: 'ugc-p2-ai-kmeans',
    unit: 'Artificial Intelligence',
    topic: 'Machine Learning',
    paper: 'II',
    syllabusUnit: 'P2-U10',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText:
      'K-means clustering is an example of which type of machine learning?',
    optionA: 'Supervised learning',
    optionB: 'Unsupervised learning',
    optionC: 'Reinforcement learning',
    optionD: 'Semi-supervised learning',
    correctAnswer: 'B',
    explanation:
      'K-means groups unlabelled data by minimising within-cluster variance. Because no target labels are used, it is an unsupervised learning method.',
    difficulty: 'easy',
    tags: 'ugc,paper-2,artificial-intelligence,machine-learning,k-means',
    learningObjective: 'Classify clustering within machine-learning paradigms.',
    syllabusVersion: '2026',
    hindi: {
      questionText:
        'K-मीन्स क्लस्टरिंग किस प्रकार के मशीन लर्निंग का उदाहरण है?',
      optionA: 'पर्यवेक्षित अधिगम',
      optionB: 'अपर्यवेक्षित अधिगम',
      optionC: 'सुदृढ़ीकरण अधिगम',
      optionD: 'अर्ध-पर्यवेक्षित अधिगम',
      explanation:
        'K-मीन्स बिना लेबल वाले डेटा को क्लस्टर के भीतर विचरण को न्यूनतम करके समूहित करता है। चूँकि इसमें लक्ष्य लेबल का उपयोग नहीं होता, यह एक अपर्यवेक्षित अधिगम विधि है।',
    },
  },
  {
    key: 'ugc-p2-ai-resolution',
    unit: 'Artificial Intelligence',
    topic: 'Knowledge Representation',
    paper: 'II',
    syllabusUnit: 'P2-U10',
    responseType: 'single',
    questionType: 'mcq',
    presentationType: 'text',
    questionText:
      'In propositional logic, the resolution rule is primarily used for:',
    optionA: 'computing derivatives of functions.',
    optionB: 'automated theorem proving and satisfiability checking.',
    optionC: 'sorting clauses in ascending order.',
    optionD: 'converting decimal numbers to binary.',
    correctAnswer: 'B',
    explanation:
      'Resolution repeatedly applies a sound inference rule to clauses until the empty clause is derived. It is the basis of automated theorem proving, logic programming and SAT solvers.',
    difficulty: 'medium',
    tags: 'ugc,paper-2,artificial-intelligence,logic,resolution',
    learningObjective: 'Relate resolution to logical inference.',
    syllabusVersion: '2026',
    hindi: {
      questionText:
        'सप्रतिज्ञ तर्क (propositional logic) में रिज़ॉल्यूशन नियम का मुख्य उपयोग किस लिए होता है?',
      optionA: 'फलनों के अवकलज की गणना।',
      optionB: 'स्वचालित प्रमेय सिद्धि और संतुष्टता जाँच।',
      optionC: 'उपवाक्यों को आरोही क्रम में व्यवस्थित करना।',
      optionD: 'दशमलव संख्याओं को द्विआधारी में बदलना।',
      explanation:
        'रिज़ॉल्यूशन बार-बार एक ध्वनि अनुमान नियम लागू करके रिक्त उपवाक्य प्राप्त करता है। यह स्वचालित प्रमेय सिद्धि, लॉजिक प्रोग्रामिंग और SAT सॉल्वरों का आधार है।',
    },
  },
]

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Resolve an existing topic, creating it when the seed introduces a new one. */
async function resolveTopicId(
  question: SeedQuestion,
  topicIndex: Map<string, string>,
): Promise<string> {
  const key = `${question.unit}::${question.topic}`
  const existing = topicIndex.get(key)
  if (existing) return existing

  const subjectCode = question.paper === 'I' ? '00' : '08'
  const unit = await db.unit.findFirst({
    where: { name: question.unit, subject: { code: subjectCode } },
    select: { id: true },
  })
  if (!unit) {
    throw new Error(
      `Missing unit "${question.unit}" (subject ${subjectCode}) for seed ${question.key}`,
    )
  }

  const slug = slugify(question.topic)
  const topic = await db.topic.upsert({
    where: { unitId_slug: { unitId: unit.id, slug } },
    update: {},
    create: {
      unitId: unit.id,
      slug,
      name: question.topic,
      importance: 'medium',
    },
    select: { id: true },
  })
  topicIndex.set(key, topic.id)
  return topic.id
}

async function seedTranslation(
  questionId: string,
  hindi: SeedHindi,
): Promise<void> {
  const fields = {
    questionText: hindi.questionText,
    optionA: hindi.optionA ?? null,
    optionB: hindi.optionB ?? null,
    optionC: hindi.optionC ?? null,
    optionD: hindi.optionD ?? null,
    passage: hindi.passage ?? null,
    codeSnippet: hindi.codeSnippet ?? null,
    tableMarkdown: hindi.tableMarkdown ?? null,
    explanation: hindi.explanation ?? null,
    status: 'reviewed',
    translator: 'NETPrep editorial',
    reviewer: 'NETPrep editorial review',
    reviewedAt: TRANSLATION_REVIEWED_AT,
  }

  await db.questionTranslation.upsert({
    where: {
      questionId_language: { questionId, language: 'hi' },
    },
    update: fields,
    create: {
      questionId,
      language: 'hi',
      ...fields,
    },
  })
}

/**
 * Fill `syllabusUnit` for questions created by earlier seeds. Only null values
 * are touched so a deliberately mapped question is never overwritten.
 */
async function backfillSyllabusUnits(): Promise<number> {
  const rows = await db.question.findMany({
    where: { status: 'published', syllabusUnit: null },
    select: {
      id: true,
      paper: true,
      topic: { select: { unit: { select: { name: true } } } },
    },
  })

  let updated = 0
  for (const row of rows) {
    const unitName = row.topic?.unit?.name
    if (!unitName) continue
    const code = UGC_UNIT_BY_LEGACY_NAME[unitName]
    if (!code) continue
    const expectedPaper = code.startsWith('P1-') ? 'I' : 'II'
    if (row.paper !== expectedPaper) continue
    await db.question.update({
      where: { id: row.id },
      data: { syllabusUnit: code },
    })
    updated += 1
  }
  return updated
}

async function verifyUnitCoverage(): Promise<void> {
  const counts = await db.question.groupBy({
    by: ['syllabusUnit'],
    where: { status: 'published', responseType: 'single' },
    _count: { _all: true },
  })
  const byCode = new Map(
    counts
      .filter((row) => row.syllabusUnit)
      .map((row) => [row.syllabusUnit as string, row._count._all]),
  )

  const shortfalls = UGC_SYLLABUS_UNITS.map((unit) => {
    const required = UGC_FULL_PAPER_UNIT_QUESTION_COUNT[unit.paper]
    const available = byCode.get(unit.code) ?? 0
    return { unit, required, available }
  }).filter((entry) => entry.available < entry.required)

  if (shortfalls.length > 0) {
    throw new Error(
      `Official unit coverage is incomplete: ${shortfalls
        .map(
          (entry) =>
            `${entry.unit.code} ${entry.unit.shortName} (${entry.available}/${entry.required})`,
        )
        .join(', ')}`,
    )
  }

  console.log(
    `Official unit coverage verified for all ${UGC_SYLLABUS_UNITS.length} units.`,
  )
}

async function main(): Promise<void> {
  const topics = await db.topic.findMany({
    include: { unit: true },
  })
  const topicIndex = new Map<string, string>()
  for (const topic of topics) {
    topicIndex.set(`${topic.unit.name}::${topic.name}`, topic.id)
  }

  let created = 0
  let updated = 0
  let translations = 0

  for (const question of questions) {
    const topicId = await resolveTopicId(question, topicIndex)
    const fingerprint = `cbt-seed-${question.key}`
    const syllabusUnit =
      question.syllabusUnit ?? UGC_UNIT_BY_LEGACY_NAME[question.unit] ?? null
    if (!syllabusUnit) {
      throw new Error(`No official unit mapping for seed ${question.key}`)
    }

    const data = {
      topicId,
      syllabusUnit,
      questionText: question.questionText,
      optionA: question.optionA ?? '',
      optionB: question.optionB ?? '',
      optionC: question.optionC ?? '',
      optionD: question.optionD ?? '',
      correctAnswer: question.correctAnswer ?? 'A',
      explanation: question.explanation,
      difficulty: question.difficulty,
      questionType: question.questionType,
      paper: question.paper,
      responseType: question.responseType,
      correctOptions: question.correctOptions
        ? JSON.stringify(question.correctOptions)
        : null,
      numericAnswer: question.numericAnswer ?? null,
      numericTolerance: question.numericTolerance ?? null,
      numericToleranceMode: question.numericToleranceMode ?? null,
      numericPrecision: question.numericPrecision ?? null,
      presentationType: question.presentationType,
      passage: question.passage ?? null,
      codeSnippet: question.codeSnippet ?? null,
      tableMarkdown: question.tableMarkdown ?? null,
      imageUrl: question.imageUrl ?? null,
      gateSection: question.gateSection ?? null,
      sourceType: 'practice',
      source: 'NETPrep CBT practice bank',
      verified: true,
      verifiedAt: new Date(),
      verificationStatus: 'expert_verified',
      answerConfidence: 'high',
      answerSource: 'NETPrep editorial review',
      isCurrentSyllabus: true,
      syllabusVersion: question.syllabusVersion ?? '2026',
      tags: question.tags ?? '',
      learningObjective: question.learningObjective ?? '',
      status: 'published',
      fingerprint,
    }

    const existing = await db.question.findFirst({
      where: { fingerprint },
      select: { id: true },
    })

    let questionId: string
    if (existing) {
      await db.question.update({ where: { id: existing.id }, data })
      questionId = existing.id
      updated += 1
    } else {
      const row = await db.question.create({ data, select: { id: true } })
      questionId = row.id
      created += 1
    }

    if (question.hindi) {
      await seedTranslation(questionId, question.hindi)
      translations += 1
    }
  }

  const backfilled = await backfillSyllabusUnits()
  await verifyUnitCoverage()

  const paperTwo = await db.question.count({
    where: { paper: 'II', status: 'published' },
  })

  console.log(
    `CBT seed complete: ${created} created, ${updated} updated, ${translations} reviewed Hindi translations, ${backfilled} legacy unit mappings backfilled. Paper II published: ${paperTwo}.`,
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
