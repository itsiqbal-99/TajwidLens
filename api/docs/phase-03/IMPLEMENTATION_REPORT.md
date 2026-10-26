# Phase 03 — Lesson Quiz, Tajwid Detective & Mistake Replay

Implemented 25 October 2026. Scope stops at Phase 03. User decision: build the engine and show unavailable assessments because no validated question bank or qualified reviewer is available. **Actual assessment coverage: 0/24 lessons; Detective unavailable.** See [QUESTION_BANK_AUDIT](QUESTION_BANK_AUDIT.md), [TEST_REPORT](TEST_REPORT.md) and [MANUAL_TEST_CHECKLIST](MANUAL_TEST_CHECKLIST.md).

## Audit and plan

Read the full Phase 03 request, three primary API documents, current checkpoint, Phase 01/02 reports and connected auth/progress/corpus/routing/schema source. Baseline: web 31 unit tests, lint/typecheck and 42-page static export PASS; API build PASS; combined baseline auth/learning browser suite 34 PASS / 0 FAIL / 1 optional PostgreSQL SKIP. Existing user changes were retained.

The shared catalogue has 24 stable IDs, unchanged order and learning content. No existing bank or qualified question review was found. Existing editorial annotations explicitly say editorial-unreviewed. The user confirmed the gap and selected unavailable quizzes. Application bank/reviewer JSON files remain empty. Synthetic reviewers and prominently labelled synthetic questions are restricted to isolated test fixtures; they are not a scientific review or a production bank.

Plan: preserve auth and reader, add a single assessment module and additive migration, replace manual completion with provenance-aware server grading, expose focused quiz/practice screens, then verify security/transactions/browser flows and document the content blocker. No new dependency, service, AI inference or Phase 04 feature was added.

## Architecture and storage

One Nest quiz module owns question validation/import, lesson attempts, Detective and optional personal reviews. Controllers call focused services and TypeORM directly. Pure selection/scoring/serialization helpers use native Node crypto; there is no generic repository, CQRS or events layer.

Four new tables:

| Table | Purpose |
|---|---|
| quiz_questions | Stable immutable content versions, options, answer, explanation, references and review provenance |
| quiz_attempts | Owned mode/status, lifecycle, stored grade and expiry |
| quiz_attempt_questions | Ordered private snapshots, version FK and selected option; unique question/order per attempt |
| mistake_reviews | One owned lesson/concept record, NEEDS_REVIEW or IMPROVED |

Migration `QuizAssessment1792900800000` adds completionSource and legacyCompletedAt to progress, classifies existing completion as LEGACY_SELF_REPORTED, and preserves the original raw status/completedAt byte-for-byte as timestamps. Public legacy status projects to AWAITING_QUIZ. QUIZ_VERIFIED alone counts as completed. A subsequent quiz pass retains the old legacy date and writes a verified completion date, preserving the first verified date on repeated passes.

Migration runs transactionally, uses FK/unique/check/index constraints and disables automatic synchronization. Rollback locks all assessment/progress tables and refuses populated assessment or verified progress. Empty-assessment rollback restores the original legacy schema/history. Application migration status is recorded separately in TEST_REPORT; no production migration/deployment is authorized.

## Engine and security

- Server selects seven unique mixed questions using Fisher–Yates/CSPRNG. New questions are preferred over the prior attempt where possible; no SQL random sorting. Both question types and seven eligible versions are required. Five correct fails; six or seven passes the 80% threshold.
- Creation serializes on the account row, resumes a live owned attempt and saves question/option order plus snapshots. Attempts last 24 hours. Draft choices persist without evaluation; refresh resumes them. The UI reuses the just-created server response instead of immediately fetching that same attempt again.
- Submission locks the owned attempt. Choices, grade, quiz-only completion and wrong-concept reviews commit in one transaction. Repeat/concurrent submissions return the first committed result. Draft writes cannot mutate a submitted result.
- Public question serialization explicitly allows only ID/type/prompt/options/verse. Answer, explanation, concept/rule metadata and private content hash stay server-side until entire submission. Client scores/passed flags/extra fields are rejected by DTO validation.
- Current publication, review gate and immutable hash are rechecked before new grading. Withdrawn/mutated content cannot newly grant completion. Submitted historical feedback always uses snapshots, including after later version changes.
- Session guard and ownership apply to all personal operations; the public availability endpoint uses an optional session. Existing CSRF/origin/JSON checks and the global rate limiter remain in force. No bank-management or bulk-answer endpoint exists.
- The former PUT complete endpoint returns **403** for authenticated clients. Reading/start only updates access timestamps. The sole runtime completion writer is successful LESSON_QUIZ grading.

## Detective and Replay

Detective delivers one published identification question in a ten-minute HMAC challenge. It binds the question version, option order, random nonce and account/guest identity. A domain-separated HMAC conceals the private version hash; tokens contain no answer. Tampered, expired, cross-account or withdrawn challenges are rejected.

Guest feedback uses no persistent user/session/attempt/review/progress writes. Authenticated feedback persists one idempotent Detective attempt and wrong concepts. Detective never completes a lesson. Production needs a stable QUIZ_CHALLENGE_SECRET; without it Detective stays unavailable. Development uses an ephemeral key, so old challenges expire on restart.

Replay is optional. Reviews are owned, grouped by lesson/concept and globally prioritize unresolved concepts with bounded cursor pages. Practice prefers an alternative published question, resumes an active concept attempt, and marks IMPROVED only after a correct answer. Opening practice does not imply mastery. Replay changes neither original quiz scores nor lesson completion.

## Content and corpus

Technical gate validates identities, catalogue references, structured options/answer, nonempty explanations, source references, trusted reviewer credentials/evidence and version-specific approval provenance. REVIEWED/PUBLISHED cannot be assigned automatically by a technical check. Import never deletes or promotes content and rejects edits to immutable version content. Exact duplicate/conflicting questions are detected/excluded.

The corpus adapter reads unchanged reader assets: KFGQPC UthmanicHafs v3.0 (2026), Quran.ws corpus 0.4.2. It validates bytes and SHA-256, edition/verse hashes, annotation identity/rule/range and UTF-16 Arabic grapheme boundaries with Intl.Segmenter. Arabic is never normalized or rewritten. The separate Tanzil quran-full dataset supplies no quiz offsets.

Deployments must include the trusted registry and unchanged index/payload data, or configure QUIZ_CORPUS_INDEX and QUIZ_CORPUS_DIRECTORY. These are read-only assets, not frontend implementation dependencies. See [content workflow](../../content/README.md).

## REST contract

All paths below have /api/v1 prefix. State-changing requests retain cookie credentials, Origin, application/json and X-TajwidLens-CSRF: 1.

| Method / path | Access / behavior |
|---|---|
| GET quiz/lessons/:lessonId/availability | Public metadata, optional owned resume ID |
| POST quiz/lessons/:lessonId/attempts | Account; create/resume; 409 if bank unavailable |
| GET quiz/attempts/:attemptId | Owner; persisted questions/selections, result null before submit |
| PUT quiz/attempts/:attemptId/answers | Owner; save item-ID/option-ID choices without feedback |
| POST quiz/attempts/:attemptId/submit | Owner; all choices, idempotent server grade |
| GET detective/questions | Public; one signed challenge or unavailable |
| POST detective/answer | Public; immediate feedback; account-bound persistence only |
| GET reviews/mistakes | Account; bounded globally prioritized cursor list |
| POST reviews/mistakes/:reviewId/practice | Owner; one-question Replay attempt |
| PUT learning/progress/:lessonId/complete | Account; 403, never grants completion |

OpenAPI DTOs document the public shapes and relevant 400/401/403/404/409/410/429 responses. Private question content is never an API response DTO.

## UI/UX

New static routes /quiz/, /detective/ and private /reviews/ reuse the existing shell and AuthProvider. One native radio group appears per quiz screen, with progress, keyboard interaction, stored selection, previous/next, expiry and explicit final submit. Correct answers/explanations and version/source references appear only after submission. Result offers retry, material return and next lesson on a verified pass. Explicit application links and full-page unload prompt before leaving an active attempt; saved choices remain resumable if browser history navigation leaves without a custom prompt.

Detective marks the exact Arabic slice with a background and underline, retains harakat/RTL and provides immediate stored-source feedback. Guest storage behavior is explicit. Replay surfaces available concepts and clear unavailable states without blocking learning.

Lesson UI replaces manual completion with Uji Pemahaman or a clear quiz-unavailable notice. Legacy dates remain visible. Dashboard counts verified completion, separates legacy history, provides four status metrics, a lesson map, topic coverage, deterministic continuation and Detective/Replay entry points. Library badges distinguish awaiting quiz, in progress and verified completion.

Design reference lock: existing TajwidLens screens/Taman palette and bundled Refero craft guidance (live Refero was unavailable due subscription). Inter/Noto Naskh, theme tokens, ActionFeedback, restrained 180–280ms transitions and prefers-reduced-motion are reused. No decorative loop/confetti/bitmap illustration, new theme or dependency was added. Static export and configured base-path behavior are retained.

## Remaining limits

**BLOCKED:** qualified scientific review and sufficient publishable questions, currently 0/24. This is intentionally not worked around. **NOT VERIFIED:** actual Google consent, real SMTP delivery, production hosting/migration, physical devices and assistive technology. Existing per-process rate-limit/proxy and session-cleanup limits remain unchanged. No Phase 04 work or production deployment was started. Stop for user review.
