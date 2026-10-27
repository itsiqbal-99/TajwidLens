# Question Bank Audit — Phase 03

25 October 2026. Actual source files: `api/content/question-bank.json` = [], `api/content/reviewers.json` = []. `npm run questions:check` passed with **0 questions and 0 configured reviewers**. These are measured empty counts, not inferred scientific approval. The user confirmed no validated bank/reviewer is available and chose unavailable assessments.

| Order | Stable lesson ID | Material | DRAFT | REVIEWED | PUBLISHED | MCQ / identification | Quiz |
|---|---|---|---:|---:|---:|---:|---|
| 10 | pengantar | Pengantar ilmu tajwid | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 20 | huruf-hijaiyah | Huruf hijaiyah | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 30 | harakat | Harakat dan tanda baca | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 40 | makhraj | Makharijul huruf | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 50 | sifat-huruf | Sifatul huruf | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 60 | nun-tanwin | Nun sukun dan tanwin | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 70 | ikhfa-haqiqi | Ikhfa haqiqi | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 80 | izhar-halqi | Izhar halqi | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 90 | idgham-bilaghunnah | Idgham bila ghunnah | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 100 | idgham-bighunnah | Idgham bighunnah | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 110 | iqlab | Iqlab | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 120 | mim-sukun | Mim sukun | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 130 | ikhfa-syafawi | Ikhfa syafawi | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 140 | idgham-mimi | Idgham mimi | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 150 | izhar-shafawi | Izhar syafawi | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 160 | ghunnah | Ghunnah pada nun dan mim tasydid | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 170 | qalqalah | Qalqalah | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 180 | lam-tarif | Lam ta'rif: syamsiyah dan qamariyah | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 190 | mad-tabii | Mad thabi'i | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 200 | mad-arid | Mad 'aridh lissukun | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 210 | mad-lazim | Mad lazim kalimi mutsaqqal | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 220 | waqaf-ibtida | Waqaf, wasal, dan ibtida | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 230 | hamzatul-wasl | Hamzatul wasl | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |
| 240 | tafkhim-tarqiq | Tafkhim dan tarqiq | 0 | 0 | 0 | 0 / 0 | UNAVAILABLE |

**Coverage: 0/24 lesson quizzes ready. Detective unavailable.** Minimum opening gate is seven distinct eligible PUBLISHED versions, including both types; target fourteen for meaningful retry variation.

## References, Arabic and provenance

- Existing reader: KFGQPC UthmanicHafs v3.0 (2026), Quran.ws release 0.4.3 / corpus 0.4.2. The separate Tanzil `quran-full.json` does not supply compatible reader offsets.
- Technical checks validate lesson ID, UUID/stable version, options/answer, explanation, sources, trusted reviewer identity/qualification/evidence and question approval date/evidence. Runtime eligibility deduplicates exact normalized content and excludes conflicting duplicates.
- Ayah-based questions reference exact corpus edition/verse SHA-256 and annotation ID/rule/range. Bytes and payload hash are verified; UTF-16 offsets must align with Arabic graphemes and lie inside the referenced annotation. No normalization or ambiguous substring search is used.
- **Actual question references/highlights: NOT APPLICABLE — zero questions.** No question-level scientific correctness can be asserted.
- The existing `editorial-unreviewed` annotations and automated corpus integrity checks do not establish qualified question review.
- Automated tests use prominently labelled synthetic content and a synthetic reviewer registry ONLY in pg-mem and run-owned temporary PostgreSQL schemas. Those fixtures are not a published bank, production content or scientific evidence.

## Content gap and publication path

**BLOCKED: qualified human review and source-backed authored questions for all 24 lessons.** No publication workaround, AI auto-generation, reduced threshold or manual completion fallback is enabled.

1. Have a qualified reviewer author/review a small bank for a selected lesson first.
2. Keep questions DRAFT until wording, answer, distractors, explanation, sources, lesson consistency and exact Arabic highlight are approved.
3. Record independently checkable reviewer credentials and specific version approval evidence; review the operator-managed registry.
4. Run `npm run questions:check`, then explicitly import approved content with `npm run questions:import`. Import neither deletes records nor promotes status.
5. Verify runtime availability, repeat the human review as needed, and audit lesson-by-lesson. Correct content through a new immutable version; withdraw older content explicitly when necessary.

Technical validation is an integrity gate. It does not replace scientific review.
