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

type ResponseType = 'single' | 'multiple' | 'numeric'
type PresentationType =
  | 'text'
  | 'passage'
  | 'table'
  | 'diagram'
  | 'code'
  | 'mathematical'
  | 'data-interpretation'

interface SeedQuestion {
  key: string
  unit: string
  topic: string
  paper: 'I' | 'II'
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
}

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
]

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

  for (const question of questions) {
    const topicId = topicIndex.get(`${question.unit}::${question.topic}`)
    if (!topicId) {
      throw new Error(
        `Missing topic "${question.unit} :: ${question.topic}" for seed ${question.key}`,
      )
    }

    const fingerprint = `cbt-seed-${question.key}`
    const data = {
      topicId,
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

    if (existing) {
      await db.question.update({ where: { id: existing.id }, data })
      updated += 1
    } else {
      await db.question.create({ data })
      created += 1
    }
  }

  const paperTwo = await db.question.count({
    where: { paper: 'II', status: 'published' },
  })
  const discrete = await db.question.count({
    where: {
      status: 'published',
      topic: { unit: { name: 'Discrete Structures & Optimization' } },
    },
  })

  console.log(
    `CBT seed complete: ${created} created, ${updated} updated. Paper II published: ${paperTwo}; Discrete Structures & Optimization: ${discrete}.`,
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
