import { db } from '../src/lib/db'

const sample = await db.question.findMany({
  take: 5,
  where: { questionCode: null },
  select: {
    id: true,
    paper: true,
    syllabusUnit: true,
    sourceType: true,
    questionType: true,
    responseType: true,
    topic: { select: { name: true, unit: { select: { name: true, subject: { select: { name: true } } } } } },
  },
})
console.log(JSON.stringify(sample, null, 2))

const total = await db.question.count({ where: { questionCode: null } })
console.log('legacy (no code) count:', total)

const byStatus = await db.question.groupBy({ by: ['status'], _count: { _all: true } })
console.log('by status:', JSON.stringify(byStatus))

const byPaperUnit = await db.question.groupBy({
  by: ['paper', 'syllabusUnit'],
  _count: { _all: true },
  orderBy: [{ paper: 'asc' }, { syllabusUnit: 'asc' }],
})
console.log('by paper/unit:', JSON.stringify(byPaperUnit))

await db.$disconnect()
