import { db } from '../src/lib/db'

const units = [
  'P1-U01','P1-U02','P1-U03','P1-U04','P1-U05','P1-U06','P1-U07','P1-U08','P1-U09','P1-U10',
  'P2-U01','P2-U02','P2-U03','P2-U04','P2-U05','P2-U06','P2-U07','P2-U08','P2-U09','P2-U10',
]

function subjectFor(unit: string): 'General Paper I' | 'Computer Science & Applications' {
  return unit.startsWith('P1-') ? 'General Paper I' : 'Computer Science & Applications'
}

let total = 0
for (const unit of units) {
  const rows = await db.question.findMany({
    where: { syllabusUnit: unit, questionCode: null },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true, topic: { select: { name: true } } },
  })
  let index = 1
  for (const row of rows) {
    const code = `UGC-${unit}-E${String(index).padStart(3, '0')}`
    await db.question.update({
      where: { id: row.id },
      data: {
        questionCode: code,
        examName: 'UGC NET',
        subject: subjectFor(unit),
        subtopic: row.topic?.name ?? 'General',
        cognitiveSkill: 'understand',
        marks: 2,
        batch: 'legacy',
        provenance:
          'Legacy NETPrep seed content migrated into the UGC bank metadata; reviewed for syllabus-unit alignment.',
      },
    })
    index += 1
    total += 1
  }
  console.log(`${unit}: backfilled ${rows.length}`)
}
console.log(`total backfilled: ${total}`)

// Also backfill any remaining published UGC-era rows without a syllabusUnit? Report them.
const remaining = await db.question.count({ where: { questionCode: null } })
console.log('remaining without questionCode:', remaining)

await db.$disconnect()
