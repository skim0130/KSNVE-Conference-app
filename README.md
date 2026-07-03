# KSNVE 2026 Fall Conference Test PWA

This is a mobile-first fall-conference test configuration. Paper, session,
abstract, XML, and page-image contents still come from the 2026 spring dataset;
conference metadata and dates are mapped at runtime for fall testing.

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
- `data/papers-with-abstracts.json` (primary app paper data)
- `data/papers.json` (immutable program metadata used by the extraction pipeline)
- `data/speakers.json`
- `data/venues.json`

## Suggested next Codex tasks

1. Add paper detail pages with route `/papers/[id]`.
2. Improve PDF parsing and match papers to abstracts from the abstract book.
3. Add session Q&A and notice board mockups.
4. Add Firebase or Supabase backend.
5. Add admin page for editing sessions and sending notices.
