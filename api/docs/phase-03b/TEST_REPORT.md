# Phase 03B tests

26 October update: 51 API tests PASS / 2 optional SKIP, 35 frontend tests PASS, API build and frontend lint/export 45 pages PASS. Real PostgreSQL and Edge browser tests using all 394 actual generated versions and owner authorization PASS, including theory/mixed assessments, 6/7 completion, source disclaimer, guest Detective/report, immutable import and strict batch quarantine. See [activation record](AUTOMATED_QUIZ_ACTIVATION.md). The 25 October results below are retained as history.

Follow-up browser runs exposed a real guest Detective timeout. After limiting selection to a small lesson index and one fully validated lesson pool, API build, 15 focused API checks, the real generated PostgreSQL/browser verifier and a read-only browser against localhost3000 all PASS. Existing validation, duplicate/version rules, 10-second frontend timeout and quarantine remain intact. Measured API samples: 5716/599/553 ms; these are development samples, not an SLA.

25 October 2026, Asia/Jakarta. Actual commands/results; no scientific approval inferred from tests.

| Check | Actual result |
|---|---|
| Baseline web npm test | 35 PASS |
| Baseline API serial test/*.test.ts | 40 PASS / 0 FAIL / 2 optional SKIP |
| Final API serial test/*.test.ts | 50 PASS / 0 FAIL / 2 optional SKIP; 52 reported including parent tests |
| Focused generation/feedback tests | 10 PASS; batched-import generation recheck 5 PASS, overlapping tests not extra totals |
| Web npm test | 35 PASS |
| Web npm run lint | PASS |
| API npm run build | PASS; runtime output remains dist/main.js |
| Web npm run build, then final direct next build | PASS TypeScript/static export, 45 pages |
| npm run tajweed:check | PASS: 114 payload hashes, 6,236 ayahs, 143,049 annotations |
| questions:generate -- --dry-run | PASS, no writes; test also combines --apply --dry-run with deliberately invalid DB URL |
| questions:generate -- --apply, repeated | PASS: 193 identical DRAFT IDs/versions and source manifest |
| questions:validate / validation pipeline | 193 passed, 0 failed selected candidates, source verified 0 |
| questions:import-generated -- --apply | PASS in approved development; repeat import preserves all 193 rows/timestamps/states |
| Real PostgreSQL verifier --approved-development | PASS migration, feedback, concurrency, idempotency, quarantine, snapshots and generated DRAFT import in temporary schema |
| Verifier --approved-development --apply-development | PASS additive Phase 03B migration only on approved development; legacy dates preserved, no publication |
| Verifier --approved-development --browser-only | PASS quiz/Detective/Replay/report/navigation journeys with isolated PostgreSQL fixtures |
| Production operations | NOT RUN |

Default API skips the opt-in auth browser test and dedicated TEST_DATABASE_URL test. The existing auth/security HTTP tests pass and assessment browser journeys use actual UI password login. Full provider/SMTP consent is not retested or claimed. Real SQL evidence comes from uniquely owned temporary schemas on the approved development Neon database, not pg-mem's incomplete transaction model. No synthetic published question or reviewer is written into the application schema.

## Generator and API coverage

Executed assertions cover stable UUID/version/fingerprint generation, 193 unique candidates, new source version increments, invalid lesson/mapping/reference/highlight/key/distractor/explanation/provenance/source-version rejection, honest insufficient coverage and no publication without approval. The corpus filename regression is exercised with surahs 1 and 99; generation verifies all payloads. Content-derived option IDs avoid an ordinal correct-answer marker.

Imports are repeatable, preserve publication/quarantine and reject content-version edits. Isolated trusted-fixture tests exercise both actual-human-review and exact source-approval paths, including rejected answer/source changes and null human question review for the source path. These test authorities are labelled synthetic and never loaded by the runtime registry.

Report tests cover owned submitted context, another user's rejection, draft-attempt rejection, version mismatch, bounded/extra/forged fields, guest post-answer proof, tampering/substitution/session mismatch, no guest account, duplicate request ID and mismatched retry, priority, internal status/resolution notes, private read/review rejection and report-specific 429. Original question/score/completion remains unchanged. Suspension excludes new selection; historical results remain readable and reports remain accepted for an already-issued guest receipt. Release requires valid existing publication approval.

## Real PostgreSQL and development evidence

The verifier applies actual migrations in a generated schema with captured OID and transaction-local search_path, no public fallback. Independent metadata-qualified connections prove concurrent submit/creation and feedback retries. Tests verify atomic grade/answer/completion rollback, new report persistence, nullable guest reporter, review status, quarantine, historical snapshots, batched DRAFT imports, constraint/FK/unique rejection and populated rollback refusal. The Phase 03B migration also round-trips empty up/down/up without altering legacy progress. Every run logs exact schema cleanup.

The additive migration is applied to the approved application development schema, pending migrations false. A separate probe finds exactly 193 DRAFT rows, zero PUBLISHED, repeats import and deep-compares all rows including timestamps/review/hold state unchanged. Existing legacy progress is preserved. Running API4000 availability and Detective return HTTP200/unavailable. Actual feedback table is ready; test feedback rows were confined to temporary schemas and removed, not left as fake user reports.

## Browser and visual evidence

Edge headless serves the static export on 3103 and isolated API on 4103. Referensi is visible at 1024/1280/1440 without horizontal overflow and reachable from the mobile navigation; its source page opens publicly. Header space was corrected after the initial 1024px overflow failure, without removing a menu.

Passed: seven-question fail/retry/pass, stored choice refresh, server grading/dashboard/legacy, second-device mobile, Replay, guest Detective/RTL highlight/keyboard/reduced motion/no personal writes and session expiry. Phase 03B additionally passes reports from quiz result, Replay and guest Detective; native dialog category/description, Escape/cancel and clean reopening, simulated 503 with no false confirmation, retry/success, real PostgreSQL persistence, and unchanged original score. Only explicit guest reporting writes its report row.

`feedback-dialog-desktop.png` and `feedback-dialog-mobile.png` in this folder were visually inspected. They show isolated fixture reports, not scientific review. Existing assessment screenshots in phase-03 were regenerated by the extended harness; synthetic question prompts remain clearly labelled.

## Failures corrected and limits

- pg-mem lacked char_length; the test adapter registers its code-point behavior. Real SQL still uses PostgreSQL's native function.
- An all-surah run exposed the old three-digit filename guard; exact manifest filenames now work for 1–99 and 100–114, without source-data edits.
- One npm prebuild encountered a transient Windows UNKNOWN open error on unchanged 33.json. Subsequent full hash validation passed; final Next build ran directly without unnecessary corpus regeneration. No hash/content change was accepted.
- Initial report/navigation browser iteration failed at 1024px overflow; responsive space rules corrected it and the final run passed all three desktop widths/mobile.
- Automatic approval review rejected a proposed relaxation of quarantine publication/release. It was not applied or bypassed; stricter controls remain, with corrected content reviewed as a new version when required.

BLOCKED: scientific review and content gaps; actual published coverage 0/24. NOT VERIFIED: live Google/SMTP, physical/assistive-device matrix, complete reader/audio/theme permutations and production hosting/migration. No Phase 04 or scheduler.
