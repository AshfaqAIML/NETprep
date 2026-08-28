/**
 * Seed exam information into the database.
 * Run: `bun prisma/seed-exam-info.ts`
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding exam information...')

  const examInfos = [
    {
      key: 'pattern',
      title: 'Exam Pattern',
      content: `# UGC NET Exam Pattern

## Structure

UGC NET consists of **two papers**, both conducted in a single 3-hour session (180 minutes):

| Paper | Questions | Marks | Duration | Type |
|-------|-----------|-------|----------|------|
| **Paper I** | 50 | 100 | 3 hours (combined) | General (Teaching & Research Aptitude) |
| **Paper II** | 100 | 200 | 3 hours (combined) | Subject-specific |

- **Total:** 150 questions, 300 marks
- **Marking:** 2 marks per correct answer
- **Negative marking:** None — attempt all questions
- **Mode:** Computer-Based Test (CBT)
- **Medium:** English and Hindi (subject-dependent)

## Paper I — Teaching & Research Aptitude

Tests reasoning ability, reading comprehension, divergent thinking, and general awareness of teaching and research processes.

**10 Units:**
1. Teaching Aptitude
2. Research Aptitude
3. Reading Comprehension
4. Communication
5. Mathematical Reasoning & Aptitude
6. Logical Reasoning
7. Data Interpretation
8. Information & Communication Technology (ICT)
9. People, Development & Environment
10. Higher Education System

## Paper II — Subject-Specific

Tests in-depth knowledge of the chosen subject. 100 questions from the full syllabus of the selected subject.`,
      category: 'Pattern',
      sortOrder: 1,
    },
    {
      key: 'eligibility',
      title: 'Eligibility Criteria',
      content: `# UGC NET Eligibility Criteria

## Educational Qualification

- **Master's degree** (or equivalent) from a UGC-recognised university
- **Minimum 55% marks** (General/EWS categories)
- **Minimum 50% marks** (OBC/SC/ST/PwD/Transgender categories)
- Candidates in the **final year** of their Master's programme are eligible (provisional)

## Age Limit

| Category | JRF | Assistant Professor |
|----------|-----|---------------------|
| General/EWS/OBC | Maximum 30 years | No upper age limit |
| SC/ST/PwD/Transgender/Women | Maximum 35 years (relaxation) | No upper age limit |

## Important Notes

- There is **no restriction on the number of attempts** for Assistant Professor.
- For JRF, the age limit applies as above.
- OBC candidates must belong to the **Non-Creamy Layer** to claim relaxation.
- Candidates who have qualified earlier are **not eligible to appear again** for the same category.

## Subjects

UGC NET is conducted in **85 subjects**. Candidates choose their Paper II subject based on their postgraduate discipline.

> **Disclaimer:** This is a general summary. Always verify the latest eligibility criteria in the official NTA information bulletin before applying.`,
      category: 'Eligibility',
      sortOrder: 2,
    },
    {
      key: 'dates',
      title: 'Important Dates',
      content: `# Important Dates

## UGC NET Cycles

UGC NET is conducted **twice a year** — typically in **June** and **December** cycles.

> ⚠️ **Important:** Dates change every cycle. Do NOT rely on outdated information. Always check the official NTA website (ugcnet.nta.ac.in) for the latest schedule.

## Typical Timeline (per cycle)

| Event | Approximate Timing |
|-------|-------------------|
| Notification release | 2 months before exam |
| Online application opens | ~10 weeks before exam |
| Application deadline | ~6 weeks before exam |
| Admit card release | ~2 weeks before exam |
| Examination date(s) | As scheduled by NTA |
| Provisional answer key | Within 1 week of exam |
| Objection window | 2-3 days after answer key |
| Final answer key | 2-4 weeks after exam |
| Result declaration | 4-6 weeks after exam |

## How to Stay Updated

1. **Official website:** [ugcnet.nta.ac.in](https://ugcnet.nta.ac.in)
2. **NTA app** (available on iOS and Android)
3. **Email/SMS alerts** — register on the NTA portal
4. **NETPrep Hub** — we update the Resources section as new notices are published

> **Disclaimer:** NETPrep Hub is not affiliated with NTA. Dates shown here are indicative. Verify on the official NTA portal before planning.`,
      category: 'Dates',
      sortOrder: 3,
    },
    {
      key: 'jrf',
      title: 'JRF & Assistant Professor — What\'s the Difference?',
      content: `# JRF vs Assistant Professor

UGC NET qualification serves two purposes:

## 1. Junior Research Fellowship (JRF)

- **Award:** ₹37,000–₹42,000/month fellowship for 5 years (for research / M.Phil / PhD)
- **Age limit:** 30 years (general), 35 years (reserved categories)
- **Validity:** 3 years from the date of issue of the JRF award letter
- **Purpose:** Supports candidates who want to pursue research / PhD

## 2. Assistant Professor (AP)

- **No age limit**
- **No fellowship**
- **Validity:** Lifetime (once qualified, you are eligible to apply for Assistant Professor positions)
- **Purpose:** Eligibility for teaching positions in universities and colleges

## How the Cut-off Works

NTA releases **three cut-off lists**:

| List | Who qualifies |
|------|---------------|
| JRF + AP (top ~6% of candidates) | Eligible for both JRF and Assistant Professor |
| Assistant Professor only | Eligible for Assistant Professor only |
| Assistant Professor (subject-specific) | For specific subjects |

The JRF cut-off is always higher than the Assistant Professor cut-off. Candidates who meet the JRF cut-off automatically qualify for Assistant Professor as well.

## Strategy Tip

If your goal is JRF, aim for a **higher score** than the AP cut-off — ideally 10-15% above. The competition for JRF is significantly more intense.`,
      category: 'General',
      sortOrder: 4,
    },
    {
      key: 'application',
      title: 'Application Process',
      content: `# Application Process

## Steps to Apply

1. **Check eligibility** — Verify you meet educational and age criteria (see Eligibility page)
2. **Visit the official portal** — [ugcnet.nta.ac.in](https://ugcnet.nta.ac.in)
3. **Register** — Create an account with your email and mobile number
4. **Fill the application form** — Personal details, academic qualifications, subject choice, exam centre
5. **Upload documents** — Photograph, signature, category certificate (if applicable), PwD certificate (if applicable)
6. **Pay the application fee** — Online via UPI, net banking, or card
7. **Download confirmation page** — Keep for your records

## Application Fee (indicative — verify on NTA portal)

| Category | Fee |
|----------|-----|
| General / EWS | ₹1,150 |
| OBC (Non-Creamy Layer) | ₹600 |
| SC / ST / PwD / Transgender | ₹325 |

> **Note:** Fee structure may change. Always verify the latest fee in the official information bulletin.

## Required Documents

- Recent passport-size photograph (4KB–200KB)
- Scanned signature (4KB–30KB)
- Category certificate (if claiming reservation)
- PwD certificate (if applicable)
- Marksheet/degree of postgraduation (for final-year candidates: a certificate from the institution)

## After Application

- **Admit card** — Download from the NTA portal ~2 weeks before the exam
- **Exam centre** — As allotted by NTA (cannot be changed after the deadline)
- **Reporting time** — Arrive at least 30 minutes before the exam start time`,
      category: 'Application',
      sortOrder: 5,
    },
    {
      key: 'result',
      title: 'Result & Cut-off',
      content: `# Result & Cut-off

## How Results Are Declared

NTA declares UGC NET results on the official portal (ugcnet.nta.ac.in) approximately 4–6 weeks after the examination.

## Score Calculation

- **Paper I:** 50 questions × 2 marks = 100 marks
- **Paper II:** 100 questions × 2 marks = 200 marks
- **Total:** 300 marks
- **No negative marking** — all questions should be attempted

## Qualifying Criteria

To qualify UGC NET, candidates must secure:

1. **Category-wise minimum marks** (see table below)
2. **A rank within the top ~6% of candidates** who appeared in both papers (for JRF + AP)

### Minimum Qualifying Marks

| Category | Paper I | Paper II | Aggregate |
|----------|---------|----------|-----------|
| General / EWS | 40% | 40% | 40% (120/300) |
| OBC / SC / ST / PwD / Transgender | 35% | 35% | 35% (105/300) |

## Cut-off Lists

NTA releases **three separate cut-off lists**:

1. **JRF & Assistant Professor** — Top ~6% candidates (subject to category-wise minimums)
2. **Assistant Professor only** — Candidates above the AP minimum but below the JRF cut-off
3. **Assistant Professor (Subject-specific)** — Subject-wise AP cut-offs

## How to Check Your Result

1. Visit [ugcnet.nta.ac.in](https://ugcnet.nta.ac.in)
2. Click on "Download Result / Scorecard"
3. Enter your Application Number and Date of Birth
4. Download and print the scorecard

## e-Certificate

- The e-certificate for qualified candidates is issued separately by UGC (not NTA)
- Usually available on the UGC e-certificate portal ~2 months after the result
- Valid for 3 years (JRF) or lifetime (Assistant Professor)`,
      category: 'Result',
      sortOrder: 6,
    },
  ]

  for (const info of examInfos) {
    await db.examInfo.upsert({
      where: { key: info.key },
      update: info,
      create: info,
    })
    console.log(`  ✓ ${info.title}`)
  }

  console.log('✅ Exam info seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
