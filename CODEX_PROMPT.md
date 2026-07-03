You are working on a Next.js PWA prototype for the KSNVE 2026 Spring Conference.

Current state:
- Data are stored in local JSON files under `/data`.
- Main UI is in `/app/page.tsx`.
- The app already supports search and localStorage-based My Schedule.

Please continue development with the following priorities:
1. Refactor the single-page app into reusable components: Header, Tabs, PaperCard, SessionCard, VenueCard, SearchBar.
2. Add paper detail pages under `/papers/[id]`.
3. Add session detail pages under `/sessions/[id]` listing all papers in that session.
4. Add a notices page with mock data.
5. Add a simple sponsor page.
6. Keep the app mobile-first, clean, and conference-app-like.
7. Do not add login or backend yet.
8. Preserve Korean text rendering and search behavior.
