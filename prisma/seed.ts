/**
 * Seed script for NETPrep Hub — UGC NET Preparation Platform
 * Populates database with realistic UGC NET content.
 *
 * Run: `bun run db:seed` (or `bun prisma/seed.ts`)
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding NETPrep Hub database...')

  // -------------------------------------------------------------------------
  // Subjects
  // -------------------------------------------------------------------------
  const paper1 = await db.subject.create({
    data: {
      slug: 'paper-1',
      name: 'Paper I — Teaching & Research Aptitude',
      code: '00',
      paper: 'I',
      description:
        'Common Paper I for all UGC NET aspirants. Covers teaching aptitude, research aptitude, comprehension, communication, logical reasoning, data interpretation, ICT, people & environment, and higher education.',
      icon: 'GraduationCap',
      color: 'from-emerald-500 to-teal-600',
      sortOrder: 0,
    },
  })

  const cs = await db.subject.create({
    data: {
      slug: 'computer-science',
      name: 'Computer Science & Applications',
      code: '08',
      paper: 'II',
      description:
        'Paper II for Computer Science aspirants. Covers digital logic, programming, data structures, algorithms, DBMS, OS, networks, software engineering, AI, and theory of computation.',
      icon: 'Cpu',
      color: 'from-violet-500 to-purple-600',
      sortOrder: 1,
    },
  })

  const commerce = await db.subject.create({
    data: {
      slug: 'commerce',
      name: 'Commerce',
      code: '17',
      paper: 'II',
      description:
        'Paper II for Commerce aspirants. Covers business environment, accounting, finance, marketing, HR, international business, and statistics.',
      icon: 'Briefcase',
      color: 'from-amber-500 to-orange-600',
      sortOrder: 2,
    },
  })

  const management = await db.subject.create({
    data: {
      slug: 'management',
      name: 'Management',
      code: '17B',
      paper: 'II',
      description:
        'Paper II for Management aspirants. Covers organizational behaviour, HRM, marketing, finance, operations, and strategic management.',
      icon: 'TrendingUp',
      color: 'from-rose-500 to-pink-600',
      sortOrder: 3,
    },
  })

  const english = await db.subject.create({
    data: {
      slug: 'english',
      name: 'English Literature',
      code: '30',
      paper: 'II',
      description:
        'Paper II for English Literature aspirants. Covers British literature, Indian writing in English, American literature, literary criticism, and theory.',
      icon: 'BookOpen',
      color: 'from-cyan-500 to-blue-500',
      sortOrder: 4,
    },
  })

  // -------------------------------------------------------------------------
  // Units — Paper I
  // -------------------------------------------------------------------------
  const p1Units = [
    { slug: 'teaching-aptitude', name: 'Teaching Aptitude', number: 1, description: 'Nature, objectives, characteristics, learner characteristics, methods, evaluation systems.' },
    { slug: 'research-aptitude', name: 'Research Aptitude', number: 2, description: 'Research meaning, characteristics, types, methods, steps, paper/article writing, thesis, ethics.' },
    { slug: 'comprehension', name: 'Reading Comprehension', number: 3, description: 'Unseen passage-based questions.' },
    { slug: 'communication', name: 'Communication', number: 4, description: 'Meaning, types, characteristics, barriers, effective communication, mass communication.' },
    { slug: 'mathematical-reasoning', name: 'Mathematical Reasoning & Aptitude', number: 5, description: 'Series, coding-decoding, blood relations, odd one out, mathematical puzzles.' },
    { slug: 'logical-reasoning', name: 'Logical Reasoning', number: 6, description: 'Arguments, analogies, Indian logic, pramanas, deductive/inductive reasoning.' },
    { slug: 'data-interpretation', name: 'Data Interpretation', number: 7, description: 'Sources, acquisition, classification, quantitative & qualitative data, graphs, charts.' },
    { slug: 'ict', name: 'Information & Communication Technology (ICT)', number: 8, description: 'ICT basics, internet, cloud, applications in education, security.' },
    { slug: 'people-environment', name: 'People, Development & Environment', number: 9, description: 'Development & environment, ecological issues, pollution, climate, sustainable development.' },
    { slug: 'higher-education', name: 'Higher Education System', number: 10, description: 'Institutions, governance, professional education, policies, value & skill education.' },
  ]

  // importance lookup per unit (Paper I)
  const p1Importance: Record<string, string> = {
    'teaching-aptitude': 'high',
    'research-aptitude': 'high',
    'comprehension': 'medium',
    'communication': 'high',
    'mathematical-reasoning': 'medium',
    'logical-reasoning': 'high',
    'data-interpretation': 'high',
    'ict': 'medium',
    'people-environment': 'medium',
    'higher-education': 'high',
  }

  for (const u of p1Units) {
    const unit = await db.unit.create({
      data: { ...u, subjectId: paper1.id, sortOrder: u.number },
    })

    // Add 2-3 topics per unit for Paper I
    const topicsByUnit: Record<string, string[]> = {
      'teaching-aptitude': ['Concept of Teaching', 'Learner Characteristics', 'Teaching Methods', 'Evaluation Systems'],
      'research-aptitude': ['Types of Research', 'Steps of Research', 'Thesis & Article Writing', 'Research Ethics'],
      'comprehension': ['Tone & Purpose', 'Inference Drawing', 'Vocabulary in Context'],
      'communication': ['Types of Communication', 'Barriers to Communication', 'Mass Communication'],
      'mathematical-reasoning': ['Number Series', 'Coding-Decoding', 'Blood Relations'],
      'logical-reasoning': ['Structure of Arguments', 'Analogies', 'Indian Logic (Pramanas)'],
      'data-interpretation': ['Tabular Data', 'Bar Charts', 'Pie Charts', 'Line Graphs'],
      'ict': ['Internet & Web', 'Cloud Computing', 'ICT in Education'],
      'people-environment': ['Environmental Issues', 'Sustainable Development', 'Climate Change'],
      'higher-education': ['Indian Education System', 'Policies & Commissions', 'Value Education'],
    }
    const topics = topicsByUnit[u.slug] ?? ['Overview']
    for (let i = 0; i < topics.length; i++) {
      await db.topic.create({
        data: {
          slug: `${u.slug}-topic-${i + 1}`,
          unitId: unit.id,
          name: topics[i],
          description: `Core concept under ${u.name}.`,
          importance: p1Importance[u.slug] ?? 'medium',
          sortOrder: i + 1,
        },
      })
    }
  }

  // -------------------------------------------------------------------------
  // Units — Computer Science
  // -------------------------------------------------------------------------
  const csUnits = [
    { slug: 'digital-logic', name: 'Digital Logic', number: 1, description: 'Boolean algebra, logic gates, combinational & sequential circuits.' },
    { slug: 'programming', name: 'Programming & Data Structures', number: 2, description: 'C/C++, pointers, recursion, arrays, stacks, queues, linked lists, trees, graphs.' },
    { slug: 'dsa', name: 'Algorithms', number: 3, description: 'Asymptotic analysis, sorting, searching, dynamic programming, greedy, graph algorithms.' },
    { slug: 'dbms', name: 'Database Management Systems', number: 4, description: 'ER model, normalization, SQL, transactions, indexing, concurrency.' },
    { slug: 'os', name: 'Operating Systems', number: 5, description: 'Process management, scheduling, deadlocks, memory management, file systems.' },
    { slug: 'networks', name: 'Computer Networks', number: 6, description: 'OSI/TCP-IP, routing, transport protocols, application layer, security.' },
    { slug: 'se', name: 'Software Engineering', number: 7, description: 'SDLC, models, testing, metrics, project management.' },
    { slug: 'toc', name: 'Theory of Computation', number: 8, description: 'Automata, grammars, Turing machines, decidability.' },
    { slug: 'coa', name: 'Computer Organization & Architecture', number: 9, description: 'Machine instructions, addressing modes, ALU, pipelining, memory hierarchy.' },
    { slug: 'ai', name: 'Artificial Intelligence', number: 10, description: 'Search, knowledge representation, ML basics, neural networks, NLP.' },
  ]
  const csImportance: Record<string, string> = {
    'digital-logic': 'high',
    'programming': 'high',
    'dsa': 'high',
    'dbms': 'high',
    'os': 'high',
    'networks': 'high',
    'se': 'medium',
    'toc': 'medium',
    'coa': 'medium',
    'ai': 'medium',
  }

  for (const u of csUnits) {
    const unit = await db.unit.create({
      data: { ...u, subjectId: cs.id, sortOrder: u.number },
    })

    const topicsByUnit: Record<string, string[]> = {
      'digital-logic': ['Boolean Algebra', 'Logic Gates', 'Combinational Circuits', 'Sequential Circuits'],
      'programming': ['Pointers & Recursion', 'Stacks & Queues', 'Linked Lists', 'Trees & Graphs'],
      'dsa': ['Asymptotic Analysis', 'Sorting Algorithms', 'Dynamic Programming', 'Graph Algorithms'],
      'dbms': ['ER Model & Normalization', 'SQL & Joins', 'Transactions & ACID', 'Indexing & Hashing'],
      'os': ['Process Scheduling', 'Deadlocks', 'Memory Management', 'File Systems'],
      'networks': ['OSI vs TCP/IP', 'Routing Protocols', 'TCP & UDP', 'Network Security'],
      'se': ['SDLC Models', 'Software Testing', 'Cyclomatic Complexity'],
      'toc': ['Finite Automata', 'Context Free Grammars', 'Turing Machines'],
      'coa': ['Addressing Modes', 'Pipelining', 'Cache & Memory Hierarchy'],
      'ai': ['Search Algorithms', 'Neural Networks', 'Natural Language Processing'],
    }
    const topics = topicsByUnit[u.slug] ?? ['Overview']
    for (let i = 0; i < topics.length; i++) {
      await db.topic.create({
        data: {
          slug: `cs-${u.slug}-topic-${i + 1}`,
          unitId: unit.id,
          name: topics[i],
          description: `Core concept under ${u.name}.`,
          importance: csImportance[u.slug] ?? 'medium',
          sortOrder: i + 1,
        },
      })
    }
  }

  // -------------------------------------------------------------------------
  // Units — Commerce (compressed)
  // -------------------------------------------------------------------------
  const commerceUnits = [
    { slug: 'business-environment', name: 'Business Environment', number: 1, description: 'Macro & micro environment, economic systems, government policy.' },
    { slug: 'accounting', name: 'Accounting & Finance', number: 2, description: 'Financial accounting, corporate accounting, costing.' },
    { slug: 'marketing', name: 'Marketing Management', number: 3, description: 'Marketing mix, segmentation, consumer behaviour.' },
    { slug: 'hrm', name: 'Human Resource Management', number: 4, description: 'HR planning, recruitment, training, performance.' },
  ]
  const commerceImportance: Record<string, string> = {
    'business-environment': 'high',
    'accounting': 'high',
    'marketing': 'high',
    'hrm': 'medium',
  }
  for (const u of commerceUnits) {
    const unit = await db.unit.create({
      data: { ...u, subjectId: commerce.id, sortOrder: u.number },
    })
    const topics = ['Core Concepts', 'Practical Applications', 'Recent Trends']
    for (let i = 0; i < topics.length; i++) {
      await db.topic.create({
        data: {
          slug: `comm-${u.slug}-topic-${i + 1}`,
          unitId: unit.id,
          name: topics[i],
          description: `Key topic under ${u.name}.`,
          importance: commerceImportance[u.slug] ?? 'medium',
          sortOrder: i + 1,
        },
      })
    }
  }

  // -------------------------------------------------------------------------
  // Notes — Paper I (teaching aptitude + research aptitude)
  // -------------------------------------------------------------------------
  const taTopic = await db.topic.findFirst({
    where: { slug: 'teaching-aptitude-topic-1' },
  })
  const raTopic = await db.topic.findFirst({
    where: { slug: 'research-aptitude-topic-1' },
  })
  const commTopic = await db.topic.findFirst({
    where: { slug: 'communication-topic-1' },
  })
  const lrTopic = await db.topic.findFirst({
    where: { slug: 'logical-reasoning-topic-1' },
  })

  if (taTopic) {
    await db.note.create({
      data: {
        slug: 'concept-of-teaching',
        title: 'Concept of Teaching: Nature, Objectives & Characteristics',
        excerpt:
          'A complete walkthrough of what teaching is, its nature, key objectives, characteristics, and the modern shift from teacher-centred to learner-centred approaches.',
        content: `# Concept of Teaching

Teaching is one of the oldest and most respected professions in human history. In the context of UGC NET Paper I, understanding the **concept of teaching** is foundational — almost every other topic in Teaching Aptitude builds on it.

## Nature of Teaching

Teaching is a **tripolar process** involving:

1. **Teacher** — the facilitator
2. **Learner** — the one who learns
3. **Subject matter** — the content

Some scholars describe it as a **bipolar** process (teacher–learner) or even a **quadripolar** process that adds *context* and *curriculum*.

> **Key idea:** Teaching is not merely delivering information — it is an *intentional, planned interaction* designed to bring about desirable changes in learner behaviour.

## Objectives of Teaching

At different levels, teaching objectives change:

| Level | Focus |
| --- | --- |
| **School** | Basic literacy, numeracy, socialisation |
| **College** | Subject mastery, analytical thinking |
| **University** | Research orientation, critical inquiry, knowledge creation |

### Bloom's Taxonomy

Benjamin Bloom (1956) classified educational objectives into three domains:

- **Cognitive** — knowledge, comprehension, application, analysis, synthesis, evaluation
- **Affective** — receiving, responding, valuing, organisation, characterisation
- **Psychomotor** — perception, set, guided response, mechanism, complex overt response

## Characteristics of Modern Teaching

- **Learner-centred** — focuses on the needs of the student
- **Interactive** — two-way communication
- **Continuous** — a lifelong process
- **Diagnostic** — identifies learning gaps
- **Remedial** — addresses identified weaknesses
- **Democratic** — respects learner's voice

## Shift in Paradigm

| Traditional | Modern |
| --- | --- |
| Teacher-centred | Learner-centred |
| One-way | Two-way / collaborative |
| Rote learning | Constructivist |
| Examination-driven | Outcome-driven |
| Fixed syllabus | Flexible curriculum |

## Exam Tip

For UGC NET, expect assertion–reason questions and match-the-following questions on:

- Teaching characteristics
- Bloom's levels
- Teacher–learner relationship

## Quick Revision

- Teaching = intentional, planned interaction
- Tripolar: teacher + learner + subject
- Bloom's 3 domains: cognitive, affective, psychomotor
- Modern teaching = learner-centred, interactive, continuous, diagnostic, remedial
`,
        readingTime: 6,
        difficulty: 'easy',
        subjectId: paper1.id,
        topicId: taTopic.id,
        tags: 'teaching,aptitude,bloom,tripolar',
        featured: true,
        views: 1240,
      },
    })
  }

  if (raTopic) {
    await db.note.create({
      data: {
        slug: 'types-of-research',
        title: 'Types of Research: A Complete Classification',
        excerpt:
          'Fundamental vs applied, quantitative vs qualitative, descriptive vs analytical, conceptual vs empirical — every research type with examples and exam-ready distinctions.',
        content: `# Types of Research

Research is a **systematic, scientific, and critical investigation** aimed at discovering new facts, verifying existing knowledge, or establishing new principles.

## Major Classifications

### 1. On the basis of purpose

| Type | Goal | Example |
| --- | --- | --- |
| **Pure / Fundamental** | Expand knowledge | Newton's laws, theory of relativity |
| **Applied** | Solve practical problems | Vaccine development, crop yield improvement |
| **Action** | Improve own practice | Teacher improving classroom method |
| **Evaluation** | Assess programme effectiveness | Mid-day meal scheme evaluation |

### 2. On the basis of method

- **Descriptive** — describes "what is" (surveys, case studies)
- **Analytical** — uses already available facts, analyses them
- **Historical** — studies past events
- **Experimental** — manipulates variables to observe effects

### 3. On the basis of data

| Type | Data | Tools |
| --- | --- | --- |
| **Quantitative** | Numerical | Statistics, surveys |
| **Qualitative** | Narrative / textual | Interviews, observations |

### 4. Conceptual vs Empirical

- **Conceptual** — abstract ideas, theories (e.g., philosophy papers)
- **Empirical** — based on observation/experience (most social science research)

## Steps of Research

1. Formulation of problem
2. Literature review
3. Hypothesis formulation
4. Research design
5. Sampling
6. Data collection
7. Data analysis
8. Interpretation
9. Report writing

## Exam Tip

A very common UGC NET pattern is matching research types with examples. Remember:

> "Action research is *for* the practitioner, *by* the practitioner, *on* the practitioner's own practice."

## Quick Revision

- Pure = knowledge, Applied = problem-solving, Action = self-improvement
- Quantitative = numbers, Qualitative = narratives
- Conceptual = ideas, Empirical = observation
- 9 steps of research (problem → review → hypothesis → design → sample → collect → analyse → interpret → report)
`,
        readingTime: 7,
        difficulty: 'medium',
        subjectId: paper1.id,
        topicId: raTopic.id,
        tags: 'research,types,quantitative,qualitative',
        featured: true,
        views: 980,
      },
    })
  }

  if (commTopic) {
    await db.note.create({
      data: {
        slug: 'barriers-to-communication',
        title: 'Barriers to Communication & How to Overcome Them',
        excerpt:
          'Semantic, psychological, organisational, physical, and cultural barriers explained with concrete examples and remedies.',
        content: `# Barriers to Communication

Effective communication is the backbone of teaching, research, and professional life. But communication rarely flows perfectly — it encounters **barriers** that distort, block, or weaken the message.

## Types of Barriers

### 1. Semantic / Language Barriers

- Use of jargon
- Ambiguous words
- Poor translation
- Different meanings to different people

### 2. Psychological Barriers

- Prejudice and bias
- Emotional state (anger, fear)
- Closed mind
- Status consciousness

### 3. Organisational / Structural Barriers

- Long hierarchical chains
- Rigid rules
- Poor feedback mechanism
- Information overload or filtering

### 4. Physical Barriers

- Noise
- Distance
- Faulty equipment
- Time

### 5. Cultural Barriers

- Differences in customs
- Body language interpretation
- Religious beliefs
- Taboos

## How to Overcome Barriers

- Use **simple, clear language**
- Ensure **two-way communication**
- Encourage **feedback**
- Build **empathy** and active listening
- Use **multiple channels** (verbal + visual)
- Reduce **hierarchy** in communication flow

## Exam Tip

Assertion–Reason questions often test whether you can distinguish barrier *types*. Match each barrier with the correct category.

## Quick Revision

- 5 barriers: semantic, psychological, organisational, physical, cultural
- Remedies: clarity, feedback, empathy, multi-channel, flat structure
`,
        readingTime: 5,
        difficulty: 'easy',
        subjectId: paper1.id,
        topicId: commTopic.id,
        tags: 'communication,barriers',
        views: 640,
      },
    })
  }

  if (lrTopic) {
    await db.note.create({
      data: {
        slug: 'structure-of-arguments',
        title: 'Structure of Arguments: Premise, Conclusion, Validity',
        excerpt:
          'Understand arguments in logic: premises, conclusion, deductive vs inductive reasoning, validity vs soundness, with worked examples.',
        content: `# Structure of Arguments

In logic, an **argument** is a set of statements where some statements (called *premises*) are offered to support another statement (the *conclusion*).

## Basic Structure

\`\`\`
Premise 1: All humans are mortal.
Premise 2: Socrates is a human.
Conclusion: Therefore, Socrates is mortal.
\`\`\`

## Deductive vs Inductive Reasoning

| Aspect | Deductive | Inductive |
| --- | --- | --- |
| Direction | General → Specific | Specific → General |
| Certainty | Certain (if premises true) | Probable |
| Example | All men are mortal → Socrates is mortal | The sun rose every day → it will rise tomorrow |

## Validity and Soundness

- **Valid argument** — if premises are true, conclusion *must* be true
- **Sound argument** — valid AND premises are actually true
- **Invalid** — conclusion does not follow from premises

## Indian Logic: Pramanas

Indian philosophy recognises multiple **pramanas** (means of valid knowledge):

1. **Pratyaksha** — perception
2. **Anumana** — inference
3. **Upamana** — comparison/analogy
4. **Shabda** — verbal testimony
5. **Arthapatti** — postulation
6. **Anupalabdhi** — non-apprehension

## Exam Tip

UGC NET often gives 4 statements and asks which one is the conclusion. Identify the **indicator words**:

- Premise indicators: *because, since, as, for*
- Conclusion indicators: *therefore, hence, thus, so*

## Quick Revision

- Argument = premises + conclusion
- Deductive = general → specific (certain)
- Inductive = specific → general (probable)
- Valid = conclusion follows; Sound = valid + true premises
- 6 pramanas (Nyaya accepts 4, Advaita accepts 6)
`,
        readingTime: 8,
        difficulty: 'hard',
        subjectId: paper1.id,
        topicId: lrTopic.id,
        tags: 'logic,argument,deductive,inductive,pramana',
        views: 720,
      },
    })
  }

  // -------------------------------------------------------------------------
  // Notes — Computer Science (2 notes)
  // -------------------------------------------------------------------------
  const normTopic = await db.topic.findFirst({ where: { slug: 'cs-dbms-topic-1' } })
  const sortingTopic = await db.topic.findFirst({ where: { slug: 'cs-dsa-topic-2' } })

  if (normTopic) {
    await db.note.create({
      data: {
        slug: 'normalization-in-dbms',
        title: 'Normalization in DBMS: 1NF, 2NF, 3NF, BCNF Explained',
        excerpt:
          'A complete walkthrough of database normalization with worked examples, anomalies, and the functional dependency theory behind each normal form.',
        content: `# Normalization in DBMS

**Normalization** is the process of organising data in a database to reduce redundancy and improve data integrity. It was introduced by **Edgar F. Codd**, the father of relational databases.

## Why Normalize?

Without normalization, databases suffer from **anomalies**:

- **Insertion anomaly** — cannot insert data without some other unrelated data
- **Update anomaly** — updating one row requires updating many
- **Deletion anomaly** — deleting one fact unintentionally removes another

## Functional Dependency

If attribute B *functionally depends* on A (written **A → B**), then for every value of A there is exactly one value of B.

## Normal Forms

### 1NF — First Normal Form

A relation is in 1NF if every attribute contains only **atomic** (indivisible) values.

❌ Bad: Phone = "9876543210, 9123456789"
✅ Good: Separate rows or separate table

### 2NF — Second Normal Form

A relation is in 2NF if:

1. It is in 1NF
2. Every non-prime attribute is **fully functionally dependent** on the primary key (no partial dependency)

**Partial dependency** exists when a non-key attribute depends on only part of a composite key.

### 3NF — Third Normal Form

A relation is in 3NF if:

1. It is in 2NF
2. No **transitive dependency** exists (A → B → C, where A is key, B is non-key, C is non-key)

### BCNF — Boyce-Codd Normal Form

A relation is in BCNF if, for every non-trivial functional dependency X → Y, **X is a super key**.

BCNF is stricter than 3NF — every BCNF relation is in 3NF, but not vice versa.

## Worked Example

Consider:

\`\`\`
Student_Course (StudentID, StudentName, CourseID, CourseName, Instructor)
\`\`\`

**Functional Dependencies:**

- StudentID → StudentName
- CourseID → CourseName, Instructor
- (StudentID, CourseID) → all attributes (primary key)

### Step 1 — 1NF

Assume atomic values → already in 1NF.

### Step 2 — 2NF

Remove partial dependencies:

- **Student (StudentID, StudentName)**
- **Course (CourseID, CourseName, Instructor)**
- **Enrollment (StudentID, CourseID)**

### Step 3 — 3NF

Check transitive dependencies in Course:

- CourseID → CourseName, Instructor → no further dependency → 3NF ✅

## Exam Tip

UGC NET frequently asks:

> Given FD set, identify the highest normal form.

Always decompose step-by-step: 1NF → 2NF (remove partial) → 3NF (remove transitive) → BCNF (every determinant is super key).

## Quick Revision

- Anomalies: insertion, update, deletion
- 1NF: atomic values
- 2NF: no partial dependency
- 3NF: no transitive dependency
- BCNF: every determinant is a super key
`,
        readingTime: 9,
        difficulty: 'hard',
        subjectId: cs.id,
        topicId: normTopic.id,
        tags: 'dbms,normalization,bcnf,functional-dependency',
        featured: true,
        views: 1520,
      },
    })
  }

  if (sortingTopic) {
    await db.note.create({
      data: {
        slug: 'sorting-algorithms-comparison',
        title: 'Sorting Algorithms: Complexity, Stability & When to Use',
        excerpt:
          'Bubble, selection, insertion, merge, quick, heap sort — all compared with time/space complexity, stability, and ideal use cases.',
        content: `# Sorting Algorithms

Sorting is the process of arranging data in a particular order (ascending or descending). It is one of the most frequently asked topics in UGC NET Computer Science.

## Comparison Table

| Algorithm | Best | Average | Worst | Space | Stable? |
| --- | --- | --- | --- | --- | --- |
| **Bubble Sort** | O(n) | O(n²) | O(n²) | O(1) | Yes |
| **Selection Sort** | O(n²) | O(n²) | O(n²) | O(1) | No |
| **Insertion Sort** | O(n) | O(n²) | O(n²) | O(1) | Yes |
| **Merge Sort** | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| **Quick Sort** | O(n log n) | O(n log n) | O(n²) | O(log n) | No |
| **Heap Sort** | O(n log n) | O(n log n) | O(n log n) | O(1) | No |

## Key Properties

### Stable Sort

A sort is **stable** if equal elements retain their relative order. Important when sorting records by multiple keys.

### In-place Sort

Uses O(1) extra memory (e.g., bubble, insertion, heap).

### Adaptive Sort

Performance improves on already-sorted input (bubble, insertion with O(n) best case).

## When to Use Which?

- **Small n (~10):** Insertion sort — low overhead
- **Large n, stability needed:** Merge sort
- **Large n, average fast:** Quick sort (in practice fastest)
- **Large n, guaranteed O(n log n) + in-place:** Heap sort
- **Nearly sorted:** Insertion sort

## Quick Sort — How It Works

1. Pick a pivot (first, last, random, or median-of-three)
2. Partition: smaller to left, larger to right
3. Recurse on left and right sub-arrays

**Worst case:** Already sorted + pivot is first/last element → O(n²)
**Best case:** Pivot always splits in half → O(n log n)

## Merge Sort — How It Works

1. Divide array into halves
2. Recursively sort each half
3. Merge the two sorted halves

Always O(n log n) but requires O(n) extra space.

## Heap Sort — How It Works

1. Build a max-heap from the array
2. Swap root (max) with last element
3. Reduce heap size and heapify
4. Repeat

## Exam Tip

Common UGC NET question:

> Which sorting algorithm is best suited for sorting a linked list?

Answer: **Merge sort** — because linked lists do not allow random access, which quicksort and heapsort need.

## Quick Revision

- **Stable:** bubble, insertion, merge
- **In-place:** bubble, selection, insertion, quick, heap
- **Adaptive:** bubble, insertion
- **Best for linked list:** merge sort
- **Best worst-case among comparison sorts:** merge, heap (O(n log n))
`,
        readingTime: 8,
        difficulty: 'medium',
        subjectId: cs.id,
        topicId: sortingTopic.id,
        tags: 'dsa,sorting,quicksort,mergesort,complexity',
        featured: true,
        views: 1380,
      },
    })
  }

  // -------------------------------------------------------------------------
  // Cheat Sheets
  // -------------------------------------------------------------------------
  const sortingCs = await db.topic.findFirst({ where: { slug: 'cs-dsa-topic-2' } })
  if (sortingCs) {
    await db.cheatSheet.create({
      data: {
        slug: 'dsa-cheat-sheet',
        title: 'Data Structures & Algorithms — One-Page Cheat Sheet',
        summary: 'Big-O notations, all major data structures, and algorithm patterns in one quick-revision sheet.',
        content: `# DSA Cheat Sheet

## Big-O Complexity

| Complexity | Name | Example |
| --- | --- | --- |
| O(1) | Constant | Array access |
| O(log n) | Logarithmic | Binary search |
| O(n) | Linear | Linear search |
| O(n log n) | Linearithmic | Merge sort |
| O(n²) | Quadratic | Bubble sort |
| O(2ⁿ) | Exponential | Naive recursion (TSP) |

## Data Structures at a Glance

| Structure | Access | Search | Insert | Delete |
| --- | --- | --- | --- | --- |
| Array | O(1) | O(n) | O(n) | O(n) |
| Linked List | O(n) | O(n) | O(1)* | O(1)* |
| Stack (array) | O(n) | O(n) | O(1) push | O(1) pop |
| Queue (linked) | O(n) | O(n) | O(1) enqueue | O(1) dequeue |
| Hash Table | — | O(1) avg | O(1) avg | O(1) avg |
| BST (balanced) | O(log n) | O(log n) | O(log n) | O(log n) |
| Heap | O(1) peek | O(n) | O(log n) | O(log n) |

*at known position

## Algorithm Patterns

- **Two pointers** — pair sum, palindrome
- **Sliding window** — max sum subarray of size k
- **BFS / DFS** — graph traversal
- **Backtracking** — N-queens, sudoku
- **DP** — knapsack, LCS, matrix chain
- **Greedy** — Huffman, Kruskal, Dijkstra
- **Divide & conquer** — merge sort, quick sort

## Graph Algorithms

| Algorithm | Use | Complexity |
| --- | --- | --- |
| BFS | Shortest path (unweighted) | O(V + E) |
| DFS | Connectivity, cycle | O(V + E) |
| Dijkstra | Shortest path (weighted, +ve) | O((V + E) log V) |
| Bellman-Ford | Shortest path (with -ve) | O(VE) |
| Floyd-Warshall | All pairs shortest | O(V³) |
| Kruskal | MST | O(E log E) |
| Prim | MST | O(E log V) |
`,
        subjectId: cs.id,
        topicId: sortingCs.id,
        tags: 'dsa,cheatsheet,big-o',
        featured: true,
      },
    })
  }

  const taTopic2 = await db.topic.findFirst({ where: { slug: 'teaching-aptitude-topic-1' } })
  if (taTopic2) {
    await db.cheatSheet.create({
      data: {
        slug: 'teaching-aptitude-cheat-sheet',
        title: 'Teaching Aptitude — Last-Minute Revision Sheet',
        summary: 'Bloom\'s taxonomy, teaching characteristics, learner centred methods, evaluation systems — all on one page.',
        content: `# Teaching Aptitude — Cheat Sheet

## Bloom's Taxonomy

### Cognitive Domain (revised, 2001 — Anderson & Krathwohl)

| Level | Verb | Example |
| --- | --- | --- |
| Remember | define, list | List the planets |
| Understand | explain, summarise | Summarise the chapter |
| Apply | solve, use | Use Pythagoras theorem |
| Analyse | compare, contrast | Compare two poems |
| Evaluate | judge, criticise | Critique an argument |
| Create | design, compose | Compose a poem |

### Affective & Psychomotor

- Affective: receiving → responding → valuing → organisation → characterisation
- Psychomotor: perception → set → guided response → mechanism → complex response

## Teaching Methods

| Method | Description |
| --- | --- |
| Lecture | One-way, large group |
| Discussion | Two-way, peer learning |
| Demonstration | Show how |
| Project | Hands-on, long |
| Case study | Real-world scenario |
| Role play | Simulated experience |
| flipped classroom | Pre-class material + in-class activity |

## Evaluation Systems

- **Formative** — during learning (quizzes, feedback)
- **Summative** — end of course (final exam)
- **Norm-referenced** — relative ranking
- **Criterion-referenced** — against fixed criteria
- **Continuous & Comprehensive Evaluation (CCE)** — both academic & co-curricular

## Key Distinctions

- **Teaching vs Instruction:** Teaching is broader; instruction is specific skill transfer
- **Training vs Education:** Training is skill-specific; education is holistic
- **Indoctrination vs Teaching:** Indoctrination discourages questioning
`,
        subjectId: paper1.id,
        topicId: taTopic2.id,
        tags: 'teaching,bloom,evaluation',
        featured: true,
      },
    })
  }

  // -------------------------------------------------------------------------
  // Books
  // -------------------------------------------------------------------------
  await db.book.createMany({
    data: [
      {
        slug: 'trueman-paper-1',
        title: 'Trueman\'s UGC NET / SET General Paper I',
        author: 'M. Gagan & Sajit Kumar',
        publisher: 'Danika Trueman',
        year: 2024,
        subjectId: paper1.id,
        description: 'A comprehensive guide covering all 10 units of UGC NET Paper I with previous year questions.',
        coverUrl: '',
        distribution: 'reference-only',
        downloadEnabled: false,
        rating: 4.4,
        tags: 'paper-1,reference,pyq',
      },
      {
        slug: 'kvs-madaan-paper-1',
        title: 'KVS Madaan — NTA UGC NET / JRF / SET Teaching & Research Aptitude',
        author: 'KVS Madaan',
        publisher: 'Pearson',
        year: 2023,
        subjectId: paper1.id,
        description: 'Pearson\'s authoritative guide on Paper I with conceptual clarity and practice sets.',
        coverUrl: '',
        distribution: 'reference-only',
        downloadEnabled: false,
        rating: 4.3,
        tags: 'paper-1,pearson',
      },
      {
        slug: 'discrete-math-rosen',
        title: 'Discrete Mathematics and Its Applications',
        author: 'Kenneth H. Rosen',
        publisher: 'McGraw Hill',
        year: 2018,
        subjectId: cs.id,
        description: 'Standard textbook for discrete mathematics — covers logic, set theory, combinatorics, graphs.',
        coverUrl: '',
        distribution: 'reference-only',
        downloadEnabled: false,
        rating: 4.6,
        tags: 'discrete-math,cs,reference',
      },
      {
        slug: 'silberschatz-os',
        title: 'Operating System Concepts',
        author: 'Silberschatz, Galvin, Gagne',
        publisher: 'Wiley',
        year: 2018,
        subjectId: cs.id,
        description: 'The "dinosaur book" — definitive reference for operating systems.',
        coverUrl: '',
        distribution: 'reference-only',
        downloadEnabled: false,
        rating: 4.7,
        tags: 'os,cs,wiley',
      },
      {
        slug: 'korth-dbms',
        title: 'Database System Concepts',
        author: 'Silberschatz, Korth, Sudarshan',
        publisher: 'McGraw Hill',
        year: 2019,
        subjectId: cs.id,
        description: 'Comprehensive DBMS reference — normalization, transactions, indexing, distributed DBs.',
        coverUrl: '',
        distribution: 'reference-only',
        downloadEnabled: false,
        rating: 4.5,
        tags: 'dbms,cs',
      },
      {
        slug: 'clrs-algorithms',
        title: 'Introduction to Algorithms (CLRS)',
        author: 'Cormen, Leiserson, Rivest, Stein',
        publisher: 'MIT Press',
        year: 2022,
        subjectId: cs.id,
        description: 'The bible of algorithms — rigorous coverage of all major algorithmic paradigms.',
        coverUrl: '',
        distribution: 'reference-only',
        downloadEnabled: false,
        rating: 4.8,
        tags: 'algorithms,cs,reference',
      },
    ],
  })

  // -------------------------------------------------------------------------
  // Questions — Paper I (Teaching Aptitude, Research, Communication, Logic)
  // -------------------------------------------------------------------------
  const allTopics = await db.topic.findMany({
    include: { unit: { include: { subject: true } } },
  })

  const findTopic = (subjectSlug: string, unitSlug: string, topicIdx = 1) =>
    allTopics.find(
      (t) =>
        t.unit.subject.slug === subjectSlug &&
        t.unit.slug === unitSlug &&
        t.slug.includes(`topic-${topicIdx}`),
    )

  const q1Topic = findTopic('paper-1', 'teaching-aptitude', 1)
  const q2Topic = findTopic('paper-1', 'research-aptitude', 1)
  const q3Topic = findTopic('paper-1', 'communication', 1)
  const q4Topic = findTopic('paper-1', 'logical-reasoning', 1)
  const q5Topic = findTopic('paper-1', 'data-interpretation', 1)
  const q6Topic = findTopic('paper-1', 'ict', 1)

  const questions = [
    {
      topicId: q1Topic?.id,
      questionText: 'Which of the following is NOT a characteristic of modern teaching?',
      optionA: 'Learner-centred approach',
      optionB: 'Two-way communication',
      optionC: 'Rigid fixed syllabus only',
      optionD: 'Continuous diagnostic process',
      correctAnswer: 'C',
      explanation: 'Modern teaching is flexible, learner-centred, interactive, diagnostic and remedial. A rigid fixed syllabus only is characteristic of traditional, not modern, teaching.',
      difficulty: 'easy',
      tags: 'teaching,characteristics',
    },
    {
      topicId: q1Topic?.id,
      questionText: 'Bloom\'s taxonomy of educational objectives classifies objectives into how many domains?',
      optionA: 'Two',
      optionB: 'Three',
      optionC: 'Four',
      optionD: 'Five',
      correctAnswer: 'B',
      explanation: 'Bloom (1956) classified educational objectives into three domains: Cognitive, Affective, and Psychomotor. (Bloom himself detailed Cognitive; others extended to Affective and Psychomotor.)',
      difficulty: 'easy',
      tags: 'teaching,bloom',
    },
    {
      topicId: q1Topic?.id,
      questionText: 'In Bloom\'s revised taxonomy, which level involves breaking material into parts and determining relationships?',
      optionA: 'Understand',
      optionB: 'Apply',
      optionC: 'Analyse',
      optionD: 'Evaluate',
      correctAnswer: 'C',
      explanation: 'In the revised taxonomy (Anderson & Krathwohl, 2001), "Analyse" involves breaking material into constituent parts and determining how the parts relate to one another.',
      difficulty: 'medium',
      tags: 'teaching,bloom',
    },
    {
      topicId: q2Topic?.id,
      questionText: 'Action research is primarily aimed at:',
      optionA: 'Developing new theories',
      optionB: 'Improving the practitioner\'s own practice',
      optionC: 'Testing hypotheses in a lab',
      optionD: 'Historical analysis',
      correctAnswer: 'B',
      explanation: 'Action research is conducted by practitioners (teachers, managers) on their own practice to improve it. It is contextual, cyclical, and improvement-oriented.',
      difficulty: 'easy',
      tags: 'research,action-research',
    },
    {
      topicId: q2Topic?.id,
      questionText: 'Which of the following sequences is correct for the steps of research?',
      optionA: 'Hypothesis → Problem → Design → Analysis',
      optionB: 'Problem → Review → Hypothesis → Design → Data collection → Analysis → Report',
      optionC: 'Design → Problem → Data → Hypothesis',
      optionD: 'Review → Problem → Analysis → Hypothesis',
      correctAnswer: 'B',
      explanation: 'The standard research sequence is: identify problem → literature review → formulate hypothesis → research design → sampling & data collection → analysis → interpretation → report writing.',
      difficulty: 'medium',
      tags: 'research,steps',
    },
    {
      topicId: q2Topic?.id,
      questionText: 'A researcher wants to study the effect of a new teaching method on student performance. The teaching method is the:',
      optionA: 'Dependent variable',
      optionB: 'Independent variable',
      optionC: 'Control variable',
      optionD: 'Confounding variable',
      correctAnswer: 'B',
      explanation: 'The independent variable is the one manipulated by the researcher (here: teaching method). The dependent variable is the outcome measured (here: student performance).',
      difficulty: 'medium',
      tags: 'research,variables',
    },
    {
      topicId: q3Topic?.id,
      questionText: 'Which of the following is a semantic barrier to communication?',
      optionA: 'Noise in the room',
      optionB: 'Use of technical jargon',
      optionC: 'Emotional state of the receiver',
      optionD: 'Long hierarchical chain',
      correctAnswer: 'B',
      explanation: 'Semantic barriers arise from language — jargon, ambiguous words, poor translation. Noise = physical, emotion = psychological, hierarchy = organisational.',
      difficulty: 'easy',
      tags: 'communication,barriers',
    },
    {
      topicId: q3Topic?.id,
      questionText: 'In Shannon-Weaver\'s model of communication, "noise" refers to:',
      optionA: 'Loud sound only',
      optionB: 'Any disturbance that interferes with the message',
      optionC: 'The receiver\'s feedback',
      optionD: 'The channel itself',
      correctAnswer: 'B',
      explanation: 'In Shannon-Weaver\'s model, noise is any disturbance — physical, semantic, or technical — that interferes with the accurate transmission of the message from sender to receiver.',
      difficulty: 'medium',
      tags: 'communication,model',
    },
    {
      topicId: q4Topic?.id,
      questionText: 'Consider the argument: "All men are mortal. Socrates is a man. Therefore, Socrates is mortal." This is an example of:',
      optionA: 'Inductive reasoning',
      optionB: 'Deductive reasoning',
      optionC: 'Analogical reasoning',
      optionD: 'Abductive reasoning',
      correctAnswer: 'B',
      explanation: 'In deductive reasoning, the conclusion necessarily follows from the premises. Here, if the premises are true, the conclusion must be true — classic deduction (syllogism).',
      difficulty: 'easy',
      tags: 'logic,deductive',
    },
    {
      topicId: q4Topic?.id,
      questionText: 'Which of the following is NOT a valid pramana (means of knowledge) in Nyaya philosophy?',
      optionA: 'Pratyaksha (Perception)',
      optionB: 'Anumana (Inference)',
      optionC: 'Upamana (Comparison)',
      optionD: 'Anupalabdhi (Non-apprehension)',
      correctAnswer: 'D',
      explanation: 'Nyaya accepts 4 pramanas: Pratyaksha, Anumana, Upamana, Shabda. Anupalabdhi is accepted by Advaita Vedanta (and Kumarila Bhatta), but not by Nyaya.',
      difficulty: 'hard',
      tags: 'logic,indian-logic,pramana',
    },
    {
      topicId: q4Topic?.id,
      questionText: 'Identify the conclusion indicator in: "Socrates is mortal, therefore all men are mortal."',
      optionA: 'Socrates',
      optionB: 'is',
      optionC: 'therefore',
      optionD: 'all',
      correctAnswer: 'C',
      explanation: '"Therefore" is a conclusion indicator. Other conclusion indicators: hence, thus, so, consequently. (Note: the statement itself is logically invalid — it generalises from one case.)',
      difficulty: 'easy',
      tags: 'logic,argument',
    },
    {
      topicId: q5Topic?.id,
      questionText: 'A pie chart is most appropriate for representing:',
      optionA: 'Trend over time',
      optionB: 'Parts of a whole as percentages',
      optionC: 'Relationship between two variables',
      optionD: 'Frequency distribution',
      correctAnswer: 'B',
      explanation: 'A pie chart shows the proportion of each category as a slice of a circle, ideal for representing parts of a whole as percentages. Trends → line chart; relationships → scatter; frequency → histogram.',
      difficulty: 'easy',
      tags: 'di,pie-chart',
    },
    {
      topicId: q6Topic?.id,
      questionText: 'Which of the following is NOT a benefit of cloud computing for education?',
      optionA: 'On-demand access to resources',
      optionB: 'Reduced local storage requirements',
      optionC: 'Increased dependency on internet connectivity',
      optionD: 'Scalability of infrastructure',
      correctAnswer: 'C',
      explanation: 'Increased dependency on internet connectivity is a *disadvantage*, not a benefit. The other three are key benefits of cloud computing.',
      difficulty: 'medium',
      tags: 'ict,cloud',
    },
    // CS questions
    {
      topicId: findTopic('computer-science', 'dbms', 1)?.id,
      questionText: 'A relation is in 2NF if it is in 1NF and:',
      optionA: 'Every attribute is atomic',
      optionB: 'No partial dependency exists',
      optionC: 'No transitive dependency exists',
      optionD: 'Every determinant is a super key',
      correctAnswer: 'B',
      explanation: '2NF requires no partial dependency — every non-prime attribute must be fully functionally dependent on the primary key. (3NF: no transitive dependency; BCNF: every determinant is a super key.)',
      difficulty: 'medium',
      tags: 'dbms,normalization,2nf',
    },
    {
      topicId: findTopic('computer-science', 'dbms', 1)?.id,
      questionText: 'BCNF is stricter than 3NF. A relation in BCNF is always in:',
      optionA: '1NF only',
      optionB: '2NF only',
      optionC: '3NF',
      optionD: 'None of the above',
      correctAnswer: 'C',
      explanation: 'Every BCNF relation is automatically in 3NF (and 2NF and 1NF). The converse is not true — some 3NF relations are not in BCNF.',
      difficulty: 'medium',
      tags: 'dbms,bcnf,3nf',
    },
    {
      topicId: findTopic('computer-science', 'dsa', 2)?.id,
      questionText: 'Which sorting algorithm has the best worst-case time complexity of O(n log n) AND is in-place?',
      optionA: 'Merge Sort',
      optionB: 'Quick Sort',
      optionC: 'Heap Sort',
      optionD: 'Bubble Sort',
      correctAnswer: 'C',
      explanation: 'Heap sort has guaranteed O(n log n) worst case and uses O(1) extra space (in-place). Merge sort is O(n log n) but needs O(n) space. Quick sort worst case is O(n²). Bubble sort is O(n²).',
      difficulty: 'medium',
      tags: 'dsa,sorting,heap-sort',
    },
    {
      topicId: findTopic('computer-science', 'dsa', 2)?.id,
      questionText: 'Which sorting algorithm is best suited for sorting a singly linked list?',
      optionA: 'Quick Sort',
      optionB: 'Heap Sort',
      optionC: 'Merge Sort',
      optionD: 'Selection Sort',
      correctAnswer: 'C',
      explanation: 'Merge sort is preferred for linked lists because it does not require random access (which quick sort and heap sort need) and merging two sorted linked lists is straightforward with O(1) extra space.',
      difficulty: 'medium',
      tags: 'dsa,linked-list,merge-sort',
    },
    {
      topicId: findTopic('computer-science', 'dsa', 2)?.id,
      questionText: 'The worst-case time complexity of Quick Sort is:',
      optionA: 'O(n log n)',
      optionB: 'O(n²)',
      optionC: 'O(n)',
      optionD: 'O(log n)',
      correctAnswer: 'B',
      explanation: 'Quick Sort\'s worst case is O(n²), which occurs when the pivot is always the smallest or largest element (e.g., already sorted array with first/last element as pivot). Average case is O(n log n).',
      difficulty: 'easy',
      tags: 'dsa,quick-sort,complexity',
    },
    {
      topicId: findTopic('computer-science', 'dsa', 1)?.id,
      questionText: 'Binary search works on which type of data structure?',
      optionA: 'Unsorted array',
      optionB: 'Sorted array only',
      optionC: 'Linked list (any)',
      optionD: 'Binary tree (any)',
      correctAnswer: 'B',
      explanation: 'Binary search requires random access AND sorted data — hence works on sorted arrays. It does not work on unsorted data or linked lists (no random access).',
      difficulty: 'easy',
      tags: 'dsa,binary-search',
    },
    {
      topicId: findTopic('computer-science', 'os', 1)?.id,
      questionText: 'Which scheduling algorithm cannot cause starvation?',
      optionA: 'Priority Scheduling',
      optionB: 'Shortest Job First (SJF)',
      optionC: 'Round Robin',
      optionD: 'Multilevel Feedback Queue',
      correctAnswer: 'C',
      explanation: 'Round Robin gives every process a fixed time slice in cyclic order, so no process can be indefinitely starved. Priority and SJF can starve low-priority/long processes.',
      difficulty: 'medium',
      tags: 'os,scheduling,starvation',
    },
    {
      topicId: findTopic('computer-science', 'os', 1)?.id,
      questionText: 'The four necessary conditions for deadlock are: mutual exclusion, hold and wait, no preemption, and:',
      optionA: 'Priority inversion',
      optionB: 'Circular wait',
      optionC: 'Starvation',
      optionD: 'Aging',
      correctAnswer: 'B',
      explanation: 'Coffman\'s four conditions for deadlock: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. All four must hold simultaneously for deadlock.',
      difficulty: 'medium',
      tags: 'os,deadlock',
    },
    {
      topicId: findTopic('computer-science', 'networks', 1)?.id,
      questionText: 'How many layers are there in the OSI model?',
      optionA: '4',
      optionB: '5',
      optionC: '7',
      optionD: '8',
      correctAnswer: 'C',
      explanation: 'OSI has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application. (Mnemonic: Please Do Not Throw Sausage Pizza Away.)',
      difficulty: 'easy',
      tags: 'networks,osi',
    },
    {
      topicId: findTopic('computer-science', 'networks', 1)?.id,
      questionText: 'Which protocol provides reliable, connection-oriented delivery?',
      optionA: 'UDP',
      optionB: 'TCP',
      optionC: 'ICMP',
      optionD: 'ARP',
      correctAnswer: 'B',
      explanation: 'TCP is connection-oriented and reliable — it establishes a 3-way handshake, ensures ordered delivery, and retransmits lost segments. UDP is connectionless and unreliable.',
      difficulty: 'easy',
      tags: 'networks,tcp,udp',
    },
    {
      topicId: findTopic('computer-science', 'toc', 1)?.id,
      questionText: 'A deterministic finite automaton (DFA) differs from an NFA because in a DFA:',
      optionA: 'There is only one transition per input symbol from each state',
      optionB: 'Epsilon transitions are allowed',
      optionC: 'It can recognise context-free languages',
      optionD: 'It has more states',
      correctAnswer: 'A',
      explanation: 'In a DFA, for each state and each input symbol, there is exactly one transition. In an NFA, multiple transitions (or none) and ε-transitions are allowed. Both recognise the same class of languages (regular).',
      difficulty: 'medium',
      tags: 'toc,dfa,nfa',
    },
    {
      topicId: findTopic('computer-science', 'digital-logic', 1)?.id,
      questionText: 'De Morgan\'s law states that ~(A · B) is equivalent to:',
      optionA: '~A · ~B',
      optionB: '~A + ~B',
      optionC: 'A + B',
      optionD: '~(A + B)',
      correctAnswer: 'B',
      explanation: 'De Morgan\'s laws: ~(A · B) = ~A + ~B, and ~(A + B) = ~A · ~B. The complement of an AND is the OR of the complements (and vice versa).',
      difficulty: 'easy',
      tags: 'digital,boolean,demorgan',
    },
  ]

  for (const q of questions) {
    await db.question.create({ data: q as any })
  }

  // Mark some as PYQs
  const pyqQuestions = await db.question.findMany({
    where: { tags: { contains: 'bloom' } },
    take: 2,
  })
  for (const q of pyqQuestions) {
    await db.question.update({
      where: { id: q.id },
      data: { isPYQ: true, pyqYear: 2023, source: 'NTA UGC NET June 2023' },
    })
  }

  // -------------------------------------------------------------------------
  // Mock Tests
  // -------------------------------------------------------------------------
  const mock1 = await db.mockTest.create({
    data: {
      slug: 'paper-1-mock-test-1',
      title: 'Paper I Full Mock Test — 50 Questions',
      description: 'A comprehensive 60-minute mock test covering all 10 units of UGC NET Paper I.',
      subjectId: paper1.id,
      paper: 'I',
      durationMin: 60,
      totalMarks: 100,
    },
  })

  const p1Questions = await db.question.findMany({
    where: { topic: { unit: { subject: { slug: 'paper-1' } } } },
    take: 10,
  })
  for (let i = 0; i < p1Questions.length; i++) {
    await db.mockTestQuestion.create({
      data: {
        mockTestId: mock1.id,
        questionId: p1Questions[i].id,
        sortOrder: i + 1,
      },
    })
  }

  const mock2 = await db.mockTest.create({
    data: {
      slug: 'cs-mock-test-1',
      title: 'Computer Science Mock Test — 10 Questions',
      description: 'A focused 30-minute test on DBMS, DSA, OS and Networks.',
      subjectId: cs.id,
      paper: 'II',
      durationMin: 30,
      totalMarks: 20,
    },
  })

  const csQuestions = await db.question.findMany({
    where: { topic: { unit: { subject: { slug: 'computer-science' } } } },
    take: 10,
  })
  for (let i = 0; i < csQuestions.length; i++) {
    await db.mockTestQuestion.create({
      data: {
        mockTestId: mock2.id,
        questionId: csQuestions[i].id,
        sortOrder: i + 1,
      },
    })
  }

  // -------------------------------------------------------------------------
  // Articles
  // -------------------------------------------------------------------------
  await db.article.createMany({
    data: [
      {
        slug: 'ugc-net-preparation-strategy',
        title: 'UGC NET 2025: A Complete 6-Month Preparation Strategy',
        excerpt: 'A structured month-by-month plan to crack UGC NET in 6 months — covering syllabus, revision, mock tests, and exam day strategy.',
        content: `# UGC NET 2025: A Complete 6-Month Preparation Strategy

The UGC NET examination is one of the most competitive academic tests in India. A focused, structured plan can make the difference between qualifying and falling short.

## Month 1–2: Foundation

- Read Paper I concepts deeply (Trueman or KVS Madaan)
- Finalise your Paper II subject and standard textbooks
- Solve 20 MCQs daily per subject
- Make first-pass notes

## Month 3–4: Consolidation

- Revise Paper I twice
- Complete 80% of Paper II syllabus
- Start sectional mock tests
- Maintain a "mistake notebook"

## Month 5: Intensive Practice

- Daily 1 full-length mock test
- Solve PYQs of last 5 years
- Identify weak topics → targeted revision

## Month 6: Final Revision

- Cheat sheets only — no new topics
- 2 mocks/day in last 2 weeks
- Sleep well, eat well, stay calm

## Daily Routine (Sample)

| Time | Activity |
| --- | --- |
| 6–8 AM | Paper I reading |
| 8–9 AM | Breakfast + break |
| 9–11 AM | Paper II reading |
| 11–12 | MCQ practice |
| 5–7 PM | Revision + notes |
| 8–9 PM | Mock test / PYQ |

## Final Tip

> Consistency beats intensity. 4 focused hours daily for 6 months > 12 hours for 1 month.
`,
        category: 'Strategy',
        subjectId: paper1.id,
        tags: 'strategy,6-month,plan',
        featured: true,
      },
      {
        slug: 'paper-1-vs-paper-2',
        title: 'Paper I vs Paper II: Where to Focus Your Energy',
        excerpt: 'Should you spend more time on Paper I or Paper II? A data-driven look at where aspirants gain the most marks.',
        content: `# Paper I vs Paper II: Where to Focus?

Both Paper I and Paper II are mandatory and each carries equal weightage (100 marks each). However, the *return on investment* per hour differs.

## Paper I — High ROI

- Only 10 units
- Pattern is predictable
- Conceptual clarity → easy marks
- 5–6 months of focused study is enough

## Paper II — Variable ROI

- Vast syllabus (varies by subject)
- Conceptual + applied
- Requires depth, not just breadth

## Recommendation

- Spend **40% time on Paper I, 60% on Paper II**
- Do not ignore Paper I — it is the easier path to qualifying
- Take Paper I mock weekly
- Take Paper II mock biweekly initially, then weekly

## Mistake to Avoid

Many aspirants over-invest in Paper II and ignore Paper I, then fail to qualify. Don't make this mistake.
`,
        category: 'Strategy',
        subjectId: paper1.id,
        tags: 'paper-1,paper-2,strategy',
        featured: false,
      },
      {
        slug: 'research-aptitude-pyq-analysis',
        title: 'PYQ Analysis: Research Aptitude (2015–2024)',
        excerpt: 'Which topics in Research Aptitude appear most often? A 10-year PYQ analysis with weighted priorities.',
        content: `# Research Aptitude: 10-Year PYQ Analysis

After analysing all UGC NET Paper I Research Aptitude questions from 2015 to 2024:

## Topic Frequency

| Topic | Times Asked | Priority |
| --- | --- | --- |
| Types of Research | 18 | ⭐⭐⭐ |
| Steps of Research | 14 | ⭐⭐⭐ |
| Hypothesis | 12 | ⭐⭐⭐ |
| Sampling | 10 | ⭐⭐ |
| Research Ethics | 9 | ⭐⭐ |
| Thesis Writing | 7 | ⭐⭐ |
| Variables | 6 | ⭐ |
| Measurement Scales | 5 | ⭐ |

## What This Means

- Focus heavily on **types of research** (pure, applied, action, evaluation)
- Master **hypothesis types** (null, alternative, directional, non-directional)
- Be thorough with **sampling methods** (probability vs non-probability)

## Common Question Patterns

1. Match research type → example
2. Identify correct sequence of research steps
3. Identify dependent vs independent variable
4. Assertion-Reason on research ethics
`,
        category: 'PYQ Analysis',
        subjectId: paper1.id,
        tags: 'pyq,research-aptitude,analysis',
        featured: true,
      },
    ],
  })

  // -------------------------------------------------------------------------
  // FAQs
  // -------------------------------------------------------------------------
  await db.faq.createMany({
    data: [
      { category: 'General', question: 'What is UGC NET?', answer: 'University Grants Commission National Eligibility Test. It determines eligibility for Assistant Professor and JRF in Indian universities and colleges.', sortOrder: 1 },
      { category: 'General', question: 'How many times is UGC NET conducted in a year?', answer: 'Currently, NTA conducts UGC NET twice a year — typically in June and December.', sortOrder: 2 },
      { category: 'Eligibility', question: 'What is the educational qualification required?', answer: 'A Master\'s degree or equivalent with at least 55% marks (50% for reserved categories) from a recognised university.', sortOrder: 1 },
      { category: 'Eligibility', question: 'Is there an age limit for UGC NET?', answer: 'For JRF: maximum 30 years (with relaxations). For Assistant Professor: no upper age limit.', sortOrder: 2 },
      { category: 'Exam Pattern', question: 'How many papers are there in UGC NET?', answer: 'Two papers — Paper I (general, 50 questions, 100 marks) and Paper II (subject-specific, 100 questions, 200 marks). Both are objective (MCQ).', sortOrder: 1 },
      { category: 'Exam Pattern', question: 'What is the duration of UGC NET?', answer: 'Both papers combined are conducted in a single 3-hour session (180 minutes), with no break between them.', sortOrder: 2 },
      { category: 'Exam Pattern', question: 'Is there negative marking in UGC NET?', answer: 'No. There is no negative marking in UGC NET. You should attempt all questions.', sortOrder: 3 },
      { category: 'Preparation', question: 'How many hours should I study daily for UGC NET?', answer: 'For 6 months of preparation, 4–6 focused hours daily is recommended. Consistency matters more than hours.', sortOrder: 1 },
      { category: 'Preparation', question: 'Which books are best for Paper I?', answer: 'Trueman\'s UGC NET Paper I and KVS Madaan (Pearson) are widely recommended. Use NETPrep Hub notes for revision.', sortOrder: 2 },
    ],
  })

  // -------------------------------------------------------------------------
  // Resources
  // -------------------------------------------------------------------------
  await db.resource.createMany({
    data: [
      { title: 'NTA UGC NET Official Website', url: 'https://ugcnet.nta.ac.in/', category: 'Official', description: 'Official portal for application, admit cards, and results.' },
      { title: 'UGC Syllabus (All Subjects)', url: 'https://www.ugc.gov.in/university-and-higher-education/syllabus', category: 'Official', description: 'Official subject-wise syllabus PDFs.' },
      { title: 'NTA Information Bulletin', url: 'https://ugcnet.nta.ac.in/', category: 'Official', description: 'Detailed information bulletin released before each cycle.' },
      { title: 'NPTEL — Free Engineering Courses', url: 'https://nptel.ac.in/', category: 'Reference', description: 'Free video lectures — excellent for CS Paper II concepts.' },
      { title: 'SWAYAM — Free Online Courses', url: 'https://swayam.gov.in/', category: 'Reference', description: 'Government-backed free MOOC platform — useful for Paper I and II.' },
      { title: 'e-PG Pathshala', url: 'https://epgp.inflibnet.ac.in/', category: 'Reference', description: 'High-quality e-content for postgraduate subjects (Paper II).' },
    ],
  })

  // -------------------------------------------------------------------------
  // Demo user profile + study tasks
  // -------------------------------------------------------------------------
  await db.userProfile.create({
    data: {
      userId: 'demo-user',
      name: 'Kamraan',
      targetExam: 'UGC NET JRF',
      paperTwoSubject: 'Computer Science',
      dailyHours: 4,
      prepLevel: 'Intermediate',
      examDate: new Date(Date.now() + 42 * 86400000).toISOString(),
    },
  })

  // Today's study tasks
  const today = new Date().toISOString().split('T')[0]
  await db.studyTask.createMany({
    data: [
      { userId: 'demo-user', title: 'Revise Research Aptitude — Types of Research', description: 'Quick revision of all 4 research classifications', scheduledDate: today, startTime: '09:00', duration: 60, priority: 'high', category: 'revise' },
      { userId: 'demo-user', title: 'Solve 20 MCQs on Teaching Aptitude', description: 'Practice set from Bloom\'s taxonomy', scheduledDate: today, startTime: '10:30', duration: 45, priority: 'high', category: 'practice' },
      { userId: 'demo-user', title: 'Read Normalization in DBMS note', description: 'Cheat sheet revision included', scheduledDate: today, startTime: '15:00', duration: 60, priority: 'medium', category: 'study' },
      { userId: 'demo-user', title: 'Attempt mini mock — Logical Reasoning', description: '10-question timed test', scheduledDate: today, startTime: '18:00', duration: 30, priority: 'medium', category: 'test' },
    ],
  })

  // Mark some topics as completed for demo user
  const completedTopics = await db.topic.findMany({ take: 12 })
  for (let i = 0; i < completedTopics.length; i++) {
    await db.topicProgress.create({
      data: {
        userId: 'demo-user',
        topicId: completedTopics[i].id,
        status: i < 4 ? 'completed' : i < 8 ? 'studying' : 'needs-revision',
        confidence: i < 4 ? 80 + (i * 5) : i < 8 ? 50 + (i * 5) : 30 + (i * 4),
      },
    })
  }

  // Add a few study sessions
  for (let i = 0; i < 14; i++) {
    await db.studySession.create({
      data: {
        userId: 'demo-user',
        date: new Date(Date.now() - i * 86400000),
        durationMin: 60 + Math.floor(Math.random() * 180),
        topic: ['Teaching Aptitude', 'Research Aptitude', 'DBMS', 'DSA', 'OS'][i % 5],
        activity: (['read', 'practice', 'mock', 'revise'] as const)[i % 4],
      },
    })
  }

  // Sample bookmarks
  const noteSample = await db.note.findFirst()
  if (noteSample) {
    await db.bookmark.create({
      data: { userId: 'demo-user', itemType: 'note', itemId: noteSample.id, folder: 'Important' },
    })
  }
  const qSample = await db.question.findFirst()
  if (qSample) {
    await db.bookmark.create({
      data: { userId: 'demo-user', itemType: 'question', itemId: qSample.id, folder: 'Revise Later' },
    })
  }

  console.log('✅ Seed completed successfully!')
  console.log(`   - Subjects: ${await db.subject.count()}`)
  console.log(`   - Units: ${await db.unit.count()}`)
  console.log(`   - Topics: ${await db.topic.count()}`)
  console.log(`   - Notes: ${await db.note.count()}`)
  console.log(`   - Cheat sheets: ${await db.cheatSheet.count()}`)
  console.log(`   - Books: ${await db.book.count()}`)
  console.log(`   - Questions: ${await db.question.count()}`)
  console.log(`   - Mock tests: ${await db.mockTest.count()}`)
  console.log(`   - Articles: ${await db.article.count()}`)
  console.log(`   - FAQs: ${await db.faq.count()}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
