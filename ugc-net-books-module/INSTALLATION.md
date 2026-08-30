# Installation

## 1. Copy Module
```bash
# From standalone package or wire via git:
git clone https://github.com/AshfaqAIML/NETprep.git
# Module is already wired in src/app/api/books/* + src/components/views/book-*
```

## 2. Install
```bash
npm install  # or bun install
# Requires: next@16, prisma@6, @prisma/client, react-pdf/pdfjs-dist (optional), bcryptjs
```

## 3. Env
```bash
cp .env.example .env
# Required:
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
BOOKS_SOURCE_PATH=C:\Users\moham\Downloads\Kamraan\WEB DEV\NETprep\Books
# Optional S3 (else Neon fileData):
# STORAGE_PROVIDER=s3
# S3_ENDPOINT= S3_REGION= S3_BUCKET= S3_ACCESS_KEY= S3_SECRET_KEY=
```

## 4. DB
```bash
npx prisma generate
npx prisma db push --accept-data-loss # creates BookChapter, ReadingProgress, Highlight, BookNote, BookBookmark, ReadingHistory, ReaderPreference + Account/Session for OAuth
```

## 5. Import Books
```bash
npm run books:import # or bun scripts/books-importer.ts
# Found 14 files -> Created 2 (Paper I), Updated 12 — fileData stored in Neon, fileUrl=/api/books/:id/file
```

## 6. Dev
```bash
npm run dev # http://localhost:3000 -> Books -> Paper I (4 books) / Computer Science (16 books)
```

## 7. Vercel
Set same env vars in Vercel Dashboard → Settings → Environment Variables (Production, Preview, Development) → Redeploy.
