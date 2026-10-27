# Content validation — Phase 03B

Historical 25 October report below. The 26 October source pack has 394 technically validated versions, published only in development after explicit owner authorization. Human scientific review remains absent. See [current source constraints and authorization](AUTOMATED_QUIZ_ACTIVATION.md).

25 October 2026. **193 GENERATED, 193 STRUCTURALLY_VALIDATED, 0 failed selected candidates, 0 SOURCE_VERIFIED, 193 EXPERT_REVIEW_REQUIRED, 0 PUBLISHED.** Technical validation is not scientific tajwid review. No candidate is eligible for live quiz completion or Detective.

## Sources and provenance

The manifest pins exact SHA-256 digests of the 24-lesson content, canonical groups/catalogue, generated and raw Quran.ws rules, raw annotations, reader index, explicit lesson-rule map and generator implementation. Every candidate stores its source bundle version, method/template version, file/field/value hashes, mapping hash and validation stages. Ayah questions additionally retain corpus edition/version, verse digest, exact UTF-16 range, annotation/rule identity, payload digest and pinned upstream commit. Confidence is explicitly NOT_PROVIDED, never an invented number.

Reader text is the existing KFGQPC UthmanicHafs v3.0 (2026), Quran.ws release v0.4.3 / corpus 0.4.2. The source import pipeline already excludes disputed/needsReview rules and materially mismatched ayahs. This phase does not change that data or use Tanzil offsets. Editorial examples remain editorial-unreviewed and cannot establish publication approval.

## Technical rules actually executed

| Stage | Gate |
|---|---|
| Structure | Catalogue ID, UUID/stable version, supported type, nonempty bounded prompt/explanation/source, 2–6 distinct options, exactly one referenced answer |
| Deterministic derivation | Rebuild expected source/template content and compare semantic body hash; edited answer, distractors, explanation, mapping or source version fails |
| Source traceability | Required generation metadata and exact current source bundle/field values; no arbitrary paragraph-to-definition inference |
| Quran | Exact manifest path/bytes/SHA-256, edition/verse version, known surah/ayah, matching annotation/rule/quote/range and Arabic grapheme boundaries |
| Ambiguity | Exclude overlapping alternative classifications among offered choices and unsupported/permissible ra cases; constrain choices to the named rule family |
| Duplicates | Stable semantic key; same ayah/highlight/rule/type fingerprint; one named-section recall per lesson/facet; no equivalent template padding |
| Versions/import | Stable IDs/versions on rerun; changed content gets a new immutable version; repeat import skips existing rows, preserving review/publication/hold state |
| Publication | PUBLISHED plus trusted real human approval, or exact trusted source/transformation approval; held/invalid/untrusted questions remain ineligible |

The generator reads all 114 hash-verified payloads; the selected candidates contain 121 ayah references with intact offsets/text. The manifest opportunity filter excluded 2,355 ambiguous and 57,997 unsupported/unmapped annotations; those totals are not counts of rejected authored questions. Selected candidate validation failed zero. Qalqalah/mad review flags and unavailable waqaf/hamzah/lam-specific mappings were respected; no inferred replacement range was created.

MCQs are literal recall of explicit condition, pronunciation and commonMistake sections. Distractors are distinct existing source-field values, preferably related by category. Exact string/source consistency is testable; plausibility, interpretive overlap, beginner clarity and scientific correctness still need a qualified reviewer. Identification explanations quote the mapped lesson condition and source rule; they are not new LLM explanations.

## Trust and publication eligibility

reviewers.json and source-approvals.json are empty. Stable upstream metadata, a matching digest and a passing automated test are not sufficient source-review evidence. Therefore all 193 remain DRAFT and expert review is required; **0/24 quizzes and 0 Detective questions are live-ready**.

Human approval must identify the qualified reviewer and exact version evidence. Source-verified approval must additionally bind the genuinely reviewed source/transformation manifest and exact candidate hashes. These are separate trust paths; automatic generation never creates a reviewer identity or review record. Isolated synthetic approval fixtures test the mechanism only and are never imported into the application schema.

User feedback prioritizes review without assuming the report is correct. It cannot edit keys, publish, suspend by spam or change historical scores. A privileged operator may hold a question; release/publication gates remain strict. Historical snapshots and reports preserve version/source evidence across later updates. No scientific review is claimed in this report.
