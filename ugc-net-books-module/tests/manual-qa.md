# Manual QA Checklist §40-46

## Workflow §46
- [ ] Home -> Books -> Subjects (2 subjects: Paper I, Computer Science) -> Select Subject
- [ ] Single-book subject -> opens reader directly; Multi-book -> selector with 2-3 books, progress, Start/Continue
- [ ] Reader -> Read, select text -> Highlight (yellow/green/blue/pink/orange) -> toast ✓ Highlight saved
- [ ] Highlight -> Add Note -> My Notes shows it -> Edit/Delete -> reappears after reload
- [ ] Bookmark page (B) -> Bookmarks tab -> click -> navigates to page
- [ ] Leave reader -> Return later -> Continue Reading restores page/zoom/highlights/notes/bookmarks
- [ ] Search -> highlights + notes results -> click -> navigates to page

## Admin §30
- [ ] Admin -> Books -> Scan Library (npm run books:import) -> new PDF appears
- [ ] Admin -> Books -> Upload PDF (replace) -> fileUrl updates
- [ ] Admin -> edit metadata (title/author/accessLevel) -> saves

## Security §26
- [ ] Try GET /api/books/highlights?bookId=otherUsersBookId -> not returned
- [ ] Try PATCH /api/books/highlights/:id of other user -> 404
- [ ] filePath never in JSON (only fileUrl)

## Mobile §16
- [ ] Reader on 375px: sidebar -> drawer, bottom toolbar visible, highlight via touch, no horizontal overflow
