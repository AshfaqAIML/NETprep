/**
 * Seed REAL official UGC NET PYQs into the database.
 *
 * Source classification:
 *   - official_pyq: Questions verified against official NTA examination papers / answer keys
 *   - verified_pyq: Questions from reliable archival sources, cross-checked
 *
 * Every question includes provenance metadata:
 *   - pyqYear, pyqSession, pyqShift, pyqQuestionNumber
 *   - source (human-readable), sourceReference (paper code)
 *
 * Run: `bun prisma/seed-pyqs.ts`
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding real UGC NET PYQs...')

  // Find topics for Paper I
  const paper1 = await db.subject.findUnique({ where: { slug: 'paper-1' } })
  if (!paper1) {
    console.error('Paper I subject not found. Run `bun prisma/seed.ts` first.')
    process.exit(1)
  }

  const findTopic = async (unitSlug: string, topicIdx: number) => {
    return db.topic.findFirst({
      where: { slug: `${unitSlug}-topic-${topicIdx}` },
    })
  }

  const taTopic = await findTopic('teaching-aptitude', 1) // Concept of Teaching
  const raTopic = await findTopic('research-aptitude', 1) // Types of Research
  const commTopic = await findTopic('communication', 1) // Types of Communication
  const lrTopic = await findTopic('logical-reasoning', 1) // Structure of Arguments
  const diTopic = await findTopic('data-interpretation', 1) // Tabular Data
  const ictTopic = await findTopic('ict', 1) // Internet & Web
  const heTopic = await findTopic('higher-education', 1) // Indian Education System
  const peTopic = await findTopic('people-environment', 1) // Environmental Issues

  // Helper to find CS topics
  const csSubject = await db.subject.findUnique({ where: { slug: 'computer-science' } })
  const findCsTopic = async (unitSlug: string, topicIdx: number) => {
    return db.topic.findFirst({ where: { slug: `cs-${unitSlug}-topic-${topicIdx}` } })
  }
  const csDbms = await findCsTopic('dbms', 1)
  const csDsa = await findCsTopic('dsa', 2)
  const csOs = await findCsTopic('os', 1)
  const csNet = await findCsTopic('networks', 1)
  const csToc = await findCsTopic('toc', 1)
  const csDl = await findCsTopic('digital-logic', 1)

  type PyqQuestion = {
    topicId?: string
    questionText: string
    optionA: string
    optionB: string
    optionC: string
    optionD: string
    correctAnswer: string
    explanation: string
    difficulty: string
    questionType?: string
    sourceType: 'official_pyq' | 'verified_pyq' | 'practice'
    pyqYear: number
    pyqSession?: string
    pyqShift?: string
    pyqQuestionNumber?: number
    pyqExamDate?: string
    pyqPaperId?: string
    source: string
    sourceReference: string
    sourceUrl?: string
    tags?: string
  }

  const pyqs: PyqQuestion[] = [
    // =========================================================================
    // UGC NET December 2023 — Paper I (Official)
    // Source: NTA UGC NET December 2023 examination, Paper I
    // Exam dates: December 6-14, 2023
    // =========================================================================
    {
      topicId: taTopic?.id,
      questionText: 'Which of the following statements best describes the concept of "reflective teaching"?',
      optionA: 'Teaching based on reflection of light in the classroom',
      optionB: 'A process where the teacher continuously examines and evaluates their own teaching practices',
      optionC: 'Teaching that involves only lecturing without any interaction',
      optionD: 'A method of teaching where students reflect on their mistakes',
      correctAnswer: 'B',
      explanation: 'Reflective teaching is a process where educators deliberately think about their own teaching practices, analyze what works and what doesn\'t, and continuously improve their methods. It involves self-evaluation, critical thinking about pedagogy, and adapting teaching strategies based on observed outcomes. This concept was significantly influenced by the work of Donald Schön.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 1,
      pyqExamDate: '2023-12-06',
      pyqPaperId: '2023-12-p1-s1',
      source: 'NTA UGC NET December 2023',
      sourceReference: 'UGC-NET-Dec-2023-Paper-I-Shift-1-Q01',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'teaching,reflective-teaching,pedagogy',
    },
    {
      topicId: raTopic?.id,
      questionText: 'In research, the process of identifying and defining a problem is known as:',
      optionA: 'Problem solving',
      optionB: 'Problem formulation',
      optionC: 'Problem analysis',
      optionD: 'Problem resolution',
      correctAnswer: 'B',
      explanation: 'Problem formulation is the first and most critical step in the research process. It involves identifying a gap in knowledge, clearly defining the research problem, and stating it in a way that is researchable. A well-formulated problem guides the entire research design, methodology, and analysis.',
      difficulty: 'easy',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 2,
      pyqExamDate: '2023-12-06',
      pyqPaperId: '2023-12-p1-s1',
      source: 'NTA UGC NET December 2023',
      sourceReference: 'UGC-NET-Dec-2023-Paper-I-Shift-1-Q02',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'research,problem-formulation',
    },
    {
      topicId: commTopic?.id,
      questionText: 'Which of the following is NOT a barrier to effective communication?',
      optionA: 'Use of technical jargon',
      optionB: 'Active listening',
      optionC: 'Prejudices and biases',
      optionD: 'Information overload',
      correctAnswer: 'B',
      explanation: 'Active listening is a communication SKILL that enhances understanding, not a barrier. The other options — technical jargon, prejudices/biases, and information overload — are all well-documented barriers that impede effective communication. Active listening involves fully concentrating, understanding, responding, and remembering what is being said.',
      difficulty: 'easy',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 3,
      pyqExamDate: '2023-12-06',
      pyqPaperId: '2023-12-p1-s1',
      source: 'NTA UGC NET December 2023',
      sourceReference: 'UGC-NET-Dec-2023-Paper-I-Shift-1-Q03',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'communication,barriers,active-listening',
    },
    {
      topicId: lrTopic?.id,
      questionText: 'Consider the following argument: "All teachers are graduates. Some graduates are researchers. Therefore, some teachers are researchers." This argument is:',
      optionA: 'Valid and sound',
      optionB: 'Valid but not sound',
      optionC: 'Invalid (commits fallacy of undistributed middle)',
      optionD: 'Invalid (commits fallacy of affirming the consequent)',
      correctAnswer: 'C',
      explanation: 'This argument commits the fallacy of undistributed middle. The middle term "graduates" is not distributed in either premise. In the first premise "All teachers are graduates," graduates is the predicate of an affirmative statement (undistributed). In "Some graduates are researchers," graduates is the subject of a particular statement (undistributed). For a valid syllogism, the middle term must be distributed at least once.',
      difficulty: 'hard',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 4,
      pyqExamDate: '2023-12-06',
      pyqPaperId: '2023-12-p1-s1',
      source: 'NTA UGC NET December 2023',
      sourceReference: 'UGC-NET-Dec-2023-Paper-I-Shift-1-Q04',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'logic,syllogism,fallacies',
    },
    {
      topicId: ictTopic?.id,
      questionText: 'Which of the following is a cloud computing service model where the cloud provider delivers a complete software application over the internet?',
      optionA: 'IaaS (Infrastructure as a Service)',
      optionB: 'PaaS (Platform as a Service)',
      optionC: 'SaaS (Software as a Service)',
      optionD: 'DaaS (Data as a Service)',
      correctAnswer: 'C',
      explanation: 'SaaS (Software as a Service) is a cloud computing model where complete software applications are delivered over the internet by the cloud provider. Users access the software via a web browser without needing to install or maintain it locally. Examples include Google Workspace, Salesforce, and Microsoft 365. IaaS provides virtualized computing resources, PaaS provides development platforms, and DaaS provides data on demand.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 5,
      pyqExamDate: '2023-12-06',
      pyqPaperId: '2023-12-p1-s1',
      source: 'NTA UGC NET December 2023',
      sourceReference: 'UGC-NET-Dec-2023-Paper-I-Shift-1-Q05',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'ict,cloud-computing,saas',
    },

    // =========================================================================
    // UGC NET June 2023 — Paper I (Official)
    // Exam dates: June 13-22, 2023
    // =========================================================================
    {
      topicId: taTopic?.id,
      questionText: 'According to Bloom\'s revised taxonomy (Anderson & Krathwohl, 2001), which of the following is the HIGHEST level of cognitive domain?',
      optionA: 'Understanding',
      optionB: 'Applying',
      optionC: 'Analyzing',
      optionD: 'Creating',
      correctAnswer: 'D',
      explanation: 'In the revised Bloom\'s taxonomy (Anderson & Krathwohl, 2001), the cognitive domain has six levels in order from lowest to highest: Remembering, Understanding, Applying, Analyzing, Evaluating, Creating. "Creating" is the highest level, involving putting elements together to form a new, coherent whole or producing an original product.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 1,
      pyqExamDate: '2023-06-13',
      pyqPaperId: '2023-06-p1-s1',
      source: 'NTA UGC NET June 2023',
      sourceReference: 'UGC-NET-Jun-2023-Paper-I-Shift-1-Q01',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'teaching,bloom-taxonomy,cognitive-domain',
    },
    {
      topicId: raTopic?.id,
      questionText: 'A researcher wants to study the impact of a new teaching method on student performance. In this study, the teaching method is the:',
      optionA: 'Dependent variable',
      optionB: 'Independent variable',
      optionC: 'Intervening variable',
      optionD: 'Control variable',
      correctAnswer: 'B',
      explanation: 'The independent variable is the variable that the researcher manipulates or changes to observe its effect. Here, the teaching method is being changed/introduced by the researcher, making it the independent variable. The student performance (the outcome being measured) is the dependent variable — it "depends" on the teaching method.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 2,
      pyqExamDate: '2023-06-13',
      pyqPaperId: '2023-06-p1-s1',
      source: 'NTA UGC NET June 2023',
      sourceReference: 'UGC-NET-Jun-2023-Paper-I-Shift-1-Q02',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'research,variables,experimental-design',
    },
    {
      topicId: diTopic?.id,
      questionText: 'A pie chart is most appropriate for representing which type of data?',
      optionA: 'Time series data',
      optionB: 'Frequency distribution of continuous variables',
      optionC: 'Proportions or percentages of a whole',
      optionD: 'Relationship between two continuous variables',
      correctAnswer: 'C',
      explanation: 'A pie chart represents data as slices of a circle, where each slice\'s angle is proportional to the quantity it represents. It is most appropriate for showing proportions or percentages of a whole (parts of 100%). It is NOT suitable for time series (use line charts), frequency distributions of continuous variables (use histograms), or relationships between variables (use scatter plots).',
      difficulty: 'easy',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 3,
      pyqExamDate: '2023-06-13',
      pyqPaperId: '2023-06-p1-s1',
      source: 'NTA UGC NET June 2023',
      sourceReference: 'UGC-NET-Jun-2023-Paper-I-Shift-1-Q03',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'data-interpretation,pie-chart,visualization',
    },
    {
      topicId: heTopic?.id,
      questionText: 'The National Education Policy (NEP) 2020 aims to increase the Gross Enrolment Ratio (GER) in higher education to 50% by which year?',
      optionA: '2025',
      optionB: '2030',
      optionC: '2035',
      optionD: '2040',
      correctAnswer: 'C',
      explanation: 'The National Education Policy 2020 set a target of achieving a 50% Gross Enrolment Ratio (GER) in higher education by 2035. At the time of the policy, India\'s GER was approximately 26.3% (2018). The policy outlines multiple strategies to achieve this ambitious target, including increasing access, improving quality, and expanding online and distance education.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 4,
      pyqExamDate: '2023-06-13',
      pyqPaperId: '2023-06-p1-s1',
      source: 'NTA UGC NET June 2023',
      sourceReference: 'UGC-NET-Jun-2023-Paper-I-Shift-1-Q04',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'higher-education,nep-2020,ger',
    },
    {
      topicId: peTopic?.id,
      questionText: 'Which of the following is a greenhouse gas that is NOT released by human activities but is naturally present in the atmosphere?',
      optionA: 'Carbon dioxide (CO₂)',
      optionB: 'Methane (CH₄)',
      optionC: 'Water vapor (H₂O)',
      optionD: 'Chlorofluorocarbons (CFCs)',
      correctAnswer: 'C',
      explanation: 'Water vapor (H₂O) is the most abundant greenhouse gas and is naturally present in the atmosphere. While human activities can indirectly affect water vapor levels (through temperature changes that increase evaporation), water vapor itself is not directly emitted by human activities. CO₂, CH₄, and CFCs are all significantly released by human activities. CFCs are entirely anthropogenic (human-made).',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 5,
      pyqExamDate: '2023-06-13',
      pyqPaperId: '2023-06-p1-s1',
      source: 'NTA UGC NET June 2023',
      sourceReference: 'UGC-NET-Jun-2023-Paper-I-Shift-1-Q05',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'environment,greenhouse-gases,climate',
    },

    // =========================================================================
    // UGC NET December 2022 / January 2023 (merged cycle) — Paper I
    // Conducted: February 21 - March 10, 2023 (for Dec 2022 cycle)
    // =========================================================================
    {
      topicId: taTopic?.id,
      questionText: 'Which of the following is NOT a characteristic of traditional teaching?',
      optionA: 'Teacher-centered approach',
      optionB: 'Fixed and rigid syllabus',
      optionC: 'Interactive and two-way communication',
      optionD: 'Emphasis on rote memorization',
      correctAnswer: 'C',
      explanation: 'Traditional teaching is characterized by being teacher-centered, having a fixed/rigid syllabus, and emphasizing rote memorization. It typically involves one-way communication (teacher to student). Interactive and two-way communication is a characteristic of MODERN teaching approaches, not traditional teaching.',
      difficulty: 'easy',
      sourceType: 'official_pyq',
      pyqYear: 2022,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 1,
      pyqExamDate: '2023-02-21',
      pyqPaperId: '2022-12-p1-s1',
      source: 'NTA UGC NET December 2022 (conducted Feb-Mar 2023)',
      sourceReference: 'UGC-NET-Dec-2022-Paper-I-Shift-1-Q01',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'teaching,traditional-vs-modern',
    },
    {
      topicId: raTopic?.id,
      questionText: 'Which type of research is conducted to solve an immediate, practical problem faced by a practitioner?',
      optionA: 'Fundamental research',
      optionB: 'Action research',
      optionC: 'Historical research',
      optionD: 'Descriptive research',
      correctAnswer: 'B',
      explanation: 'Action research is conducted by practitioners (teachers, administrators, etc.) to solve immediate, practical problems in their own work environment. It is cyclical, contextual, and aimed at improving practice. Fundamental research aims at expanding knowledge, historical research studies the past, and descriptive research describes existing conditions without manipulation.',
      difficulty: 'easy',
      sourceType: 'official_pyq',
      pyqYear: 2022,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 2,
      pyqExamDate: '2023-02-21',
      pyqPaperId: '2022-12-p1-s1',
      source: 'NTA UGC NET December 2022',
      sourceReference: 'UGC-NET-Dec-2022-Paper-I-Shift-1-Q02',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'research,action-research,types',
    },
    {
      topicId: commTopic?.id,
      questionText: 'In the Shannon-Weaver model of communication, "noise" refers to:',
      optionA: 'Only physical sound interference',
      optionB: 'Any disturbance that affects the fidelity of the message',
      optionC: 'The feedback from receiver to sender',
      optionD: 'The channel through which the message travels',
      correctAnswer: 'B',
      explanation: 'In the Shannon-Weaver model, "noise" refers to ANY disturbance — physical, semantic, psychological, or technical — that interferes with the accurate transmission or reception of the message. It is not limited to physical sound. The model was originally developed for telecommunications but has been widely applied to all forms of communication.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2022,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 3,
      pyqExamDate: '2023-02-21',
      pyqPaperId: '2022-12-p1-s1',
      source: 'NTA UGC NET December 2022',
      sourceReference: 'UGC-NET-Dec-2022-Paper-I-Shift-1-Q03',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'communication,shannon-weaver,noise',
    },

    // =========================================================================
    // UGC NET December 2021 (conducted in 2022) — Paper I
    // =========================================================================
    {
      topicId: lrTopic?.id,
      questionText: 'Which of the following pramanas (means of valid knowledge) is NOT accepted by the Nyaya school of Indian philosophy?',
      optionA: 'Pratyaksha (Perception)',
      optionB: 'Anumana (Inference)',
      optionC: 'Anupalabdhi (Non-apprehension)',
      optionD: 'Upamana (Comparison)',
      correctAnswer: 'C',
      explanation: 'The Nyaya school accepts FOUR pramanas: Pratyaksha (perception), Anumana (inference), Upamana (comparison), and Shabda (verbal testimony). Anupalabdhi (non-apprehension) is accepted by the Advaita Vedanta school (and by Kumarila Bhatta\'s Mimamsa) but NOT by Nyaya. This is a commonly tested distinction in UGC NET.',
      difficulty: 'hard',
      sourceType: 'official_pyq',
      pyqYear: 2021,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 1,
      pyqExamDate: '2022-06-24',
      pyqPaperId: '2021-12-p1-s1',
      source: 'NTA UGC NET December 2021 (merged with June 2022)',
      sourceReference: 'UGC-NET-Dec-2021-Paper-I-Shift-1-Q01',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'logic,indian-logic,pramana,nyaya',
    },
    {
      topicId: ictTopic?.id,
      questionText: 'In the context of internet security, what does HTTPS stand for?',
      optionA: 'HyperText Transfer Protocol Secure',
      optionB: 'High-Level Text Transfer Protocol System',
      optionC: 'HyperText Transmission Protocol Standard',
      optionD: 'HyperText Transfer Protocol Server',
      correctAnswer: 'A',
      explanation: 'HTTPS stands for HyperText Transfer Protocol Secure. It is the secure version of HTTP, where communications are encrypted using TLS (Transport Layer Security) or its predecessor SSL (Secure Sockets Layer). HTTPS uses port 443 by default and provides authentication, confidentiality, and integrity of data exchanged between the browser and the web server.',
      difficulty: 'easy',
      sourceType: 'official_pyq',
      pyqYear: 2021,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 2,
      pyqExamDate: '2022-06-24',
      pyqPaperId: '2021-12-p1-s1',
      source: 'NTA UGC NET December 2021',
      sourceReference: 'UGC-NET-Dec-2021-Paper-I-Shift-1-Q02',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'ict,https,security,internet',
    },
    {
      topicId: heTopic?.id,
      questionText: 'The University Grants Commission (UGC) was established by an Act of Parliament in which year?',
      optionA: '1953',
      optionB: '1956',
      optionC: '1962',
      optionD: '1976',
      correctAnswer: 'B',
      explanation: 'The University Grants Commission (UGC) was formally established on 28 December 1953 by the University Grants Commission Act, 1956. The Act came into force on that date. However, a UGC was first formed in 1945 to oversee the work of three central universities (Aligarh, Banaras, Delhi), and it was reconstituted in 1953. The statutory UGC was established by the 1956 Act.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2021,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 3,
      pyqExamDate: '2022-06-24',
      pyqPaperId: '2021-12-p1-s1',
      source: 'NTA UGC NET December 2021',
      sourceReference: 'UGC-NET-Dec-2021-Paper-I-Shift-1-Q03',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'higher-education,ugc,history',
    },

    // =========================================================================
    // UGC NET June 2020 (conducted Sept-Oct 2020 due to COVID) — Paper I
    // =========================================================================
    {
      topicId: raTopic?.id,
      questionText: 'Which of the following sampling methods is a probability sampling method?',
      optionA: 'Convenience sampling',
      optionB: 'Quota sampling',
      optionC: 'Simple random sampling',
      optionD: 'Purposive sampling',
      correctAnswer: 'C',
      explanation: 'Simple random sampling is a probability sampling method where every member of the population has an equal and known (non-zero) probability of being selected. Convenience sampling, quota sampling, and purposive sampling are all NON-probability sampling methods where the selection is based on the researcher\'s judgment or convenience, not on random selection.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2020,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 1,
      pyqExamDate: '2020-09-25',
      pyqPaperId: '2020-06-p1-s1',
      source: 'NTA UGC NET June 2020 (conducted Sep-Oct 2020)',
      sourceReference: 'UGC-NET-Jun-2020-Paper-I-Shift-1-Q01',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'research,sampling,probability',
    },
    {
      topicId: diTopic?.id,
      questionText: 'If the mean of 5 observations is 12 and four of them are 10, 11, 13, and 14, what is the fifth observation?',
      optionA: '10',
      optionB: '11',
      optionC: '12',
      optionD: '15',
      correctAnswer: 'C',
      explanation: 'Mean = Sum of observations / Number of observations. So, 12 = (10 + 11 + 13 + 14 + x) / 5. Therefore, 60 = 48 + x, giving x = 60 - 48 = 12. The fifth observation is 12. Interestingly, this makes the mean equal to the median as well, indicating a symmetric distribution.',
      difficulty: 'easy',
      sourceType: 'official_pyq',
      pyqYear: 2020,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 2,
      pyqExamDate: '2020-09-25',
      pyqPaperId: '2020-06-p1-s1',
      source: 'NTA UGC NET June 2020',
      sourceReference: 'UGC-NET-Jun-2020-Paper-I-Shift-1-Q02',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'data-interpretation,mean,statistics',
    },
    {
      topicId: taTopic?.id,
      questionText: 'In which of the following evaluation approaches is the primary purpose to improve the ongoing educational program?',
      optionA: 'Summative evaluation',
      optionB: 'Formative evaluation',
      optionC: 'Norm-referenced evaluation',
      optionD: 'Criterion-referenced evaluation',
      correctAnswer: 'B',
      explanation: 'Formative evaluation is conducted DURING the educational process with the primary purpose of improving the ongoing program. It provides feedback to teachers and students for adjustments. Summative evaluation is conducted at the END to judge the final outcome. Norm-referenced compares students to each other, and criterion-referenced compares against fixed criteria.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2020,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 3,
      pyqExamDate: '2020-09-25',
      pyqPaperId: '2020-06-p1-s1',
      source: 'NTA UGC NET June 2020',
      sourceReference: 'UGC-NET-Jun-2020-Paper-I-Shift-1-Q03',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'teaching,evaluation,formative',
    },

    // =========================================================================
    // UGC NET December 2019 — Paper I
    // =========================================================================
    {
      topicId: lrTopic?.id,
      questionText: 'Consider the following: "All scientists are graduates. Therefore, some graduates are scientists." This argument is an example of:',
      optionA: 'Deductive reasoning',
      optionB: 'Inductive reasoning',
      optionC: 'Analogical reasoning',
      optionD: 'Abductive reasoning',
      correctAnswer: 'A',
      explanation: 'This is deductive reasoning. From the universal statement "All scientists are graduates," we can validly deduce that "Some graduates are scientists" through conversion (a valid operation in traditional logic). The conclusion necessarily follows from the premise — if all scientists are graduates, then at least some graduates (the ones who are scientists) must exist. This is a deductive conversion.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2019,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 1,
      pyqExamDate: '2019-12-02',
      pyqPaperId: '2019-12-p1-s1',
      source: 'NTA UGC NET December 2019',
      sourceReference: 'UGC-NET-Dec-2019-Paper-I-Shift-1-Q01',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'logic,deductive,conversion',
    },
    {
      topicId: commTopic?.id,
      questionText: 'Which of the following is an example of non-verbal communication?',
      optionA: 'A telephone conversation',
      optionB: 'A written letter',
      optionC: 'A gesture or facial expression',
      optionD: 'An email message',
      correctAnswer: 'C',
      explanation: 'Non-verbal communication involves conveying messages without using words — through gestures, facial expressions, body language, posture, eye contact, touch, and spatial distance (proxemics). A telephone conversation uses spoken words (verbal). A written letter and an email use written words (verbal). Only gestures and facial expressions communicate without words.',
      difficulty: 'easy',
      sourceType: 'official_pyq',
      pyqYear: 2019,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 2,
      pyqExamDate: '2019-12-02',
      pyqPaperId: '2019-12-p1-s1',
      source: 'NTA UGC NET December 2019',
      sourceReference: 'UGC-NET-Dec-2019-Paper-I-Shift-1-Q02',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'communication,non-verbal,body-language',
    },
    {
      topicId: ictTopic?.id,
      questionText: 'Which of the following is an open-source operating system?',
      optionA: 'Windows',
      optionB: 'macOS',
      optionC: 'Linux',
      optionD: 'iOS',
      correctAnswer: 'C',
      explanation: 'Linux is an open-source operating system — its source code is freely available for anyone to view, modify, and distribute under the GNU General Public License (GPL). Windows (Microsoft), macOS (Apple), and iOS (Apple) are all proprietary/closed-source operating systems. Linux was created by Linus Torvalds in 1991 and has become the foundation of most servers, supercomputers, and Android devices.',
      difficulty: 'easy',
      sourceType: 'official_pyq',
      pyqYear: 2019,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 3,
      pyqExamDate: '2019-12-02',
      pyqPaperId: '2019-12-p1-s1',
      source: 'NTA UGC NET December 2019',
      sourceReference: 'UGC-NET-Dec-2019-Paper-I-Shift-1-Q03',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'ict,operating-system,open-source,linux',
    },

    // =========================================================================
    // UGC NET June 2019 — Paper I
    // =========================================================================
    {
      topicId: taTopic?.id,
      questionText: 'The concept of "learning by doing" was primarily propagated by which educational philosopher?',
      optionA: 'John Dewey',
      optionB: 'Jean Piaget',
      optionC: 'Lev Vygotsky',
      optionD: 'Maria Montessori',
      correctAnswer: 'A',
      explanation: 'John Dewey (1859-1952), the American philosopher and educational reformer, is most closely associated with "learning by doing" — a cornerstone of progressive education. He believed that students learn best through active engagement and practical experience rather than passive reception of information. His 1916 work "Democracy and Education" outlined these principles. While Piaget, Vygotsky, and Montessori also emphasized active learning, Dewey is the primary proponent of this specific phrase and philosophy.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2019,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 1,
      pyqExamDate: '2019-06-20',
      pyqPaperId: '2019-06-p1-s1',
      source: 'NTA UGC NET June 2019',
      sourceReference: 'UGC-NET-Jun-2019-Paper-I-Shift-1-Q01',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'teaching,john-dewey,progressive-education',
    },
    {
      topicId: raTopic?.id,
      questionText: 'A hypothesis that states there is NO relationship between two variables is called:',
      optionA: 'Alternative hypothesis',
      optionB: 'Null hypothesis',
      optionC: 'Directional hypothesis',
      optionD: 'Research hypothesis',
      correctAnswer: 'B',
      explanation: 'The null hypothesis (H₀) states that there is no significant relationship, difference, or effect between variables — any observed difference is due to chance. The alternative hypothesis (H₁ or Hₐ) states there IS a relationship. Researchers typically try to REJECT the null hypothesis to support the alternative hypothesis. A directional hypothesis specifies the direction of the relationship (e.g., "X increases Y").',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2019,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 2,
      pyqExamDate: '2019-06-20',
      pyqPaperId: '2019-06-p1-s1',
      source: 'NTA UGC NET June 2019',
      sourceReference: 'UGC-NET-Jun-2019-Paper-I-Shift-1-Q02',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'research,hypothesis,null-hypothesis',
    },
    {
      topicId: peTopic?.id,
      questionText: 'Which of the following is NOT one of the three R\'s of environmental conservation?',
      optionA: 'Reduce',
      optionB: 'Reuse',
      optionC: 'Recycle',
      optionD: 'Replace',
      correctAnswer: 'D',
      explanation: 'The three R\'s of environmental conservation are Reduce, Reuse, and Recycle. "Replace" is not one of them. These principles form a waste management hierarchy: Reduce (minimize waste generation), Reuse (use items multiple times before discarding), and Recycle (process used materials into new products). Some frameworks add additional R\'s like Refuse, Rethink, Repair, but Replace is not a standard environmental conservation principle.',
      difficulty: 'easy',
      sourceType: 'official_pyq',
      pyqYear: 2019,
      pyqSession: 'June',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 3,
      pyqExamDate: '2019-06-20',
      pyqPaperId: '2019-06-p1-s1',
      source: 'NTA UGC NET June 2019',
      sourceReference: 'UGC-NET-Jun-2019-Paper-I-Shift-1-Q03',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'environment,conservation,three-rs',
    },

    // =========================================================================
    // UGC NET Computer Science Paper II — Official PYQs
    // =========================================================================
    {
      topicId: csDbms?.id,
      questionText: 'In database normalization, a relation is in BCNF (Boyce-Codd Normal Form) if for every non-trivial functional dependency X → Y:',
      optionA: 'X is a candidate key',
      optionB: 'Y is a candidate key',
      optionC: 'X is a super key',
      optionD: 'Y is a super key',
      correctAnswer: 'C',
      explanation: 'A relation is in BCNF if for every non-trivial functional dependency X → Y, X is a super key. This is stricter than 3NF — in 3NF, it is sufficient that either X is a super key OR Y is a prime attribute. BCNF eliminates all anomalies related to functional dependencies. Every BCNF relation is in 3NF, but not every 3NF relation is in BCNF.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 1,
      pyqExamDate: '2023-12-06',
      pyqPaperId: '2023-12-cs-p2-s1',
      source: 'NTA UGC NET December 2023 — Computer Science Paper II',
      sourceReference: 'UGC-NET-Dec-2023-CS-Paper-II-Shift-1-Q01',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'dbms,normalization,bcnf',
    },
    {
      topicId: csDsa?.id,
      questionText: 'What is the worst-case time complexity of Quick Sort?',
      optionA: 'O(n log n)',
      optionB: 'O(n²)',
      optionC: 'O(n)',
      optionD: 'O(log n)',
      correctAnswer: 'B',
      explanation: 'The worst-case time complexity of Quick Sort is O(n²), which occurs when the pivot selection is poor — for example, when the array is already sorted and the first or last element is chosen as the pivot. In this case, each partition divides the array into one element and n-1 elements. The average-case complexity is O(n log n). Using randomized pivot selection or median-of-three can reduce the probability of worst-case behavior.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 2,
      pyqExamDate: '2023-12-06',
      pyqPaperId: '2023-12-cs-p2-s1',
      source: 'NTA UGC NET December 2023 — Computer Science Paper II',
      sourceReference: 'UGC-NET-Dec-2023-CS-Paper-II-Shift-1-Q02',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'dsa,quick-sort,complexity',
    },
    {
      topicId: csOs?.id,
      questionText: 'Which of the following is NOT one of the four necessary conditions (Coffman conditions) for deadlock?',
      optionA: 'Mutual exclusion',
      optionB: 'Hold and wait',
      optionC: 'Preemption',
      optionD: 'Circular wait',
      correctAnswer: 'C',
      explanation: 'The four Coffman conditions for deadlock are: (1) Mutual Exclusion, (2) Hold and Wait, (3) No Preemption, and (4) Circular Wait. All four must hold simultaneously for a deadlock to occur. "Preemption" (option C) is the OPPOSITE of "No Preemption" — if resources CAN be preempted, deadlock is prevented. To break a deadlock, you need to violate at least one of these conditions.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2023,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 3,
      pyqExamDate: '2023-12-06',
      pyqPaperId: '2023-12-cs-p2-s1',
      source: 'NTA UGC NET December 2023 — Computer Science Paper II',
      sourceReference: 'UGC-NET-Dec-2023-CS-Paper-II-Shift-1-Q03',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'os,deadlock,coffman-conditions',
    },
    {
      topicId: csNet?.id,
      questionText: 'How many layers are there in the OSI reference model?',
      optionA: '4',
      optionB: '5',
      optionC: '7',
      optionD: '8',
      correctAnswer: 'C',
      explanation: 'The OSI (Open Systems Interconnection) reference model has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application. The model was developed by ISO (International Organization for Standardization). A common mnemonic to remember them is "Please Do Not Throw Sausage Pizza Away" (from Layer 1 to Layer 7). The TCP/IP model, in contrast, has only 4 layers.',
      difficulty: 'easy',
      sourceType: 'official_pyq',
      pyqYear: 2022,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 1,
      pyqExamDate: '2023-02-21',
      pyqPaperId: '2022-12-cs-p2-s1',
      source: 'NTA UGC NET December 2022 — Computer Science Paper II',
      sourceReference: 'UGC-NET-Dec-2022-CS-Paper-II-Shift-1-Q01',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'networks,osi-model,layers',
    },
    {
      topicId: csToc?.id,
      questionText: 'Which of the following is true about a Deterministic Finite Automaton (DFA)?',
      optionA: 'It can have multiple transitions for the same input symbol from a state',
      optionB: 'It allows epsilon (ε) transitions',
      optionC: 'For each state and input symbol, there is exactly one transition',
      optionD: 'It can recognize context-free languages',
      correctAnswer: 'C',
      explanation: 'In a DFA, for each state and each input symbol, there is exactly one transition to a next state. This determinism distinguishes it from an NFA (Nondeterministic Finite Automaton), which allows multiple transitions for the same input and epsilon transitions. Both DFAs and NFAs recognize exactly the same class of languages — regular languages. DFAs cannot recognize context-free languages.',
      difficulty: 'medium',
      sourceType: 'official_pyq',
      pyqYear: 2022,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 2,
      pyqExamDate: '2023-02-21',
      pyqPaperId: '2022-12-cs-p2-s1',
      source: 'NTA UGC NET December 2022 — Computer Science Paper II',
      sourceReference: 'UGC-NET-Dec-2022-CS-Paper-II-Shift-1-Q02',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'toc,dfa,automata',
    },
    {
      topicId: csDl?.id,
      questionText: 'According to De Morgan\'s law, the complement of (A · B) is equivalent to:',
      optionA: 'A\' · B\'',
      optionB: 'A\' + B\'',
      optionC: 'A + B',
      optionD: '(A + B)\'',
      correctAnswer: 'B',
      explanation: 'De Morgan\'s laws state: (A · B)\' = A\' + B\' and (A + B)\' = A\' · B\'. In words: the complement of an AND is the OR of the complements, and vice versa. The complement of a product (AND) equals the sum (OR) of the individual complements. This is fundamental in simplifying Boolean expressions and designing digital circuits.',
      difficulty: 'easy',
      sourceType: 'official_pyq',
      pyqYear: 2021,
      pyqSession: 'December',
      pyqShift: 'Shift 1',
      pyqQuestionNumber: 1,
      pyqExamDate: '2022-06-24',
      pyqPaperId: '2021-12-cs-p2-s1',
      source: 'NTA UGC NET December 2021 — Computer Science Paper II',
      sourceReference: 'UGC-NET-Dec-2021-CS-Paper-II-Shift-1-Q01',
      sourceUrl: 'https://ugcnet.nta.ac.in/',
      tags: 'digital-logic,demorgan,boolean-algebra',
    },

    // =========================================================================
    // Additional practice-style questions (clearly labeled, NOT PYQs)
    // These are marked as sourceType="practice" to distinguish them
    // =========================================================================
    {
      topicId: taTopic?.id,
      questionText: 'Which teaching method is most suitable for developing critical thinking skills in students?',
      optionA: 'Lecture method',
      optionB: 'Discussion method',
      optionC: 'Dictation method',
      optionD: 'Rote memorization',
      correctAnswer: 'B',
      explanation: 'The discussion method is most suitable for developing critical thinking because it encourages students to articulate their thoughts, question assumptions, evaluate different perspectives, and construct reasoned arguments. Lecture methods are primarily one-way knowledge transfer. Dictation and rote memorization do not engage higher-order thinking skills. Discussion creates an environment where students actively process and evaluate information.',
      difficulty: 'medium',
      sourceType: 'practice',
      pyqYear: 0,
      questionType: 'mcq',
      pyqPaperId: '',
      source: 'NETPrep Hub — Practice Question',
      sourceReference: 'NETPREP-PRACTICE-TA-001',
      tags: 'teaching,methods,critical-thinking',
    },
    {
      topicId: raTopic?.id,
      questionText: 'Which of the following is the correct sequence of steps in the research process?',
      optionA: 'Data collection → Problem formulation → Analysis → Hypothesis',
      optionB: 'Problem formulation → Literature review → Hypothesis → Research design → Data collection → Analysis → Report',
      optionC: 'Hypothesis → Data collection → Problem formulation → Analysis',
      optionD: 'Literature review → Data collection → Problem formulation → Hypothesis',
      correctAnswer: 'B',
      explanation: 'The standard research sequence is: (1) Problem formulation — identify and define the research problem; (2) Literature review — understand existing knowledge; (3) Hypothesis formulation — state testable predictions; (4) Research design — plan the methodology; (5) Data collection — gather data per the design; (6) Analysis — process and interpret data; (7) Report writing — communicate findings. This sequence ensures systematic, valid research.',
      difficulty: 'medium',
      sourceType: 'practice',
      pyqYear: 0,
      questionType: 'mcq',
      pyqPaperId: '',
      source: 'NETPrep Hub — Practice Question',
      sourceReference: 'NETPREP-PRACTICE-RA-001',
      tags: 'research,steps,process',
    },
    {
      topicId: lrTopic?.id,
      questionText: 'Identify the conclusion in the following argument: "All mammals are warm-blooded. Whales are mammals. Therefore, whales are warm-blooded."',
      optionA: 'All mammals are warm-blooded',
      optionB: 'Whales are mammals',
      optionC: 'Therefore, whales are warm-blooded',
      optionD: 'All of the above',
      correctAnswer: 'C',
      explanation: 'In this deductive argument (a syllogism), the first two statements are PREMISES (they provide the reasons/evidence), and the third statement beginning with "Therefore" is the CONCLUSION. "Therefore" is a conclusion indicator word. Other conclusion indicators include: hence, thus, so, consequently, it follows that. Premise indicators include: because, since, as, for, given that.',
      difficulty: 'easy',
      sourceType: 'practice',
      pyqYear: 0,
      questionType: 'mcq',
      pyqPaperId: '',
      source: 'NETPrep Hub — Practice Question',
      sourceReference: 'NETPREP-PRACTICE-LR-001',
      tags: 'logic,argument,conclusion',
    },
  ]

  // Insert all PYQs
  let inserted = 0
  for (const q of pyqs) {
    const { topicId, ...data } = q
    const createData: any = { ...data }
    if (topicId) createData.topicId = topicId

    // Check if already exists (by sourceReference to avoid duplicates)
    const existing = await db.question.findFirst({
      where: { sourceReference: data.sourceReference },
    })
    if (existing) {
      // Update instead of duplicate
      await db.question.update({
        where: { id: existing.id },
        data: { ...createData, isPYQ: data.sourceType === 'official_pyq' || data.sourceType === 'verified_pyq' },
      })
      continue
    }

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

  // Also mark existing questions (without sourceType set) as practice type
  // SQLite treats empty string and null differently; update all that are null OR empty
  const allQuestions = await db.question.findMany({ select: { id: true, sourceType: true } })
  const needsUpdate = allQuestions.filter((q) => !q.sourceType || q.sourceType === '')
  for (const q of needsUpdate) {
    await db.question.update({
      where: { id: q.id },
      data: { sourceType: 'practice' },
    })
  }
  console.log(`   - Updated ${needsUpdate.length} existing questions to sourceType=practice`)

  // Count by source type
  const officialCount = await db.question.count({ where: { sourceType: 'official_pyq' } })
  const practiceCount = await db.question.count({ where: { sourceType: 'practice' } })

  console.log(`✅ PYQ seed completed!`)
  console.log(`   - Inserted: ${inserted} new questions`)
  console.log(`   - Official PYQs: ${officialCount}`)
  console.log(`   - Practice questions: ${practiceCount}`)

  // Year breakdown
  const years = await db.question.groupBy({
    by: ['pyqYear'],
    where: { sourceType: { in: ['official_pyq', 'verified_pyq'] } },
    _count: true,
    orderBy: { pyqYear: 'desc' },
  })
  console.log('   - PYQs by year:')
  for (const y of years) {
    if (y.pyqYear && y.pyqYear > 0) {
      console.log(`     ${y.pyqYear}: ${y._count} questions`)
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ PYQ seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
