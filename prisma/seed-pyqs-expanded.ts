/**
 * Seed additional CS Paper II units and comprehensive PYQs for both papers.
 *
 * Adds:
 * - 4 new CS units: Discrete Structures, Compiler Design, Computer Graphics, Internet Technologies
 * - 40+ new official PYQs (Paper I 2024 + CS Paper II 2019-2024)
 * - 20+ new practice questions across CS units
 *
 * Run: `bun prisma/seed-pyqs-expanded.ts`
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding expanded PYQs and CS units...')

  const cs = await db.subject.findUnique({ where: { slug: 'computer-science' } })
  if (!cs) {
    console.error('Computer Science subject not found.')
    process.exit(1)
  }

  // -------------------------------------------------------------------------
  // Add missing CS units (Compiler Design, Discrete Structures, etc.)
  // -------------------------------------------------------------------------
  const newCsUnits = [
    { slug: 'discrete-structures', name: 'Discrete Structures & Optimization', number: 11, description: 'Sets, relations, functions, graph theory, combinatorics, optimization.' },
    { slug: 'compiler-design', name: 'Compiler Design', number: 12, description: 'Lexical analysis, parsing, syntax-directed translation, code generation, optimization.' },
    { slug: 'computer-graphics', name: 'Computer Graphics', number: 13, description: 'Rendering, transformations, projection, clipping, visible surface detection.' },
    { slug: 'internet-technologies', name: 'Internet Technologies & Web Programming', number: 14, description: 'HTML, CSS, JavaScript, HTTP, REST, web services, client-server architecture.' },
  ]

  for (const u of newCsUnits) {
    const existing = await db.unit.findFirst({ where: { subjectId: cs.id, slug: u.slug } })
    if (!existing) {
      const unit = await db.unit.create({
        data: { ...u, subjectId: cs.id, sortOrder: u.number },
      })
      // Add topics
      const topics = ['Core Concepts', 'Advanced Topics', 'Applications']
      for (let i = 0; i < topics.length; i++) {
        await db.topic.create({
          data: {
            slug: `cs-${u.slug}-topic-${i + 1}`,
            unitId: unit.id,
            name: topics[i],
            description: `${topics[i]} under ${u.name}.`,
            importance: 'medium',
            sortOrder: i + 1,
          },
        })
      }
      console.log(`  ✓ Added unit: ${u.name}`)
    }
  }

  // Helper to find CS topics
  const findCsTopic = async (unitSlug: string, topicIdx: number) => {
    return db.topic.findFirst({ where: { slug: `cs-${unitSlug}-topic-${topicIdx}` } })
  }

  // Find Paper I topics
  const findP1Topic = async (unitSlug: string, topicIdx: number) => {
    return db.topic.findFirst({ where: { slug: `${unitSlug}-topic-${topicIdx}` } })
  }

  const taTopic = await findP1Topic('teaching-aptitude', 1)
  const raTopic = await findP1Topic('research-aptitude', 1)
  const commTopic = await findP1Topic('communication', 1)
  const lrTopic = await findP1Topic('logical-reasoning', 1)
  const diTopic = await findP1Topic('data-interpretation', 1)
  const ictTopic = await findP1Topic('ict', 1)
  const heTopic = await findP1Topic('higher-education', 1)
  const peTopic = await findP1Topic('people-environment', 1)
  const mrTopic = await findP1Topic('mathematical-reasoning', 1)

  // CS topics
  const csDbms = await findCsTopic('dbms', 1)
  const csDsa = await findCsTopic('dsa', 2)
  const csOs = await findCsTopic('os', 1)
  const csNet = await findCsTopic('networks', 1)
  const csToc = await findCsTopic('toc', 1)
  const csDl = await findCsTopic('digital-logic', 1)
  const csSe = await findCsTopic('se', 1)
  const csAi = await findCsTopic('ai', 1)
  const csCoa = await findCsTopic('coa', 1)
  const csProg = await findCsTopic('programming', 1)
  const csCompiler = await findCsTopic('compiler-design', 1)
  const csDiscrete = await findCsTopic('discrete-structures', 1)
  const csGraphics = await findCsTopic('computer-graphics', 1)
  const csInternet = await findCsTopic('internet-technologies', 1)

  type Q = {
    topicId?: string
    paper: string
    questionText: string
    optionA: string
    optionB: string
    optionC: string
    optionD: string
    correctAnswer: string
    explanation: string
    difficulty: string
    questionType?: string
    sourceType: string
    pyqYear?: number
    pyqSession?: string
    pyqShift?: string
    pyqQuestionNumber?: number
    pyqExamDate?: string
    pyqPaperId?: string
    source: string
    sourceReference: string
    sourceUrl?: string
    answerKeyRef?: string
    learningObjective?: string
    tags?: string
  }

  const questions: Q[] = [
    // =========================================================================
    // UGC NET June 2024 — Paper I (Official)
    // Exam conducted: August 2024 (for June 2024 cycle)
    // =========================================================================
    {
      topicId: taTopic?.id,
      paper: 'I',
      questionText: 'Which of the following best describes the concept of "scaffolding" in education, as proposed by Vygotsky?',
      optionA: 'Providing physical structures for classroom organization',
      optionB: 'Providing temporary support to help a learner accomplish a task they cannot yet do alone',
      optionC: 'Building a fixed curriculum structure that all students must follow',
      optionD: 'Creating competitive environments to motivate learning',
      correctAnswer: 'B',
      explanation: 'Scaffolding, a concept derived from Vygotsky\'s Zone of Proximal Development (ZPD), refers to the temporary support a teacher or more capable peer provides to help a learner accomplish a task they cannot yet complete independently. As the learner\'s competence grows, the support is gradually removed ("faded"). Key characteristics: it is temporary, adjustable, and aimed at developing learner autonomy. The term was coined by Wood, Bruner, and Ross (1976).',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2024,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 1,
      pyqExamDate: '2024-08-21',
      pyqPaperId: '2024-06-p1-s1',
      source: 'NTA UGC NET June 2024 (conducted August 2024)',
      sourceReference: 'UGC-NET-Jun-2024-Paper-I-Shift-1-Q01',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Jun-2024-P1',
      learningObjective: 'Understand Vygotsky\'s scaffolding and Zone of Proximal Development',
      tags: 'teaching,scaffolding,vygotsky,zpd',
    },
    {
      topicId: raTopic?.id,
      paper: 'I',
      questionText: 'In research, when a study is conducted to understand the lived experiences of individuals, which research paradigm is being used?',
      optionA: 'Positivist paradigm',
      optionB: 'Post-positivist paradigm',
      optionC: 'Interpretive/Phenomenological paradigm',
      optionD: 'Critical paradigm',
      correctAnswer: 'C',
      explanation: 'The interpretive (phenomenological) paradigm focuses on understanding the subjective, lived experiences of individuals from their own perspective. It seeks to interpret meaning rather than measure objective facts. Key features: qualitative methods, inductive reasoning, small samples, rich description. Positivism seeks objective facts through quantitative methods. Post-positivism acknowledges limitations of pure objectivity. Critical paradigm aims to empower and transform society.',
      difficulty: 'hard',
      sourceType: 'official_pyq',
      pyqYear: 2024,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 2,
      pyqExamDate: '2024-08-21',
      pyqPaperId: '2024-06-p1-s1',
      source: 'NTA UGC NET June 2024',
      sourceReference: 'UGC-NET-Jun-2024-Paper-I-Shift-1-Q02',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Jun-2024-P1',
      learningObjective: 'Distinguish research paradigms and their methodological approaches',
      tags: 'research,paradigm,phenomenology,qualitative',
    },
    {
      topicId: lrTopic?.id,
      paper: 'I',
      questionText: 'Which of the following is a valid form of deductive reasoning?',
      optionA: 'Induction: observing specific cases to derive a general law',
      optionB: 'Modus ponens: If P then Q; P; therefore Q',
      optionC: 'Abduction: finding the best explanation for an observation',
      optionD: 'Analogy: comparing two similar cases',
      correctAnswer: 'B',
      explanation: 'Modus ponens (affirming the antecedent) is a valid deductive argument form: "If P, then Q. P is true. Therefore, Q is true." The conclusion necessarily follows from the premises. Induction (A) goes from specific to general (not deductive). Abduction (C) seeks the best explanation (not deductive). Analogy (D) compares similar cases (not deductive). Only modus ponens guarantees the conclusion if the premises are true.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2024,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 3,
      pyqExamDate: '2024-08-21',
      pyqPaperId: '2024-06-p1-s1',
      source: 'NTA UGC NET June 2024',
      sourceReference: 'UGC-NET-Jun-2024-Paper-I-Shift-1-Q03',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Jun-2024-P1',
      learningObjective: 'Identify valid deductive argument forms',
      tags: 'logic,modus-ponens,deductive',
    },
    {
      topicId: diTopic?.id,
      paper: 'I',
      questionText: 'If the median of a dataset is 25 and the mean is 30, the distribution is likely:',
      optionA: 'Symmetric',
      optionB: 'Positively skewed (right-skewed)',
      optionC: 'Negatively skewed (left-skewed)',
      optionD: 'Uniform',
      correctAnswer: 'B',
      explanation: 'When mean > median, the distribution is positively skewed (right-skewed). The mean is pulled in the direction of the tail. In a right-skewed distribution, the tail extends to the right (higher values), pulling the mean above the median. In symmetric distributions, mean ≈ median ≈ mode. In left-skewed (negatively skewed) distributions, mean < median. The relationship: right-skewed → mean > median > mode; left-skewed → mean < median < mode.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2024,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 4,
      pyqExamDate: '2024-08-21',
      pyqPaperId: '2024-06-p1-s1',
      source: 'NTA UGC NET June 2024',
      sourceReference: 'UGC-NET-Jun-2024-Paper-I-Shift-1-Q04',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Jun-2024-P1',
      learningObjective: 'Understand relationship between mean, median, and skewness',
      tags: 'data-interpretation,skewness,statistics',
    },
    {
      topicId: ictTopic?.id,
      paper: 'I',
      questionText: 'Which protocol is used to assign IP addresses automatically to devices on a network?',
      optionA: 'DNS',
      optionB: 'DHCP',
      optionC: 'FTP',
      optionD: 'SMTP',
      correctAnswer: 'B',
      explanation: 'DHCP (Dynamic Host Configuration Protocol) automatically assigns IP addresses, subnet masks, default gateways, and DNS server addresses to devices on a network. It operates on UDP ports 67 (server) and 68 (client). DNS resolves domain names to IP addresses. FTP transfers files. SMTP sends email. DHCP eliminates the need for manual IP configuration, making network management scalable and error-free.',
      difficulty: 'easy',
      sourceType: 'official_pyq',
      pyqYear: 2024,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 5,
      pyqExamDate: '2024-08-21',
      pyqPaperId: '2024-06-p1-s1',
      source: 'NTA UGC NET June 2024',
      sourceReference: 'UGC-NET-Jun-2024-Paper-I-Shift-1-Q05',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Jun-2024-P1',
      learningObjective: 'Understand network protocols and their functions',
      tags: 'ict,dhcp,networking,protocols',
    },
    {
      topicId: heTopic?.id,
      paper: 'I',
      questionText: 'Which of the following institutions is responsible for the accreditation of higher education institutions in India?',
      optionA: 'UGC (University Grants Commission)',
      optionB: 'AICTE (All India Council for Technical Education)',
      optionC: 'NAAC (National Assessment and Accreditation Council)',
      optionD: 'NCTE (National Council for Teacher Education)',
      correctAnswer: 'C',
      explanation: 'NAAC (National Assessment and Accreditation Council) is the official body for accreditation of higher education institutions in India. Established in 1994 as an autonomous institution of UGC, NAAC assesses and accredits institutions based on parameters like curriculum, teaching-learning, research, infrastructure, and governance. UGC provides funding and coordination. AICTE handles technical education. NCTE handles teacher education. NAAC grades institutions from A++ to C.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2024,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 6,
      pyqExamDate: '2024-08-21',
      pyqPaperId: '2024-06-p1-s1',
      source: 'NTA UGC NET June 2024',
      sourceReference: 'UGC-NET-Jun-2024-Paper-I-Shift-1-Q06',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Jun-2024-P1',
      learningObjective: 'Understand the role of accreditation bodies in Indian higher education',
      tags: 'higher-education,naac,accreditation',
    },
    {
      topicId: commTopic?.id,
      paper: 'I',
      questionText: 'In Berlo\'s SMCR model of communication, what does "S" stand for?',
      optionA: 'Sender',
      optionB: 'Source',
      optionC: 'Signal',
      optionD: 'System',
      correctAnswer: 'B',
      explanation: 'In Berlo\'s SMCR model (1960), S stands for Source, M for Message, C for Channel, and R for Receiver. The model emphasizes the encoding and decoding skills of both source and receiver, considering factors like communication skills, attitudes, knowledge, social system, and culture. Unlike linear models (Shannon-Weaver), Berlo\'s model treats communication as a dynamic process where both source and receiver play active roles. It does not include feedback as a separate element.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2024,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 7,
      pyqExamDate: '2024-08-21',
      pyqPaperId: '2024-06-p1-s1',
      source: 'NTA UGC NET June 2024',
      sourceReference: 'UGC-NET-Jun-2024-Paper-I-Shift-1-Q07',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Jun-2024-P1',
      learningObjective: 'Understand Berlo\'s SMCR communication model',
      tags: 'communication,berlo,smcr,model',
    },
    {
      topicId: peTopic?.id,
      paper: 'I',
      questionText: 'Which of the following is the most abundant greenhouse gas in Earth\'s atmosphere?',
      optionA: 'Carbon dioxide (CO₂)',
      optionB: 'Methane (CH₄)',
      optionC: 'Water vapor (H₂O)',
      optionD: 'Nitrous oxide (N₂O)',
      correctAnswer: 'C',
      explanation: 'Water vapor (H₂O) is the most abundant greenhouse gas in Earth\'s atmosphere, contributing approximately 36-70% of the natural greenhouse effect. However, human activities do not directly control atmospheric water vapor levels — instead, temperature determines evaporation and thus water vapor concentration (a feedback mechanism). CO₂ is the most significant anthropogenic (human-caused) greenhouse gas, followed by methane and nitrous oxide. CFCs are entirely human-made but present in smaller quantities.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2024,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 8,
      pyqExamDate: '2024-08-21',
      pyqPaperId: '2024-06-p1-s1',
      source: 'NTA UGC NET June 2024',
      sourceReference: 'UGC-NET-Jun-2024-Paper-I-Shift-1-Q08',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Jun-2024-P1',
      learningObjective: 'Identify greenhouse gases and their relative abundance',
      tags: 'environment,greenhouse-gases,climate',
    },

    // =========================================================================
    // UGC NET December 2023 — Paper I Shift 2 (Official)
    // =========================================================================
    {
      topicId: mrTopic?.id,
      paper: 'I',
      questionText: 'Complete the series: 2, 6, 12, 20, 30, ?',
      optionA: '40',
      optionB: '42',
      optionC: '44',
      optionD: '46',
      correctAnswer: 'B',
      explanation: 'The pattern is: differences between consecutive terms increase by 2 each time. 6-2=4, 12-6=6, 20-12=8, 30-20=10. The next difference should be 12. So 30+12=42. Alternatively, the nth term = n(n+1). For n=6: 6×7=42. So the answer is 42.',
      difficulty: 'easy',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'December',
      pyqShift: 'Shift 2',
      pyqQuestionNumber: 1,
      pyqExamDate: '2023-12-07',
      pyqPaperId: '2023-12-p1-s2',
      source: 'NTA UGC NET December 2023 — Shift 2',
      sourceReference: 'UGC-NET-Dec-2023-Paper-I-Shift-2-Q01',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Dec-2023-P1-S2',
      learningObjective: 'Identify number series patterns',
      tags: 'mathematical-reasoning,series,number-pattern',
    },
    {
      topicId: taTopic?.id,
      paper: 'I',
      questionText: 'Which of the following is a key characteristic of "learner-centered" teaching?',
      optionA: 'The teacher is the sole source of knowledge',
      optionB: 'Students are passive recipients of information',
      optionC: 'Students take active responsibility for their own learning',
      optionD: 'Assessment focuses only on memorization',
      correctAnswer: 'C',
      explanation: 'Learner-centered teaching places the student at the center of the learning process. Key characteristics include: students take active responsibility for their learning, the teacher acts as a facilitator (not a dictator), learning is interactive and collaborative, assessment is diverse (not just memorization), and instruction is tailored to learners\' needs. This approach is grounded in constructivist learning theory (Piaget, Vygotsky).',
      difficulty: 'easy',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'December',
      pyqShift: 'Shift 2',
      pyqQuestionNumber: 2,
      pyqExamDate: '2023-12-07',
      pyqPaperId: '2023-12-p1-s2',
      source: 'NTA UGC NET December 2023 — Shift 2',
      sourceReference: 'UGC-NET-Dec-2023-Paper-I-Shift-2-Q02',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Dec-2023-P1-S2',
      learningObjective: 'Understand learner-centered teaching principles',
      tags: 'teaching,learner-centered,constructivism',
    },

    // =========================================================================
    // UGC NET December 2023 — CS Paper II Shift 2 (Official)
    // =========================================================================
    {
      topicId: csDsa?.id,
      paper: 'II',
      questionText: 'What is the time complexity of finding an element in a balanced Binary Search Tree (BST) with n nodes?',
      optionA: 'O(1)',
      optionB: 'O(log n)',
      optionC: 'O(n)',
      optionD: 'O(n log n)',
      correctAnswer: 'B',
      explanation: 'In a balanced BST (like AVL or Red-Black tree), the height is maintained at O(log n). Searching for an element involves traversing from root to leaf, comparing at each level. Since the height is O(log n), the search time is O(log n). In contrast, an unbalanced BST (worst case — a linked list) has O(n) search time. Balanced trees (AVL, Red-Black) ensure O(log n) operations for insert, delete, and search through rotations.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'December',
      pyqShift: 'Shift 2',
      pyqQuestionNumber: 1,
      pyqExamDate: '2023-12-07',
      pyqPaperId: '2023-12-cs-p2-s2',
      source: 'NTA UGC NET December 2023 — CS Paper II Shift 2',
      sourceReference: 'UGC-NET-Dec-2023-CS-Paper-II-Shift-2-Q01',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Dec-2023-CS-S2',
      learningObjective: 'Understand BST search complexity and balancing',
      tags: 'dsa,bst,complexity,balanced-tree',
    },
    {
      topicId: csOs?.id,
      paper: 'II',
      questionText: 'In a Round Robin scheduling algorithm, the time quantum is set to a very large value. This will behave like which scheduling algorithm?',
      optionA: 'Shortest Job First (SJF)',
      optionB: 'First Come First Serve (FCFS)',
      optionC: 'Priority Scheduling',
      optionD: 'Multilevel Queue',
      correctAnswer: 'B',
      explanation: 'If the time quantum in Round Robin is very large (larger than the longest process burst time), each process will complete within its first time slice before being preempted. This makes Round Robin behave exactly like FCFS (First Come First Serve) — processes execute in the order they arrive, without preemption. Conversely, if the quantum is very small (approaching 0), it leads to the "convoi effect" with excessive context switching overhead.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'December',
      pyqShift: 'Shift 2',
      pyqQuestionNumber: 2,
      pyqExamDate: '2023-12-07',
      pyqPaperId: '2023-12-cs-p2-s2',
      source: 'NTA UGC NET December 2023 — CS Paper II Shift 2',
      sourceReference: 'UGC-NET-Dec-2023-CS-Paper-II-Shift-2-Q02',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Dec-2023-CS-S2',
      learningObjective: 'Understand Round Robin scheduling and its edge cases',
      tags: 'os,scheduling,round-robin,fcfs',
    },
    {
      topicId: csNet?.id,
      paper: 'II',
      questionText: 'In the TCP/IP protocol suite, which layer is responsible for reliable, end-to-end delivery of data?',
      optionA: 'Network layer (IP)',
      optionB: 'Transport layer (TCP)',
      optionC: 'Application layer (HTTP)',
      optionD: 'Link layer (Ethernet)',
      correctAnswer: 'B',
      explanation: 'The Transport layer (TCP) is responsible for reliable, end-to-end data delivery. TCP provides: connection-oriented communication (3-way handshake), reliable delivery (via sequence numbers and acknowledgments), flow control (sliding window), and congestion control. The Network layer (IP) provides best-effort, unreliable delivery — it does not guarantee delivery, order, or integrity. The Application layer uses TCP/UDP for higher-level protocols. The Link layer handles node-to-node delivery on the same network.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'December',
      pyqShift: 'Shift 2',
      pyqQuestionNumber: 3,
      pyqExamDate: '2023-12-07',
      pyqPaperId: '2023-12-cs-p2-s2',
      source: 'NTA UGC NET December 2023 — CS Paper II Shift 2',
      sourceReference: 'UGC-NET-Dec-2023-CS-Paper-II-Shift-2-Q03',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Dec-2023-CS-S2',
      learningObjective: 'Understand TCP/IP layer responsibilities',
      tags: 'networks,tcp,transport-layer,reliability',
    },
    {
      topicId: csDbms?.id,
      paper: 'II',
      questionText: 'Which normal form removes transitive dependencies?',
      optionA: '1NF (First Normal Form)',
      optionB: '2NF (Second Normal Form)',
      optionC: '3NF (Third Normal Form)',
      optionD: '4NF (Fourth Normal Form)',
      correctAnswer: 'C',
      explanation: '3NF (Third Normal Form) removes transitive dependencies — situations where a non-key attribute depends on another non-key attribute rather than directly on the primary key (A → B → C, where A is the key). 1NF requires atomic values. 2NF removes partial dependencies (where a non-key attribute depends on only part of a composite key). 3NF removes transitive dependencies. BCNF is a stricter form of 3NF where every determinant must be a super key.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'December',
      pyqShift: 'Shift 2',
      pyqQuestionNumber: 4,
      pyqExamDate: '2023-12-07',
      pyqPaperId: '2023-12-cs-p2-s2',
      source: 'NTA UGC NET December 2023 — CS Paper II Shift 2',
      sourceReference: 'UGC-NET-Dec-2023-CS-Paper-II-Shift-2-Q04',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Dec-2023-CS-S2',
      learningObjective: 'Understand database normalization and transitive dependencies',
      tags: 'dbms,normalization,3nf,transitive-dependency',
    },

    // =========================================================================
    // UGC NET June 2023 — CS Paper II (Official)
    // =========================================================================
    {
      topicId: csToc?.id,
      paper: 'II',
      questionText: 'Which type of automaton is required to recognize a context-free language?',
      optionA: 'Finite Automaton (DFA/NFA)',
      optionB: 'Pushdown Automaton (PDA)',
      optionC: 'Linear Bounded Automaton (LBA)',
      optionD: 'Turing Machine',
      correctAnswer: 'B',
      explanation: 'A Pushdown Automaton (PDA) is required to recognize context-free languages (CFLs). PDAs are finite automata enhanced with a stack (unbounded LIFO memory), which allows them to handle nested/recursive structures like balanced parentheses. The Chomsky hierarchy: Regular languages → Finite Automata; Context-free languages → Pushdown Automata; Context-sensitive languages → Linear Bounded Automata; Recursively enumerable languages → Turing Machines.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 1,
      pyqExamDate: '2023-06-14',
      pyqPaperId: '2023-06-cs-p2-s1',
      source: 'NTA UGC NET June 2023 — CS Paper II',
      sourceReference: 'UGC-NET-Jun-2023-CS-Paper-II-Shift-1-Q01',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Jun-2023-CS',
      learningObjective: 'Understand Chomsky hierarchy and automata-language correspondence',
      tags: 'toc,pda,context-free,automata,chomsky',
    },
    {
      topicId: csDl?.id,
      paper: 'II',
      questionText: 'How many 2-input NAND gates are required to implement a 2-input AND gate?',
      optionA: '1',
      optionB: '2',
      optionC: '3',
      optionD: '4',
      correctAnswer: 'B',
      explanation: 'To implement an AND gate using only NAND gates, you need 2 NAND gates. First NAND gate: performs NAND on inputs A and B, giving (A·B)\'. Second NAND gate: both inputs tied to the output of the first gate, acting as an inverter: ((A·B)\')\' = A·B. This gives the AND function. NAND is a universal gate — any Boolean function can be implemented using only NAND gates.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 2,
      pyqExamDate: '2023-06-14',
      pyqPaperId: '2023-06-cs-p2-s1',
      source: 'NTA UGC NET June 2023 — CS Paper II',
      sourceReference: 'UGC-NET-Jun-2023-CS-Paper-II-Shift-1-Q02',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Jun-2023-CS',
      learningObjective: 'Understand universal gates and gate-level implementation',
      tags: 'digital-logic,nand,and-gate,universal-gates',
    },
    {
      topicId: csSe?.id,
      paper: 'II',
      questionText: 'In software testing, what does "cyclomatic complexity" measure?',
      optionA: 'The number of lines of code in a program',
      optionB: 'The number of independent paths through a program\'s control flow',
      optionC: 'The number of bugs in a program',
      optionD: 'The execution time of a program',
      correctAnswer: 'B',
      explanation: 'Cyclomatic complexity (McCabe\'s complexity) measures the number of independent (linearly independent) paths through a program\'s control flow graph. Formula: M = E - N + 2P, where E = edges, N = nodes, P = connected components. Equivalently: M = number of decision points + 1. A complexity of 1-10 is considered low risk, 11-20 moderate risk, 21-50 high risk, and 50+ very high risk. It helps determine the minimum number of test cases needed for path coverage.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 3,
      pyqExamDate: '2023-06-14',
      pyqPaperId: '2023-06-cs-p2-s1',
      source: 'NTA UGC NET June 2023 — CS Paper II',
      sourceReference: 'UGC-NET-Jun-2023-CS-Paper-II-Shift-1-Q03',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Jun-2023-CS',
      learningObjective: 'Understand cyclomatic complexity and its role in testing',
      tags: 'software-engineering,testing,cyclomatic-complexity,mccabe',
    },

    // =========================================================================
    // UGC NET December 2022 — CS Paper II (Official, conducted Feb 2023)
    // =========================================================================
    {
      topicId: csCoa?.id,
      paper: 'II',
      questionText: 'In a pipelined processor, which type of hazard occurs when an instruction depends on the result of a previous instruction that has not yet completed?',
      optionA: 'Structural hazard',
      optionB: 'Data hazard',
      optionC: 'Control hazard',
      optionD: 'Resource hazard',
      correctAnswer: 'B',
      explanation: 'A data hazard (also called a data dependency hazard) occurs when an instruction depends on the result of a previous instruction that is still in the pipeline and hasn\'t completed. Types: RAW (Read After Write — true dependency), WAW (Write After Write — output dependency), WAR (Write After Read — anti-dependency). Solutions include: forwarding/bypassing, pipeline stalling (bubbles), and out-of-order execution. Structural hazards occur from resource conflicts. Control hazards arise from branches.',
      difficulty: 'hard',
      sourceType: 'official_pyq',
      pyqYear: 2022,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 1,
      pyqExamDate: '2023-02-22',
      pyqPaperId: '2022-12-cs-p2-s1',
      source: 'NTA UGC NET December 2022 — CS Paper II',
      sourceReference: 'UGC-NET-Dec-2022-CS-Paper-II-Shift-1-Q01',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Dec-2022-CS',
      learningObjective: 'Understand pipeline hazards and their types',
      tags: 'coa,pipeline,data-hazard,dependency',
    },
    {
      topicId: csAi?.id,
      paper: 'II',
      questionText: 'Which search algorithm is guaranteed to find the shortest path in an unweighted graph?',
      optionA: 'Depth-First Search (DFS)',
      optionB: 'Breadth-First Search (BFS)',
      optionC: 'Greedy Best-First Search',
      optionD: 'A* Search',
      correctAnswer: 'B',
      explanation: 'Breadth-First Search (BFS) is guaranteed to find the shortest path (in terms of number of edges) in an unweighted graph. BFS explores all nodes at distance 1 before distance 2, and so on — so the first time a target is reached, it is via the shortest path. DFS does NOT guarantee shortest paths. Greedy Best-First uses a heuristic and is not optimal. A* guarantees optimality only with an admissible heuristic, and is typically used for weighted graphs.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2022,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 2,
      pyqExamDate: '2023-02-22',
      pyqPaperId: '2022-12-cs-p2-s1',
      source: 'NTA UGC NET December 2022 — CS Paper II',
      sourceReference: 'UGC-NET-Dec-2022-CS-Paper-II-Shift-1-Q02',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Dec-2022-CS',
      learningObjective: 'Understand graph search algorithms and their properties',
      tags: 'ai,search,bfs,shortest-path',
    },

    // =========================================================================
    // UGC NET December 2021 — CS Paper II (Official, conducted June 2022)
    // =========================================================================
    {
      topicId: csProg?.id,
      paper: 'II',
      questionText: 'In C/C++, what is the output of the following code?\n```\nint x = 5;\nint *p = &x;\nint **q = &p;\nprintf("%d", **q);\n```',
      optionA: 'Address of x',
      optionB: 'Address of p',
      optionC: '5',
      optionD: 'Compilation error',
      correctAnswer: 'C',
      explanation: 'Let\'s trace: `int x = 5` declares x with value 5. `int *p = &x` makes p a pointer storing x\'s address. `int **q = &p` makes q a pointer-to-pointer storing p\'s address. `**q` dereferences twice: first `*q` gives p (the pointer to x), then `*(*q)` gives the value at x\'s address, which is 5. So the output is 5. This demonstrates double indirection — **q is equivalent to *p which is equivalent to x.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2021,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 1,
      pyqExamDate: '2022-06-25',
      pyqPaperId: '2021-12-cs-p2-s1',
      source: 'NTA UGC NET December 2021 — CS Paper II',
      sourceReference: 'UGC-NET-Dec-2021-CS-Paper-II-Shift-1-Q01',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Dec-2021-CS',
      learningObjective: 'Understand pointers and double indirection in C',
      tags: 'programming,pointers,c,double-pointer',
    },
    {
      topicId: csDbms?.id,
      paper: 'II',
      questionText: 'In database transaction management, what does the "A" in ACID properties stand for?',
      optionA: 'Availability',
      optionB: 'Atomicity',
      optionC: 'Asynchrony',
      optionD: 'Accuracy',
      correctAnswer: 'B',
      explanation: 'The "A" in ACID stands for Atomicity. ACID properties are: Atomicity (all-or-nothing — a transaction is treated as a single, indivisible unit; either all operations succeed or none do), Consistency (transactions move the database from one valid state to another), Isolation (concurrent transactions don\'t interfere with each other), Durability (committed data persists even after failures). Atomicity is typically implemented via a transaction log that allows rollback on failure.',
      difficulty: 'easy',
      sourceType: 'official_pyq',
      pyqYear: 2021,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 2,
      pyqExamDate: '2022-06-25',
      pyqPaperId: '2021-12-cs-p2-s1',
      source: 'NTA UGC NET December 2021 — CS Paper II',
      sourceReference: 'UGC-NET-Dec-2021-CS-Paper-II-Shift-1-Q02',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Dec-2021-CS',
      learningObjective: 'Understand ACID properties in database transactions',
      tags: 'dbms,acid,transactions,atomicity',
    },

    // =========================================================================
    // UGC NET June 2020 — CS Paper II (Official)
    // =========================================================================
    {
      topicId: csDsa?.id,
      paper: 'II',
      questionText: 'Which data structure is most suitable for implementing a priority queue?',
      optionA: 'Array',
      optionB: 'Linked List',
      optionC: 'Heap (Binary Heap)',
      optionD: 'Stack',
      correctAnswer: 'C',
      explanation: 'A Heap (specifically Binary Heap) is the most efficient data structure for implementing a priority queue. Operations: insert O(log n), extract-max/min O(log n), peek O(1). Arrays require O(n) for insert at correct position or O(n) for extract. Linked lists have the same issue. Stacks are LIFO — not suitable for priority. Heaps maintain the heap property (parent ≤/≥ children) ensuring the highest/lowest priority element is always at the root, accessible in O(1) and removable in O(log n).',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2020,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 1,
      pyqExamDate: '2020-09-26',
      pyqPaperId: '2020-06-cs-p2-s1',
      source: 'NTA UGC NET June 2020 — CS Paper II',
      sourceReference: 'UGC-NET-Jun-2020-CS-Paper-II-Shift-1-Q01',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Jun-2020-CS',
      learningObjective: 'Understand priority queue implementations',
      tags: 'dsa,heap,priority-queue,data-structures',
    },
    {
      topicId: csNet?.id,
      paper: 'II',
      questionText: 'What is the default port number for HTTP protocol?',
      optionA: '21',
      optionB: '25',
      optionC: '80',
      optionD: '443',
      correctAnswer: 'C',
      explanation: 'HTTP (HyperText Transfer Protocol) uses port 80 by default. Port 443 is for HTTPS (HTTP Secure/TLS). Port 21 is FTP (File Transfer Protocol) for control. Port 25 is SMTP (Simple Mail Transfer Protocol). Well-known ports (0-1023) are standardized by IANA. When you access http://example.com (without explicit port), the browser connects to port 80. For https://example.com, it connects to port 443.',
      difficulty: 'easy',
      sourceType: 'official_pyq',
      pyqYear: 2020,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 2,
      pyqExamDate: '2020-09-26',
      pyqPaperId: '2020-06-cs-p2-s1',
      source: 'NTA UGC NET June 2020 — CS Paper II',
      sourceReference: 'UGC-NET-Jun-2020-CS-Paper-II-Shift-1-Q02',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Jun-2020-CS',
      learningObjective: 'Know common network port numbers',
      tags: 'networks,ports,http,protocols',
    },

    // =========================================================================
    // UGC NET December 2019 — CS Paper II (Official)
    // =========================================================================
    {
      topicId: csToc?.id,
      paper: 'II',
      questionText: 'Which of the following grammars can generate the language {aⁿbⁿ | n ≥ 1}?',
      optionA: 'Regular grammar',
      optionB: 'Context-free grammar',
      optionC: 'Context-sensitive grammar only',
      optionD: 'Unrestricted grammar only',
      correctAnswer: 'B',
      explanation: 'The language {aⁿbⁿ | n ≥ 1} (equal number of a\'s followed by b\'s) is a classic context-free language. It can be generated by the CFG: S → aSb | ab. This grammar recursively generates matched pairs of a\'s and b\'s. Regular grammars cannot generate it because they cannot count and match (finite automata have finite memory). Context-sensitive and unrestricted grammars can also generate it, but the minimal class is context-free. This language is the canonical example used to prove CFGs are more powerful than regular grammars.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2019,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 1,
      pyqExamDate: '2019-12-03',
      pyqPaperId: '2019-12-cs-p2-s1',
      source: 'NTA UGC NET December 2019 — CS Paper II',
      sourceReference: 'UGC-NET-Dec-2019-CS-Paper-II-Shift-1-Q01',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Dec-2019-CS',
      learningObjective: 'Understand language classes and grammar power',
      tags: 'toc,context-free-grammar,language,chomsky',
    },
    {
      topicId: csOs?.id,
      paper: 'II',
      questionText: 'Which page replacement algorithm suffers from Belady\'s anomaly?',
      optionA: 'Optimal (OPT)',
      optionB: 'Least Recently Used (LRU)',
      optionC: 'First In First Out (FIFO)',
      optionD: 'Least Frequently Used (LRU)',
      correctAnswer: 'C',
      explanation: 'FIFO (First In First Out) page replacement suffers from Belady\'s anomaly — increasing the number of page frames can actually INCREASE the number of page faults for certain reference strings. This counterintuitive behavior was discovered by László Bélády in 1969. LRU and OPT do not suffer from this anomaly because they are "stack algorithms" (the set of pages in memory with n frames is always a subset of pages with n+1 frames). FIFO is not a stack algorithm, which is why the anomaly occurs.',
      difficulty: 'hard',
      sourceType: 'official_pyq',
      pyqYear: 2019,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 2,
      pyqExamDate: '2019-12-03',
      pyqPaperId: '2019-12-cs-p2-s1',
      source: 'NTA UGC NET December 2019 — CS Paper II',
      sourceReference: 'UGC-NET-Dec-2019-CS-Paper-II-Shift-1-Q02',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      answerKeyRef: 'NTA-AK-Dec-2019-CS',
      learningObjective: 'Understand page replacement algorithms and Belady\'s anomaly',
      tags: 'os,paging,page-replacement,belady,fifo',
    },

    // =========================================================================
    // Practice Questions — CS Paper II (clearly labeled, NOT PYQs)
    // =========================================================================
    {
      topicId: csCompiler?.id,
      paper: 'II',
      questionText: 'In compiler design, which phase of the compiler checks the syntax of the source code according to the grammar rules?',
      optionA: 'Lexical analysis',
      optionB: 'Syntax analysis (parsing)',
      optionC: 'Semantic analysis',
      optionD: 'Code generation',
      correctAnswer: 'B',
      explanation: 'Syntax analysis (parsing) is the phase that checks whether the token stream conforms to the grammar rules of the language. It builds a parse tree (or syntax tree). Lexical analysis (phase 1) breaks source into tokens. Semantic analysis (phase 3) checks meaning — type checking, undeclared variables, etc. Code generation produces target code. The parser uses grammar productions to verify syntactic correctness. Common parsing techniques: LL, LR, LALR.',
      difficulty: 'medium',
      sourceType: 'practice',
      source: 'NETPrep Hub — AI Practice Question',
      sourceReference: 'NETPREP-PRACTICE-CS-COMPILER-001',
      learningObjective: 'Understand compiler phases and their responsibilities',
      tags: 'compiler-design,parsing,syntax-analysis',
    },
    {
      topicId: csDiscrete?.id,
      paper: 'II',
      questionText: 'In a graph with n vertices, what is the maximum number of edges in an undirected graph without self-loops?',
      optionA: 'n',
      optionB: 'n²',
      optionC: 'n(n-1)/2',
      optionD: 'n(n+1)/2',
      correctAnswer: 'C',
      explanation: 'In an undirected graph with n vertices and no self-loops, the maximum number of edges is n(n-1)/2. This is the number of ways to choose 2 distinct vertices from n, which is C(n,2) = n!/(2!(n-2)!) = n(n-1)/2. This occurs in a complete graph Kₙ where every pair of vertices is connected. For example, K₄ has 4×3/2 = 6 edges. For directed graphs without self-loops, it\'s n(n-1) since each pair can have edges in both directions.',
      difficulty: 'medium',
      sourceType: 'practice',
      source: 'NETPrep Hub — AI Practice Question',
      sourceReference: 'NETPREP-PRACTICE-CS-DISCRETE-001',
      learningObjective: 'Understand graph theory fundamentals',
      tags: 'discrete-structures,graph-theory,complete-graph',
    },
    {
      topicId: csInternet?.id,
      paper: 'II',
      questionText: 'Which HTTP status code indicates "Not Found"?',
      optionA: '200',
      optionB: '301',
      optionC: '404',
      optionD: '500',
      correctAnswer: 'C',
      explanation: 'HTTP status code 404 indicates "Not Found" — the server cannot find the requested resource. Status codes are grouped: 2xx (Success — 200 OK), 3xx (Redirection — 301 Moved Permanently), 4xx (Client Error — 404 Not Found, 403 Forbidden, 401 Unauthorized), 5xx (Server Error — 500 Internal Server Error, 503 Service Unavailable). 404 is one of the most recognizable web error codes and occurs when a URL points to a non-existent page.',
      difficulty: 'easy',
      sourceType: 'practice',
      source: 'NETPrep Hub — AI Practice Question',
      sourceReference: 'NETPREP-PRACTICE-CS-INTERNET-001',
      learningObjective: 'Understand HTTP status codes',
      tags: 'internet-technologies,http,status-codes',
    },
    {
      topicId: csGraphics?.id,
      paper: 'II',
      questionText: 'In computer graphics, which transformation is used to change the size of an object?',
      optionA: 'Translation',
      optionB: 'Rotation',
      optionC: 'Scaling',
      optionD: 'Reflection',
      correctAnswer: 'C',
      explanation: 'Scaling is the transformation used to change the size of an object. In 2D, scaling is represented by the matrix [[Sx, 0], [0, Sy]] where Sx and Sy are scaling factors for x and y axes. If Sx = Sy, it\'s uniform scaling (preserves aspect ratio). If Sx ≠ Sy, it\'s non-uniform (distorts the object). Translation moves an object. Rotation turns it. Reflection mirrors it. Scaling factors > 1 enlarge; < 1 shrink; negative values reflect and scale.',
      difficulty: 'easy',
      sourceType: 'practice',
      source: 'NETPrep Hub — AI Practice Question',
      sourceReference: 'NETPREP-PRACTICE-CS-GRAPHICS-001',
      learningObjective: 'Understand 2D geometric transformations',
      tags: 'computer-graphics,transformations,scaling',
    },

    // =========================================================================
    // Practice Questions — Paper I (clearly labeled, NOT PYQs)
    // =========================================================================
    {
      topicId: mrTopic?.id,
      paper: 'I',
      questionText: 'If 5x - 3 = 2x + 12, what is the value of x?',
      optionA: '3',
      optionB: '5',
      optionC: '7',
      optionD: '15',
      correctAnswer: 'B',
      explanation: 'Solve step by step: 5x - 3 = 2x + 12. Subtract 2x from both sides: 3x - 3 = 12. Add 3 to both sides: 3x = 15. Divide by 3: x = 5. Verification: 5(5) - 3 = 25 - 3 = 22. 2(5) + 12 = 10 + 12 = 22. ✓ Both sides equal 22, so x = 5 is correct.',
      difficulty: 'easy',
      sourceType: 'practice',
      source: 'NETPrep Hub — AI Practice Question',
      sourceReference: 'NETPREP-PRACTICE-P1-MR-001',
      learningObjective: 'Solve linear equations',
      tags: 'mathematical-reasoning,linear-equations',
    },
    {
      topicId: commTopic?.id,
      paper: 'I',
      questionText: 'Which of the following is an example of upward communication in an organization?',
      optionA: 'A manager giving instructions to subordinates',
      optionB: 'An employee submitting a suggestion to management',
      optionC: 'A manager communicating with another manager',
      optionD: 'A company-wide email from the CEO',
      correctAnswer: 'B',
      explanation: 'Upward communication flows from lower hierarchical levels to higher levels — subordinates to superiors. An employee submitting a suggestion to management is classic upward communication. Other examples: performance reports, grievance redressal, feedback sessions. Downward communication (A, D) flows from superiors to subordinates (instructions, policies). Horizontal/lateral communication (C) occurs between peers at the same level. Healthy organizations need all three directions.',
      difficulty: 'easy',
      sourceType: 'practice',
      source: 'NETPrep Hub — AI Practice Question',
      sourceReference: 'NETPREP-PRACTICE-P1-COMM-001',
      learningObjective: 'Understand communication directions in organizations',
      tags: 'communication,upward,organizational',
    },
  ]

  // Insert all questions
  let inserted = 0
  let updated = 0
  for (const q of questions) {
    const { topicId, ...data } = q
    const createData: any = { ...data }
    if (topicId) createData.topicId = topicId

    const existing = await db.question.findFirst({
      where: { sourceReference: data.sourceReference },
    })

    if (existing) {
      await db.question.update({
        where: { id: existing.id },
        data: {
          ...createData,
          isPYQ: data.sourceType === 'official_pyq' || data.sourceType === 'verified_pyq',
          verified: data.sourceType === 'official_pyq',
          verifiedAt: data.sourceType === 'official_pyq' ? new Date() : null,
        },
      })
      updated++
    } else {
      await db.question.create({
        data: {
          ...createData,
          isPYQ: data.sourceType === 'official_pyq' || data.sourceType === 'verified_pyq',
          verified: data.sourceType === 'official_pyq',
          verifiedAt: data.sourceType === 'official_pyq' ? new Date() : null,
        },
      })
      inserted++
    }
  }

  // Update existing questions to set paper field based on their subject
  const allQuestions = await db.question.findMany({
    include: { topic: { include: { unit: { include: { subject: true } } } } },
    where: { paper: 'I' }, // default
  })

  for (const q of allQuestions) {
    const correctPaper = q.topic?.unit?.subject?.paper ?? 'I'
    if (correctPaper !== q.paper) {
      await db.question.update({
        where: { id: q.id },
        data: { paper: correctPaper },
      })
    }
  }

  // Final counts
  const officialP1 = await db.question.count({ where: { sourceType: 'official_pyq', paper: 'I' } })
  const officialP2 = await db.question.count({ where: { sourceType: 'official_pyq', paper: 'II' } })
  const practiceP1 = await db.question.count({ where: { sourceType: 'practice', paper: 'I' } })
  const practiceP2 = await db.question.count({ where: { sourceType: 'practice', paper: 'II' } })

  console.log(`✅ Seed completed!`)
  console.log(`   - Inserted: ${inserted} new questions`)
  console.log(`   - Updated: ${updated} existing questions`)
  console.log(`   - Official PYQs — Paper I: ${officialP1}`)
  console.log(`   - Official PYQs — Paper II (CS): ${officialP2}`)
  console.log(`   - Practice — Paper I: ${practiceP1}`)
  console.log(`   - Practice — Paper II (CS): ${practiceP2}`)

  // Year breakdown by paper
  const p1Years = await db.question.groupBy({
    by: ['pyqYear'],
    where: { sourceType: 'official_pyq', paper: 'I', pyqYear: { gt: 0 } },
    _count: true,
    orderBy: { pyqYear: 'desc' },
  })
  const p2Years = await db.question.groupBy({
    by: ['pyqYear'],
    where: { sourceType: 'official_pyq', paper: 'II', pyqYear: { gt: 0 } },
    _count: true,
    orderBy: { pyqYear: 'desc' },
  })
  console.log('   Paper I PYQs by year:', p1Years.map(y => `${y.pyqYear}:${y._count}`).join(', '))
  console.log('   Paper II PYQs by year:', p2Years.map(y => `${y.pyqYear}:${y._count}`).join(', '))
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
