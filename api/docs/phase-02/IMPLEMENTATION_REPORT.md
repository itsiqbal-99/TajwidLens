# Phase 02 — Learning Progress + Personal Dashboard

25 October 2026, Asia/Jakarta. Phase 02 implementation; development verification is recorded separately in TEST_REPORT.md. No production deployment.

## Scope and baseline

Read the user Phase 02 prompt, CHECKPOINT, IMPLEMENTATION_PHASES, ACCEPTANCE_TESTING, ENGINEERING_RULES and relevant existing web/API source before edits. Required three primary documents remain unchanged. Baseline web typecheck / 25 unit tests PASS; API typecheck / auth browser suite 18 PASS, 1 real-PostgreSQL test SKIP. Existing local changes to api/package.json (dev command) and web/next-env.d.ts are user-owned and preserved.

## Catalogue and identity

Existing 24 IDs remain unchanged, from `pengantar` through `tafkhim-tarqiq`; they are persisted identities, not array offsets. `shared/lesson-catalog.json` is the single metadata source: id, slug, title, category, summary and explicit order. Web lesson explanations, examples, pronunciation, warnings, focus text and Quran datasets are untouched; metadata was extracted mechanically, without rewriting its wording. Frontend lesson content joins by ID and orders by the catalogue. API imports only this small catalogue, never full lesson content.

Deployment artifact layout retains `api/` and `shared/` as siblings. Frontend static builds include the JSON at build time; Turbopack root is set to the workspace. No frontend Node runtime or new library is required. Stable IDs must never be renamed to reorder lessons. Slug changes retain the ID and need public-route aliases; an intentional ID rename requires a reviewed forward migration updating progress references before removing the old ID.

## Database / concurrency

One new table, `user_lesson_progress`: UUID id; userId FK to users with cascade; lessonId; IN_PROGRESS/COMPLETED; startedAt, completedAt, lastAccessedAt, createdAt, updatedAt. Unique userId/lessonId, state/completion checks, and userId/lastAccessedAt index. Missing rows mean NOT_STARTED; registration allocates none. Last access derives from the latest timestamp in these maximum-24 records, with deterministic lesson-ID tie breaking, not an activity log or extra tracking table.

Migration `LearningProgress1792886400000` is versioned, additive and registered with synchronize/migrationsRun false. Down only drops an empty Phase 02 table; it refuses to destroy progress. An exclusive table lock inside the migration transaction prevents a write racing between the empty check and drop; the TypeORM migration runner must retain its default transaction behavior. A single parameterized PostgreSQL ON CONFLICT upsert prevents duplicate insert races and status regression. COALESCE preserves the first completedAt; startedAt never changes; last access uses the database clock. No read-before-write transaction is needed for progress updates. Reference: [PostgreSQL INSERT / ON CONFLICT](https://www.postgresql.org/docs/16/sql-insert.html).

The user explicitly confirmed api/.env is development and approved migration. Read-only check found only InitialAuth applied. Only the expected LearningProgress migration was run, with a production/unexpected-migration guard: PASS, pending false. No existing account/progress was reset. Additional development verification uses unique run-owned fixture accounts and exact-ID/email cleanup; no production migration or deployment is authorized.

## API contracts

Existing SessionGuard / HttpOnly cookie / CSRF validation retained. PUT added to allowed CORS methods. Controller → Service → TypeORM, one learning module. Endpoints:

- GET `/api/v1/learning/dashboard`: summary, deterministic continueLearning, lastAccessedLessonId, completedLessons and allCompleted.
- GET `/api/v1/learning/progress`: current catalogue statuses, including virtual NOT_STARTED rows.
- GET `/api/v1/learning/progress/:lessonId`: one owned status or NOT_STARTED; unknown catalogue ID 404.
- PUT `/api/v1/learning/progress/:lessonId/start` and `/complete`: empty JSON body with existing Origin/CSRF header, returns confirmed status/timestamps. Unexpected body/query input is rejected. User identity only comes from SessionGuard, never a supplied userId.

DTO responses and error codes are documented in Swagger. Reads use one user-scoped query, not N+1 catalogue queries. Percentage is completed / current catalogue size ×100, rounded to two decimals; only COMPLETED counts. Resume chooses last incomplete; otherwise first incomplete after last access in explicit order, wrapping to earlier skipped lessons; otherwise first incomplete. All complete yields null next. Empty/missing catalogue is an error, not fabricated zero progress; unknown historical records are excluded from current catalogue totals.

## UI reference lock / decision ledger

Refero live returned NO_SUBSCRIPTION. Direct build on existing TajwidLens themes, Inter typography, profile/account surfaces, LessonVisual icons and bundled motion/visual-QA guidance, plus the user's explicit dashboard hierarchy. No separate design canvas, new image generation, large hero, chart, gamification or new style system.

| Decision | Source and purpose |
|---|---|
| Compact personal greeting and one Continue card | User Phase 02 hierarchy; CTA above unnecessary scrolling |
| Simple labelled progress bar, count and percentage | User scope; screen-reader progress text and real server values |
| Latest three completed lessons, expandable remainder | Completed access without duplicating the lesson catalogue |
| Link to existing learning library | Existing 24 routes remain public |
| Existing theme tokens and 200–280ms motion | Existing UI + Refero craft; reduced-motion disables effects |
| Error instead of fabricated 0% | User data-integrity requirement |

## Verification

See [TEST_REPORT.md](TEST_REPORT.md) for actual commands/results and [MANUAL_TEST_CHECKLIST.md](MANUAL_TEST_CHECKLIST.md) for review steps and remaining manual checks.

## Frontend and navigation

`/dashboard/` is a static-export-compatible private client surface behind existing RequireAccount. It fetches a small authenticated summary rather than importing full lesson content. Loading, unavailable, partial-response, expired-session, new-user and all-complete states are explicit. Decoder checks catalogue size, counts, percentage, known IDs, internal links, required metadata and timestamps. A failed/incomplete response renders an error and retry, never 0%. Owner-tagged state prevents displaying another account's cached response. Mount/focus/pageshow refresh dashboard data; API responses and requests use no-store.

Existing lesson pages retain all content and public URLs. Their lower progress panel starts a lesson only after the existing provider confirms an account. Guest sees an optional sign-in link with a safe lesson return path and performs no progress mutation. Only the explicit completion button sends complete; it disables during submission, waits for the server, announces success and then offers the next lesson/dashboard. Errors retain the confirmed state and permit retry. Completed remains completed on reopen. Request keys prevent StrictMode duplicate start requests; account+lesson keys ignore late responses after navigation.

Default email/password login, Google completion, restored root session and registration-success sign-in now lead to dashboard. Existing safe explicit next still wins, including public lesson deep links. The popup opener verifies the server session before navigation and closes the popup after acknowledgement. Same-tab fallback also goes to dashboard. New Google accounts no longer require the old profile-welcome detour; profile editing remains in the navbar. Guest continues to `/home/`; logout returns to login; backend authorization remains unchanged.

Authenticated navigation exposes Ruang Belajar as the first item. The existing public library remains the single full catalogue. Theme selection is preserved. Progress uses semantic headings, labelled progressbar, live status/error text, visible existing focus treatments and native links/buttons/details. Responsive evidence covers 1440, 1024, 768, 390 and 320 pixels; reduced motion disables entrance effects. No new runtime dependency or heavy animation library was introduced.

## Main changed areas

- `shared/lesson-catalog.json`, `shared/learning.d.ts`: metadata and contract shared by web/API.
- API learning module, entity, pure summary calculator, DTOs and migration; AppModule, data-source registration and CORS PUT support.
- Dashboard page/component, lesson progress component, small themed CSS file and existing lesson page integration.
- Existing auth navigation/completion, root restoration and shell navigation; authentication mechanisms, cookies and token rules retained.
- Focused unit/API/browser tests, approved-development Neon verification script, README and checkpoint.

## Verification boundaries and follow-up

The frontend export and local test-server flows are verified; actual Cloudflare/GitHub Pages deployment and production cookie/domain configuration are not. Backend packaging must retain the shared catalogue sibling. pg-mem is an isolated emulator, not proof of PostgreSQL parameter inference, DDL rollback or locking semantics; the separate approved Neon run covers real PostgreSQL migration round trips, concurrent upsert, persistence and browser flows. A PostgreSQL parameter ambiguity found only on Neon was fixed with an explicit varchar cast before re-verification.

Google browser regression uses a controlled provider identity, not live Google consent. SMTP delivery remains deferred from Phase 01. Independent browser contexts verify persistence without shared cookies/localStorage; physical devices, assistive technology and production latency remain manual review. No Phase 03, quiz, analytics, AI recommendation, production migration or deployment was started.
