# Phase 02 test report

25 October 2026, Asia/Jakarta. Results refer to local source/static export and the explicitly approved Neon development target. PASS does not imply production deployment or live Google consent.

Latest user-review revision: [dashboard, Taman theme, save feedback and authentication latency](EXPERIENCE_REVISION.md). Final combined suite still 34 PASS / 0 FAIL / 1 optional PostgreSQL SKIP; frontend now 31 PASS. Latest Neon development browser verification also PASS, with 595ms observed logout navigation and exact fixture cleanup.

## Baseline and final checks

| Check | Result |
|---|---|
| Baseline frontend typecheck and unit tests | PASS, 25 tests |
| Baseline API typecheck and auth browser tests | PASS, 18 tests; optional isolated real-PostgreSQL test SKIP |
| Final frontend `npm test` | PASS, 31 tests across 8 files |
| Final frontend `npm run lint` | PASS |
| Final frontend `npm run typecheck` | PASS |
| Final frontend `npx next build` | PASS, 42 static pages, including dashboard and all 24 lesson routes |
| Final API `npm run build` | PASS |
| Corpus `npm run tajweed:check` | PASS, 114 payload hashes, 6,236 ayahs, 143,049 annotations |
| Full API/browser regression with `$env:E2E='true'; node -r ts-node/register --test --test-concurrency=1 test/*.test.ts` | PASS, 34 passed / 0 failed / 1 optional PostgreSQL SKIP, 35 total |
| Approved Neon development verification | PASS, real migration round trip, concurrent writes and browser acceptance |
| Existing 24 lesson objects compared structurally against Git HEAD | PASS, all original content/metadata identical; only slug/order added |
| Actual review servers | PASS, web3000 dashboard HTTP200; API4000 Swagger contains all 5 learning routes; guest dashboard API401 |

Baseline changes already present in api/package.json and generated Next declarations were preserved. No package dependency was added. The three primary API documents and Quran/annotation payloads remain unchanged.

## Unit and isolated API coverage

`test/learning-summary.test.ts` verifies the 24 stable IDs, empty learner, completed-only percentage (6/24 = 25%), latest incomplete lesson, next-after-completed and wrap to skipped lessons, all-complete/null-next, metadata reorder/unknown historical ID, missing catalogue and empty rollback behavior.

`test/learning.test.ts` builds a separate pg-mem database with the actual versioned auth/progress migrations, real entities, SessionGuard, controllers and services. It verifies unauthorized reads/writes, CSRF/Origin and PUT preflight, invalid lesson IDs, unexpected input/userId rejection, virtual NOT_STARTED without seeded records, start, explicit completion, reopen, repeated completion timestamp, two-account ownership, parallel start/complete, uniqueness/FK/state constraints, refusal to roll back nonempty progress, and all-complete. pg-mem does not support LOCK; the harness skips only that statement, while unit assertions verify its placement and the separate Neon run executes the real lock/refusal. Final combined suite: 18 auth + 16 learning/summary PASS, optional isolated PostgreSQL 1 SKIP, 0 FAIL.

Frontend tests verify shared metadata matches all actual lesson content references, safe default/explicit auth routing, OAuth message allowlist, and response validation. Missing/partial/malformed data cannot become a successful zero-progress display. Existing corpus, reading-navigation, content, worker and URL tests still pass.

## Browser acceptance

`test/learning-browser.ts` serves the built static frontend and the real Nest HTTP pipeline with Edge, using unique owned accounts. Isolated learning ports: 3102/4102; auth regression: 3101/4101. API requests are forwarded from the build-time localhost:4000 origin to the test API. This does not test availability of the independently running development API process on port4000.

Scenarios checked by assertions:

- New account login defaults to dashboard, actual 0/24 and Start Learning.
- Open lesson → IN_PROGRESS with zero completed; failed complete shows an error and retains zero; retry succeeds only after server response.
- Refresh/reopen preserves completed UI; repeated completion keeps the first timestamp and one row.
- Return to dashboard shows 1/24 and the correct next lesson.
- Logout/login from a fresh independent browser context preserves progress; another account cannot read it.
- Explicit safe lesson next is honored; late response after lesson navigation cannot change the current lesson UI (final isolated run).
- Guest enters home and a public lesson with no learning PUT or completion button; dashboard redirects to login.
- API 503 and partial JSON show unavailable/retry without a fake progressbar; recovery displays persisted values.
- Revoking only the run-owned account's sessions triggers sign-in; logging in again retains progress.
- All 24 completed → 100%, no invalid next, repeat-material CTA; other account remains unchanged.
- No horizontal overflow at 1440/1024/768/390/320; reduced-motion disables entrance animation; existing theme controls still work.

Auth regression additionally covers registration success/reset/error retention, password login, profile editing, recovery/reset, logout, root/session refresh, Google popup acknowledgement/close and same-tab fallback using a provider identity double, explicit account linking, and security cases. New and returning Google flows now reach the originating page's dashboard. Safe return paths and guest entry remain covered.

## Real Neon development verification

User explicitly approved applying Phase 02 to api/.env after confirming it is development. Guarded migration applied only LearningProgress1792886400000 after InitialAuth: PASS, no pending migrations. No reset or other existing-account change was performed.

Command: `node -r ts-node/register scripts/verify-learning-neon.ts --approved-development`.

- Real migration up/down/up/down in a unique transaction-isolated temporary schema, then unconditional transaction rollback: PASS. Final `--migration-only` rerun also verifies the exclusive table lock and refusal to roll back a nonempty temporary progress table. Its users/progress tables are transaction-owned; no public table is dropped.
- Twelve parallel start/complete writes through two independent PostgreSQL connections: PASS. One row, COMPLETED retained; reopen/recomplete retains first completedAt.
- Learning browser acceptance on the approved development database: PASS for login, new learner, start/complete/reopen, cross-context persistence, ownership, guest, retry/partial data, expired session and all-complete. The subsequently added delayed-response navigation case runs in the final isolated suite.
- Exact ID/email cleanup of run-owned users and cascaded progress is asserted by the script's finally blocks. No table-wide deletion, live Google account, SMTP or production writes.

The optional existing `_test` PostgreSQL suite is separately gated by TEST_DATABASE_URL. It is not pointed at the application development database to bypass its isolation guard. Its SKIP must not be described as a PASS; separate approved-Neon evidence above covers Phase 02 on PostgreSQL.

## Findings resolved during verification

1. Initial test harness could not inject a parent DataSource into imported AuthModule: fixed provider scope in the harness, without changing application auth structure.
2. pg-mem lacked the native greatest(timestamp,timestamp) function: registered that function only in the emulator harness.
3. pg-mem retained an index after DDL rollback/reapply: moved the DDL round trip to real PostgreSQL in a transaction-isolated schema. Nonempty rollback remains tested in the emulator and empty rollback command behavior in a focused unit test.
4. Generic role=alert also selected Next's route announcer: targeted the actual progress error panel.
5. Real PostgreSQL returned 42P08 for the reused uncast status parameter: explicitly cast it to varchar in the upsert and reran actual concurrency/persistence verification successfully. This was not treated as an emulator PASS.
6. The delayed-response browser test initially waited for a browser response that navigation can cancel. It now verifies the request was sent, releases its controlled handler, and checks the new lesson's state. Auth back/forward regression now waits for the restored page to load/render before starting another navigation. Final browser files are run serially to avoid resource contention; database concurrency assertions still issue parallel writes.

## Visual evidence and limits

Desktop and mobile dashboard screenshots were visually inspected: readable hierarchy, primary CTA, counts, completed lesson link and existing navbar/theme retained without overflow. Evidence uses fictional fixture names.

- [Desktop](isolated-dashboard-desktop.png), [mobile](isolated-dashboard-mobile.png), [new learner](isolated-dashboard-new.png), [theme](isolated-dashboard-theme.png), [complete](isolated-dashboard-complete.png).
- Approved Neon evidence: [desktop](neon-development-dashboard-desktop.png), [mobile](neon-development-dashboard-mobile.png), [complete](neon-development-dashboard-complete.png). Desktop and complete states were also visually inspected.
- Current auth regression screenshots use `auth-*.png` in this directory; historical Phase 01 screenshots are preserved.

Not verified: real Google consent with a human account, SMTP delivery, physical cross-device/browser engines, assistive-technology review, production deployment/migrations/domains and production load. No new Phase 03 work.

## Review runtime

API4000 was not running and web3000 did not respond during the final availability probe. Started the compiled development API without startup migration; restarted only the verified TajwidLens Next server process and served the development frontend. Subsequent HTTP probes confirm dashboard200, five learning routes and guest401. This availability check does not claim an authenticated human account/browser test; authenticated acceptance is the fixture-based evidence above.
