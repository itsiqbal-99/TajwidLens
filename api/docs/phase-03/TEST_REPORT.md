# Phase 03 test report

25 October 2026, Asia/Jakarta. Tests use synthetic, explicitly labelled questions and a synthetic reviewer only in isolated fixtures. They prove software behavior, **not scientific validity**. Application content coverage remains **0/24**.

## Results

| Command / check | Actual result |
|---|---|
| API `npm run build` | PASS, strict TypeScript |
| Web `npm run lint` | PASS; final changed assessment files also linted |
| Web `npm test` | PASS: 35 tests across 9 files |
| Web `npm run build` | PASS: TypeScript and 45-page static export |
| API `node -r ts-node/register --test --test-concurrency=1 test/*.test.ts` | PASS: 40 passed, 0 failed, 2 skipped, 42 reported including parent tests |
| API `$env:E2E='true'; node -r ts-node/register --test test/auth.test.ts` | PASS: 18 passed, 0 failed, 0 skipped, including browser regression |
| `npm run questions:check` | PASS: actual source 0 questions, 0 reviewers, all 24 lesson rows reported |
| `node -r ts-node/register scripts/verify-assessment-neon.ts --approved-development` | PASS on real Neon/PostgreSQL in a run-owned temporary schema |
| Same verifier with `--browser-only` after web build | PASS: full Phase 03 browser journeys against real PostgreSQL fixtures |
| Corpus prebuild validation | PASS: 114 payload hashes, 6,236 KFGQPC ayahs, 143,049 source annotations |
| Application development migration | PASS: only QuizAssessment1792900800000 applied; no pending migrations, one legacy completion date preserved exactly, all four actual assessment tables empty |
| Production migration/deployment | NOT RUN |

The default API run skips its opt-in auth browser test and the optional dedicated `TEST_DATABASE_URL` test. The auth browser test was executed separately and passed. The dedicated `_test` database URL was unavailable; real Phase 03 SQL behavior was instead tested using guarded temporary schemas on the explicitly approved development Neon target. Do not sum the overlapping API/auth runs as independent test totals. pg-mem alone does not prove locking or rollback.

## Engine, API and security evidence

Covered by `quiz-engine.test.ts`, `quiz.test.ts`, learning tests and the existing auth tests:

- Seven unique mixed questions; insufficient banks and a missing question type refuse creation. Draft/untrusted/duplicate/conflicting versions are excluded. Retry prefers unused questions when fourteen are available.
- Exact 5/7 fail, 6/7 pass (85.71%), 7/7 pass. No client score/ownership/mode/key payload is accepted.
- Whitelisted questions have no correct option, explanation, concept/rule ID, review metadata or private hash before submission. Draft PUT and resumed attempts retain order/options/choices and reveal no feedback.
- Ownership, unauthenticated access, CSRF, invalid/duplicate/incomplete answers, unknown lessons, expired attempts and withdrawn content are rejected. Old manual complete returns 403 and does not increase the dashboard count.
- Repeated submission returns the stored result and preserves the first verified completion timestamp. Reopening cannot undo completion. New immutable content versions do not rewrite historical results.
- Challenge tampering, account mismatch and expiry are rejected. Guest feedback changes none of users, sessions, attempts/items, reviews or progress.
- Authenticated wrong answers create concept reviews. Replay prefers alternatives, only a correct answer marks IMPROVED, and original grade/completion remain unchanged. Pagination places all unresolved concepts before improved concepts across page boundaries.
- Legacy projection preserves original dates, excludes self-reported history from verified totals and retains deterministic continuation. Unit tests include zero/new, skipped/reordered catalogue and all-complete states.
- Existing email/password, verification/reset, explicit Google linking/collision/state/browser binding, logout/session expiry, profile ownership, config/TLS and shared rate-limit tests continue to pass.

## Real PostgreSQL evidence

Verifier creates a unique `phase03_verify_<32 hex>` schema, captures its PostgreSQL OID, applies the real migrations with a transaction-local search_path and no public fallback, then uses TypeORM metadata-qualified tables on independent connections. Synthetic questions never enter the application/public schema. Cleanup validates exact name and OID before dropping only the owned schema; success logs confirm removal, including failed browser attempts.

Verified:

1. Phase 02 completion seeded before the Phase 03 migration retains raw status, exact original completedAt, legacy date and LEGACY_SELF_REPORTED provenance.
2. Empty-assessment migration down/up round trip preserves that history; populated rollback refuses under exclusive locks.
3. Independent connections grade concurrent duplicate submissions to one immutable result; only quiz grading verifies completion and preserves its first verified timestamp.
4. Injected database constraints fail review persistence after scoring. PostgreSQL rolls back answer writes, submitted state, reviews and newly inserted completion together.
5. SQL result/provenance constraints reject invalid state. The final development application run additionally verifies concurrent creation, duplicate item, missing-user FK and invalid improved-review rejection.

The optional application migration flag only permits the expected Phase 03 migration after checking history and production configuration. It compares legacy completion totals/dates and asserts that actual question/attempt/review tables stay empty. No reset, deletion of user history or production migration is performed.

The approved `--apply-development` run passed. A separate read-only probe confirmed no pending migrations, one preserved legacy completion and zero rows in all four actual assessment tables. Running API4000 health, pengantar availability and Detective returned HTTP200; assessment responses were unavailable with eligibleCount0. Web3000 /quiz/, /detective/ and /reviews/ returned HTTP200 after cold compilation; the first 30-second cold request timed out before a subsequent check succeeded. No live account was created for these probes.

## Browser and visual evidence

Microsoft Edge headless, static Next export on 3103 and an isolated API on 4103; API calls to the build-time localhost:4000 origin are rewritten by the test harness. Exported `.txt` navigation payloads use text/plain, preserving actual client navigation. The existing running development servers are not stopped.

PASS: real UI login; legacy dashboard; lesson unavailable state; absent manual completion button; lesson quiz entry; one group per screen; simulated save failure with no persisted choice; successful save/retry; q=2 refresh with stored order/choice; 5/7 fail and seven explanations; fresh varied retry; 6/7 pass; persisted result in a second authenticated mobile context; optional Replay; verified/legacy dashboard synchronization; highlighted Arabic; guest keyboard selection/immediate feedback/no writes; authenticated Detective; expired session redirect without completion; 390px no horizontal overflow and reduced-motion context.

Screenshots in this folder use **synthetic software-test content**. They are not evidence of a scientific question bank:

- `quiz-unavailable-desktop.png`
- `quiz-question-desktop.png`, `quiz-question-mobile.png`
- `quiz-failed-desktop.png`, `quiz-passed-desktop.png`, `quiz-passed-mobile.png`
- `dashboard-verified-legacy.png`
- `detective-guest-mobile.png`

Desktop question, dashboard, unavailable state, mobile question and Arabic feedback screenshots were visually reviewed. The final capture pass returns to page top before full-page screenshots so sticky headers/hidden skip links do not appear at artificial scroll offsets. The final run also asserts no duplicate GET after creation and keyboard focus on the Detective feedback heading; all browser checks passed and the owned schema was removed.

Auth browser regression separately passed registration/verification, wrong/right login, profile/reload, recovery/reset, logout and guest access. Google provider/consent is a test double; its handoff measured 1,735ms with capabilities deliberately pending. This is not a production SLA or live Google consent measurement.

## Corrections during verification

Initial loopback HTTP tests were denied by the default sandbox; the same isolated tests passed with authorized loopback access. A learning fixture without a verified email was corrected rather than relaxing authentication. Browser iteration initially used a five-second local assertion window against a cold remote pool; the harness now establishes a small pool and allows thirty seconds for composed navigation while the application keeps its ten-second per-request timeout. An unnecessary GET immediately after successful attempt creation was removed; real refresh still fetches persisted state. A locator was scoped to the actual error panel because Next's route announcer also uses role=alert. These failed harness attempts are not counted as passing runs.

## NOT VERIFIED / BLOCKED

- **BLOCKED:** human scientific review and publishable banks for all 24 lessons. Zero actual question references/highlights exist to scientifically validate. Existing editorial annotations are not approval.
- **NOT VERIFIED:** real Google consent/account selection, real SMTP delivery, production migration/hosting/Cloudflare deployment, physical mobile devices and assistive technology. Complete reader/audio interaction matrix and every theme/viewport permutation were not repeated; unchanged data integrity/content/navigation regressions pass.
- Explicit application links and full-document unload have an active-attempt confirmation. Browser SPA history navigation may leave without a custom prompt; successfully saved choices remain resumable for 24 hours.
- Global limiter remains single-process, proxy trust unchanged, no scheduled cleanup/retention worker added. No Phase 04 implementation.
