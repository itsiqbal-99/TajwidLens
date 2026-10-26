# Phase 03B acceptance checklist

26 October update: real generated content was exercised in Edge for a seven-question lesson, 6/7 persisted completion, desktop/mobile layout, automated-validation disclosure, annotated guest Detective and persisted guest report. Exact owner authorization and the full coverage/limitations are in [AUTOMATED_QUIZ_ACTIVATION.md](AUTOMATED_QUIZ_ACTIVATION.md). The earlier checks below remain historical evidence.

25 October 2026. PASS records actual automated CLI/HTTP/PostgreSQL/Edge execution and visual inspection. It is not a human scientific review. Live bank remains DRAFT; published software-test fixtures are isolated and labelled.

| Scenario | Steps | Expected | Actual | Status |
|---|---|---|---|---|
| Reference navigation | Open desktop at 1024/1280/1440 and mobile menu; follow Referensi | Source navigation retained and readable without overflow | Edge verifies visible link, width and public source page | PASS |
| A — Generate bank | Audit, dry-run, generate, validate, import, rerun | Stable IDs/versions; no duplicates or unintended publish | 193 generated/validated DRAFT; repeat source generation and DB import unchanged | PASS |
| A — Dry-run safety | Combine --apply --dry-run and invalid DB URL | No file/DB write or connection | Child-process assertion passes; candidate file unchanged | PASS |
| A — Bad source/content | Alter lesson, key, source version, explanation, options or range | Fail closed | Unit/pipeline negative cases rejected | PASS |
| B — Lesson Quiz | Login, answer 7, fail 5/7, retry then pass 6/7 | Server-only score and verified completion | Edge + real SQL fixtures; explanations after submit only | PASS |
| C — Detective | Guest/account chooses marked ayah answer, reads explanation | One question, intact RTL; guest no personal persistence | Edge/DB before-after counts and feedback | PASS |
| D — Quiz report | Open result report, cancel/reopen, select category, submit with simulated failure then retry | Error then stored acknowledgement; clean form; stable request ID | Edge dialog and PostgreSQL row assertion | PASS |
| D — Replay report | Practice mistake, view result, submit report | Stored report; original score/completion unchanged | Edge and database assertions | PASS |
| D — Guest report | Answer Detective; report highlight mismatch | NULL reporter, no anonymous account; report persisted | Edge mobile + PostgreSQL | PASS |
| D — Spam/forgery | Forge reporter/status, context/version/receipt; exceed limit | DTO/ownership/signature rejection and 429 | HTTP/service negative tests | PASS |
| D — Concurrent retry | Submit same report from two connections | Exactly one row, same acknowledgement | Real PostgreSQL | PASS |
| Internal review | Filter queue, set IN_REVIEW then RESOLVED with operator/note | Private bounded access; review fields retained | Services on memory + real SQL; CLI exposes no HTTP route | PASS |
| Unauthorized review | Public GET list/PATCH status as ordinary client | No public access | 404; POST extra status/reporter fields 400 | PASS |
| E — Quarantine | Hold fixture question, start new attempt, read old result, release with approval | Excluded from new attempts; historic result preserved | Real SQL + service tests; strict release/publication gate retained | PASS |
| F — Insufficient data | Inspect foundational/waqaf/unsupported lessons | CONTENT_GAP, no invented annotation/publication | 13 lessons have three MCQs, no ID; all live assessments unavailable | PASS |
| Theme/mobile/accessibility | Inspect dialog in Taman/default and 390px reduced-motion context; Escape and reopen | Readable fields/focus, no blocking primary action | Screenshots inspected and Edge checks pass | PASS |
| Real scientific review | Qualified reviewer approves sources/templates/exact versions | Documented actual approval before publication | None supplied; registries empty | NOT TESTED — BLOCKED |
| Live provider/SMTP | Complete real OAuth/email delivery | Existing provider flow works | No live consent/delivery performed in Phase 03B | NOT TESTED |
| Physical devices/assistive technology | Use actual devices and screen reader | Accessible spoken/read flow | Headless Edge/keyboard only | NOT TESTED |
| Production | Deploy/migrate production | Explicit authorization and hosted acceptance | No production operation | NOT TESTED |

Reproduction: build web/out, run API tests, questions:audit/generate/validate, then the guarded development verifier with --browser. Never import synthetic approvals or published fixture banks into the application schema. Stop at Phase 03B.
