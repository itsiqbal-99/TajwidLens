# Phase 03B — implementation record

Historical 25 October report below. The owner's explicit 26 October development publication authorization and the active 394-question bank / 24 ready lessons are documented in [AUTOMATED_QUIZ_ACTIVATION.md](AUTOMATED_QUIZ_ACTIVATION.md). No expert review or production readiness is inferred.

25 October 2026, Asia/Jakarta. Phase 03B implemented and tested. Scope stops here for review. Content readiness remains blocked: 0/24 lessons published. See TEST_REPORT, QUESTION_GENERATION_AUDIT, CONTENT_VALIDATION_REPORT and MANUAL_TEST_CHECKLIST in this folder.

## Initial audit and plan

Read the request, three engineering documents, Phase 03 reports and connected question/attempt/corpus/content/auth/UI code. Baseline: web 35 tests PASS; API 40 PASS / 0 FAIL / 2 optional SKIP. Existing changes are retained. Referensi is restored to desktop navigation and retained on mobile/footer before Phase 03B work.

All 24 lessons have explicit condition, pronunciation and commonMistake fields. Canonical groups and a pinned rule catalogue are available. Reader data is KFGQPC UthmanicHafs v3.0 (2026), Quran.ws release v0.4.3 / corpus 0.4.2. Upstream stable/needsReview policy is technical provenance, not qualified question approval. Editorial examples are explicitly editorial-unreviewed. Qalqalah and some mad rules are excluded upstream for review/dispute; do not fabricate missing annotations or infer waqaf ranges. No trusted reviewer or source-publication approval exists.

Plan: deterministic offline candidates from structured lesson fields and unambiguous mapped reader annotations; exact source hashes and immutable versions; separate generation/import/publication; no automatic publishing without explicit trusted evidence. Add one report table plus question generation/quarantine metadata. Reports require an owned submitted attempt or a signed post-answer guest receipt, with bounded inputs/rate limits and no stored IP/fingerprint. Internal review/quarantine use a privileged local CLI, because no application admin authorization exists. Reuse the result component and a native accessible dialog; preserve seven-question grading, snapshots, themes and all existing learning/auth/reader behavior. No paid AI, new service, scheduler, production operation or Phase 04.

## Implemented generator and publication workflow

The offline CLI imports the existing structured lesson data only during developer execution; the API runtime does not import frontend implementation. A source manifest hashes lesson content, canonical groups, catalogue, rule catalogue, raw rules/annotations, reader index, mapping and generator code. The private candidate file contains exact provenance and immutable versions; it is never bundled into the frontend.

Generated 193 DRAFT candidates: 72 explicit-section recall MCQs and 121 reader identification questions. Eleven leaf lessons have fourteen mixed candidates; thirteen have only three MCQs and CONTENT_GAP. The generator rejects unsupported/review-required rules, ambiguous overlapping alternatives and invalid references, prefers distinct ayahs and does not pad counts with rewordings. Correct options have content-derived IDs without an ordinal answer signal. UUID/version/fingerprint stability and changed-source version increments are tested.

Generation, validation, import and publication are separate. Re-import batches existing lookups/inserts and skips unchanged versions without changing timestamps, reviews, publication or quarantine. Modified immutable content is rejected. Explicit human publication requires the actual trusted reviewer and matching version approval. Source-verified publication separately requires configured evidence for the exact source/transformation bundle and exact question hashes; it does not claim individual human question review. Actual reviewer and source-approval registries are empty, so no publication occurred.

## Database and reports

One additive migration, QuestionFeedback1792915200000, adds generation/source approval/quarantine metadata to quiz_questions and a question_feedback table. It preserves all progress, question and attempt history. Feedback has UUID idempotency, question/version references, optional owned attempt/reporter, bounded category/description, review priority/status, immutable private snapshot, timestamps and operator resolution. It stores no IP, device fingerprint or anonymous user account. FK/check/index constraints and populated rollback refusal are verified on real PostgreSQL.

POST /api/v1/questions/:questionId/feedback is optional-session, CSRF/origin/JSON protected and limited to five requests per endpoint/IP/minute. The server resolves either the authenticated owner's submitted attempt or a signed post-answer guest receipt lasting 24 hours. The receipt has a separate HMAC domain from Detective challenges. Client reporter ID/status/snapshot are rejected. Retry with the same requestId/payload returns acknowledgement without a duplicate row. The response contains only a thank-you message.

Reports do not alter keys, question versions, scores, reviews or completion. Quran text/reference and highlight reports get HIGH review priority; volume never automatically suspends a question. Guest practice remains stateless; an explicit guest report creates only its report row with null reporter, not a personal attempt or account.

There are no public feedback listing/status/review endpoints. The internal CLI is authorized by privileged local OS/database access, records the actual DB role plus accountable actor, supports bounded filters and explicit review/resolution notes, and refuses production configuration. No admin-role framework, fake reviewer account or analytics dashboard was added.

## Quarantine and historical compatibility

Suspension is independent of DRAFT/REVIEWED/PUBLISHED. Held questions are excluded from new quiz/Detective/Replay selections and cannot newly grade an active attempt; submitted snapshots remain readable/reportable. Publication while held is blocked, and release requires valid existing publication provenance. Corrections that cannot meet that gate stay held while a new immutable version is reviewed. Re-import never clears a hold. Current hold/release reason, actor and dates are retained.

Automatic approval review rejected a proposed relaxation of held-question publication/release. That change was not applied or bypassed; the stricter existing controls are retained. No remaining implementation step depends on relaxing them.

## UI and Reference navigation

Referensi is restored to the desktop navbar, retained in mobile/footer navigation and tested at 1024/1280/1440 plus mobile. Header space is managed through the existing responsive rules; the reading-guide action keeps its accessible label when its text collapses to an icon.

A secondary Laporkan kesalahan soal button appears only after feedback on quiz results, Detective and Replay. The shared native dialog has seven categories, optional 2,000-character description, cancel/Escape/focus restoration, pending/error/retry/success states and a stable request ID across retries. Success clears form values and says only that the report is stored for review. Existing themes, Arabic typography, reduced motion and primary learning actions remain intact. Research/reference lock is the existing TajwidLens result/account patterns and prior Refero guidance; no new design system or paid research dependency was introduced.

The all-surah generator exposed a Phase 03 adapter filename guard that incorrectly required three digits. It now validates the exact manifest filename, supporting 1–99 as well as 100–114. No Quran text, annotation, rule or reader pipeline was changed; all 114 payload digests still match.

## Verified development state and limits

The additive migration is applied only to the previously approved development Neon target. All 193 source-derived rows are DRAFT, no question is published, and a second import preserves every row/timestamp/state. Running availability/Detective endpoints return HTTP200 with unavailable. Temporary SQL/browser fixtures use a separate guarded schema and are removed after each run.

Software tests pass; detailed counts and commands are in TEST_REPORT. BLOCKED: qualified scientific review and missing identification coverage for thirteen lessons. NOT VERIFIED: live Google consent/SMTP, physical devices/assistive technology, production hosting/migration and every theme/reader/audio permutation. Existing process-local limiter/proxy/retention limits remain. No Phase 04, new dependency, paid LLM, scheduler or production operation.
