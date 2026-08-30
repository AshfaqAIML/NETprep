# UGC NET Books & Reading Module — Professional Digital Library

Standalone, production-ready Books & Reading Platform module for **NETPrep Hub** (Next.js 16 + Prisma Postgres/Neon + NextAuth).

Transforms the Books section into a professional academic reading environment for UGC NET aspirants — subject-first library, pro PDF reader with highlights/notes/bookmarks, progress/history, and admin management.

**Status:** Wired into `AshfaqAIML/NETprep` `main` — `BookLibraryView` + `BookReaderProView` live at `https://ne-tprep.vercel.app` (`/books`).

## Quick Start
```bash
npm install
cp .env.example .env # set DATABASE_URL, BOOKS_SOURCE_PATH
npx prisma generate
npx prisma db push
npm run books:import # scans BOOKS_SOURCE_PATH -> Neon fileData
npm run dev
```

See `INSTALLATION.md`, `CONFIGURATION.md`, `INTEGRATION.md`.

## Module Structure (adapted to existing stack §20)
```
ugc-net-books-module/
├── README.md / INSTALLATION.md / CONFIGURATION.md / INTEGRATION.md / TROUBLESHOOTING.md
├── frontend/  # BookLibraryView, SubjectBookSelector, BookReaderProView, ReaderToolbar/Sidebar
├── backend/   # /api/books/* (library, progress, highlights, notes, bookmarks, history, preferences, [id]/file)
├── database/  # Prisma models: Book, BookChapter, ReadingProgress, Highlight, BookNote, BookBookmark, ReadingHistory, ReaderPreference + migrations
├── importer/  # scripts/books-importer.ts (BOOKS_SOURCE_PATH, dedup, fileData -> Neon/S3)
├── reader/    # PDF viewer (iframe + react-pdf ready), HighlightToolbar, NotesPanel
└── tests/     # importer, reader, security, mobile
```

## Integration Contract §39
- **Env:** `BOOKS_SOURCE_PATH` (default `C:\...\Books`), `DATABASE_URL` (Neon `postgresql://...`), `STORAGE_*` for S3
- **Auth:** `getCurrentUserId(session)` via `next-auth` — all user data isolated by `userId`
- **Nav:** `lib/store` `ViewKey` `book-library`/`book-reader-pro` → `app/page.tsx` ViewRouter → `Header` `Books`
- **DB:** `npx prisma db push` creates 7 new tables, preserves existing

## Acceptance Workflow §46
`Home → Books → Subjects → Select Subject (1-book skip / multi-book selector) → Reader → Highlight/Note/Bookmark → Leave → Continue Reading` — verified end-to-end.
