# Phase 03 acceptance checklist

25 October 2026. PASS rows below record actual automated HTTP/PostgreSQL/Edge execution and visual inspection, not an unperformed human theological review. Software quiz/practice flows use explicitly labelled synthetic fixtures in an isolated schema. The actual application has no published question bank.

| Scenario | Steps | Expected | Actual result / method | Status |
|---|---|---|---|---|
| A — Lesson completion | Login; open pengantar; answer seven with six correct; submit; inspect dashboard | Server verifies completion, count increases once | Edge + real PostgreSQL: 6/7, 85.71%, verified result; dashboard 1/24 | PASS |
| B — Failed quiz and retry | Answer 5/7; submit; view explanations; retry | No completion; all seven explanations; new varied attempt | Edge + API: 5/7 fails, unchanged completed count; fresh ID and different questions with fourteen fixtures | PASS |
| C — Manual bypass | Authenticated PUT old complete with proper CSRF | 403; no verified progress | Nest HTTP + database assertion; UI has no Tandai Selesai button | PASS |
| D — Legacy history | Seed Phase 02 completed record before migration; migrate; pass quiz | Original date retained, initially not verified; new verified provenance after pass | Real SQL migration/grade; Edge dashboard separates legacy harakat and verified pengantar | PASS |
| E — Guest Detective | Open without account; select with keyboard; answer | Immediate feedback; no user/session/attempt/review/progress writes | Edge 390px + before/after database counts | PASS |
| F — Mistake Replay | Answer wrong as account; open reviews; practice alternate; answer correctly | NEEDS_REVIEW becomes IMPROVED; no prior score/completion change | API + Edge; original failed score remains 5/7, completed count remains one | PASS |
| G — Ownership/manipulation | Read/submit another owner's attempt; supply score or duplicate/incomplete answers | Reject; do not mutate owner's result | Nest HTTP/API tests | PASS |
| G — Concurrency/idempotence | Submit different choices from two connections; resubmit | One stored result, consistent progress/timestamp | Real PostgreSQL verifier | PASS |
| G — Atomic failure | Force review INSERT to fail after grading | Roll back selections, grade and new completion together | Real PostgreSQL constraint injection | PASS |
| H — Unavailable bank | Open lesson with fewer than seven eligible questions | Clear unavailable state, no fake fallback, reading activity retained | Empty source audit; HTTP and Edge unavailable scenario | PASS |
| Refresh/resume | Save choice on question two; reload same URL | Same attempt/order/options and selected value | Edge + API persisted draft assertions | PASS |
| Save failure | Simulate 503 saving first answer, then retry | Error shown, choice not falsely stored | Edge route fixture + database assertion | PASS |
| Expiry/withdrawal/version | Expire active attempt; withdraw content; import new version | Cannot newly grade invalid content; old submitted feedback unchanged | API/SQL tests | PASS |
| Session expiry | Revoke account sessions during active quiz; choose an answer | Return to login, no completion | Edge + stored IN_PROGRESS assertion | PASS |
| Arabic integrity | Render exact reader ayah/range; try bad digest and split grapheme | Exact RTL text/highlight; invalid technical references rejected | Unit tests, corpus checks and screenshot inspection | PASS |
| Mobile/reduced motion | Use 390px context, reduced motion, result/practice flow | No horizontal scroll; usable options/feedback | Edge assertions; screenshots | PASS |
| Auth/profile regression | Register, verify, login, edit/reload profile, reset, logout, guest | Existing flows remain usable | Existing isolated auth Edge suite, 18 reported tests passed | PASS |
| Real Google provider | Complete real consent in a normal browser; verify main-window handoff | Authenticated originating page | Provider was mocked; no live consent executed in Phase 03 | NOT TESTED |
| Real email delivery | Receive and consume actual verification/reset email | Correct delivery and account transition | SMTP test double only | NOT TESTED |
| Scientific question approval | Qualified reviewer checks each question/version and provenance | Source-backed human approval before PUBLISHED | No bank/reviewer exists; user chose unavailable | NOT TESTED — BLOCKED |
| Physical devices/screen reader | Test mobile hardware, reading order and spoken feedback | Comfortable accessible interaction | Headless browser/keyboard only | NOT TESTED |
| Full theme/reader/audio matrix | Repeat every theme, viewport and reader/audio interaction | No regression | Integrity/content/navigation tests pass; complete manual matrix not repeated | NOT TESTED |
| Production deployment/migration | Deploy approved build and migrate production | Verified hosted behavior | No production authorization or execution | NOT TESTED |

To reproduce software scenarios, build web/out with the existing public API origin, then run `npm run verify:assessment -- --approved-development --browser` from api. This deliberately uses a guarded temporary schema and removes its fixtures. Never enable synthetic content in the application schema to make a manual demo look populated.

The real application should currently show quiz/Detective unavailable. Continue reading is allowed, and manual completion must remain rejected. Stop for review after Phase 03.
