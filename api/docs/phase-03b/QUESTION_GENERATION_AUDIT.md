# Question generation audit — Phase 03B

Historical 25 October audit below. For the current 394-question source pack, 24-lesson coverage, development publication and explicit owner authorization, see [AUTOMATED_QUIZ_ACTIVATION.md](AUTOMATED_QUIZ_ACTIVATION.md).

25 October 2026, Asia/Jakarta. Measured from generated-candidates.json and generated-manifest.json, source version `2bfd244056e383b468c51260d021d0269cefb68805eafdd87c0b0c4a60e3889c`.

**GENERATED 193; STRUCTURALLY_VALIDATED 193; SOURCE_VERIFIED 0; EXPERT_REVIEW_REQUIRED 193; PUBLISHED 0. BLOCKED for live assessment: all 24 lessons.** There are 72 MCQ candidates (three distinct explicit lesson sections each) and 121 identification candidates (eleven per supported leaf lesson). Eleven lessons have fourteen mixed candidates; thirteen have only three MCQs and remain CONTENT_GAP. No quota padding or fabricated ayah was used.

The ID column below is **identification candidates / currently eligible Detective questions**. A technical candidate count is not readiness.

| Lesson ID | Title | Source availability | Generated | Passed | Failed | Source verified | Published | ID / Detective eligible | Gap / review requirement |
|---|---|---|---:|---:|---:|---:|---:|---:|---|
| pengantar | Pengantar ilmu tajwid | 3 fields | 3 | 3 | 0 | 0 | 0 | 0 / 0 | CONTENT_GAP |
| huruf-hijaiyah | Huruf hijaiyah | 3 fields | 3 | 3 | 0 | 0 | 0 | 0 / 0 | CONTENT_GAP |
| harakat | Harakat dan tanda baca | 3 fields | 3 | 3 | 0 | 0 | 0 | 0 / 0 | CONTENT_GAP |
| makhraj | Makharijul huruf | 3 fields | 3 | 3 | 0 | 0 | 0 | 0 / 0 | CONTENT_GAP |
| sifat-huruf | Sifatul huruf | 3 fields | 3 | 3 | 0 | 0 | 0 | 0 / 0 | CONTENT_GAP |
| nun-tanwin | Nun sukun dan tanwin | 3 fields | 3 | 3 | 0 | 0 | 0 | 0 / 0 | CONTENT_GAP |
| ikhfa-haqiqi | Ikhfa haqiqi | 3 fields + mapped annotations | 14 | 14 | 0 | 0 | 0 | 11 / 0 | EXPERT_REVIEW_REQUIRED |
| izhar-halqi | Izhar halqi | 3 fields + mapped annotations | 14 | 14 | 0 | 0 | 0 | 11 / 0 | EXPERT_REVIEW_REQUIRED |
| idgham-bilaghunnah | Idgham bila ghunnah | 3 fields + mapped annotations | 14 | 14 | 0 | 0 | 0 | 11 / 0 | EXPERT_REVIEW_REQUIRED |
| idgham-bighunnah | Idgham bighunnah | 3 fields + mapped annotations | 14 | 14 | 0 | 0 | 0 | 11 / 0 | EXPERT_REVIEW_REQUIRED |
| iqlab | Iqlab | 3 fields + mapped annotations | 14 | 14 | 0 | 0 | 0 | 11 / 0 | EXPERT_REVIEW_REQUIRED |
| mim-sukun | Mim sukun | 3 fields | 3 | 3 | 0 | 0 | 0 | 0 / 0 | CONTENT_GAP |
| ikhfa-syafawi | Ikhfa syafawi | 3 fields + mapped annotations | 14 | 14 | 0 | 0 | 0 | 11 / 0 | EXPERT_REVIEW_REQUIRED |
| idgham-mimi | Idgham mimi | 3 fields + mapped annotations | 14 | 14 | 0 | 0 | 0 | 11 / 0 | EXPERT_REVIEW_REQUIRED |
| izhar-shafawi | Izhar syafawi | 3 fields + mapped annotations | 14 | 14 | 0 | 0 | 0 | 11 / 0 | EXPERT_REVIEW_REQUIRED |
| ghunnah | Ghunnah pada nun dan mim tasydid | 3 fields + mapped annotations | 14 | 14 | 0 | 0 | 0 | 11 / 0 | EXPERT_REVIEW_REQUIRED |
| qalqalah | Qalqalah | 3 fields | 3 | 3 | 0 | 0 | 0 | 0 / 0 | CONTENT_GAP |
| lam-tarif | Lam ta'rif: syamsiyah dan qamariyah | 3 fields | 3 | 3 | 0 | 0 | 0 | 0 / 0 | CONTENT_GAP |
| mad-tabii | Mad thabi'i | 3 fields + mapped annotations | 14 | 14 | 0 | 0 | 0 | 11 / 0 | EXPERT_REVIEW_REQUIRED |
| mad-arid | Mad 'aridh lissukun | 3 fields | 3 | 3 | 0 | 0 | 0 | 0 / 0 | CONTENT_GAP |
| mad-lazim | Mad lazim kalimi mutsaqqal | 3 fields | 3 | 3 | 0 | 0 | 0 | 0 / 0 | CONTENT_GAP |
| waqaf-ibtida | Waqaf, wasal, dan ibtida | 3 fields | 3 | 3 | 0 | 0 | 0 | 0 / 0 | CONTENT_GAP |
| hamzatul-wasl | Hamzatul wasl | 3 fields | 3 | 3 | 0 | 0 | 0 | 0 / 0 | CONTENT_GAP |
| tafkhim-tarqiq | Tafkhim dan tarqiq | 3 fields + mapped annotations | 14 | 14 | 0 | 0 | 0 | 11 / 0 | EXPERT_REVIEW_REQUIRED |

Actual source/reviewer approval registries are empty. Every candidate needs qualified review of source correctness, wording, explanation and distractor plausibility before publication. The explicit source-verified path additionally requires trusted approval of the exact source/transformation manifest and exact version hashes; no such evidence exists.

## Selection and exclusions

Generated items start DRAFT with no human reviewer. MCQs quote condition, pronunciation or commonMistake verbatim and ask which statement appears in that named section. They do not infer a new definition from arbitrary paragraphs. Options are distinct source field values; IDs do not encode which option is correct.

Identification uses only explicit leaf lesson/rule mappings and the unchanged reader corpus. Generic parent lessons do not duplicate their children's ayah questions. An overlapping alternative among the offered classifications makes the source opportunity ambiguous and it is excluded. Different permissible ra rulings are also excluded. Distinct ayahs are preferred; deterministic hashes select variation up to fourteen total candidates.

Raw opportunity exclusions measured in this run: **2355 ambiguous**, **57997 unsupported/unmapped**, **0 invalid selected ranges**, **0 duplicate source ranges**. These are upstream opportunity filters, not failed published questions. All 193 selected candidates passed the technical pipeline.

Qalqalah and some mad cases are absent from the allowed generated corpus because upstream marks relevant rules needsReview/disputed or provides no supported annotation. Waqaf/ibtida, hamzatul-wasl, lam ta'rif and foundational lessons have no safe dedicated reader mapping here; their three structured recall candidates do not close that gap. No Quran/annotation source was changed.

Stable UUIDs derive from a semantic source key, immutable version and content digest. Re-running preserves IDs/versions; changing source content creates a new version. The manifest pins all input file digests and generation code. Import is idempotent and preserves existing publication/review/quarantine state. Actual development import contains only DRAFT versions; scientific readiness is still zero.

Recommended next work is human source/template/content review, then a small explicit publication scope. Do not treat source status stable, automated tests or synthetic approval fixtures as scientific review. No production operation or Phase 04.
