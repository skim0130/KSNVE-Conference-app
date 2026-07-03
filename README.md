# KSNVE 2026 Spring Conference PWA Prototype

This is a mobile-first PWA prototype generated from the uploaded 2026 KSNVE Spring Conference program book PDF.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Current MVP features

- Home dashboard
- Program by date
- Session cards
- Paper list
- Search across paper title, authors, session, venue, presenter
- My Schedule using localStorage
- Venue list
- PWA manifest

## Data files

- `data/sessions.json`
- `data/papers.json`
- `data/speakers.json`
- `data/venues.json`

## Suggested next Codex tasks

1. Add paper detail pages with route `/papers/[id]`.
2. Improve PDF parsing and match papers to abstracts from the abstract book.
3. Add session Q&A and notice board mockups.
4. Add Firebase or Supabase backend.
5. Add admin page for editing sessions and sending notices.
