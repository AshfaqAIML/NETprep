import { db } from '../src/lib/db'

const units = [
  'P1-U01','P1-U02','P1-U03','P1-U04','P1-U05','P1-U06','P1-U07','P1-U08','P1-U09','P1-U10',
  'P2-U01','P2-U02','P2-U03','P2-U04','P2-U05','P2-U06','P2-U07','P2-U08','P2-U09','P2-U10',
]

const rows = await db.question.groupBy({
  by: ['syllabusUnit'],
  where: { status: 'published', responseType: 'single', syllabusUnit: { in: units } },
  _count: { _all: true },
})
const counts = new Map(rows.map((row) => [row.syllabusUnit, row._count._all]))
let total = 0
for (const unit of units) {
  const count = counts.get(unit) ?? 0
  const need = Math.max(0, 40 - count)
  total += need
  console.log(`${unit} existing=${count} new=${need}`)
}
console.log(`new total=${total}`)
await db.$disconnect()
