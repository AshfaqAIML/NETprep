import { db } from '../src/lib/db'

const units = await db.unit.findMany({
  include: { subject: true },
  orderBy: [{ subject: { name: 'asc' } }, { name: 'asc' }],
})
for (const unit of units) {
  console.log(`${unit.subject?.name} | ${unit.name} | ${unit.id}`)
}
await db.$disconnect()
