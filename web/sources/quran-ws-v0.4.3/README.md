# Pinned tajweed source

This directory preserves Quran.ws Tajweed release `v0.4.3`, commit
`c0d07c02965d7853f8002491f05f90e8b0f24d06`, under the included CC BY 4.0
notices. The rule corpus version inside that release is `0.4.2`.

`annotations.json` contains precomputed source annotations. TajwidLens does not
run the rule engine in the browser. The offsets refer to `edition.json`, whose
upstream metadata explicitly says its earlier printed-text provenance was not
recorded. That edition is retained only as an auditable import input and is
never displayed or copied into the public runtime payloads.

The displayed text comes from `kfgqpc-edition.json`: KFGQPC
`UthmanicHafs-v-3.0`, release year 2026, package SHA-256
`cdec7341b7c684e7b8dd469c4b68988914d2784e924c7e6cbb9cb4b57c24f013`.
`edition-comparison.json` is the upstream comparison between both encodings.

The local generator transfers a precomputed span only where every grapheme in
the complete ayah has a one-to-one normalized match. It handles only the three
documented encoding differences: canonical mark order, precomposed characters,
and positional/open tanween. Four materially different ayahs fail closed.
Disputed, disabled, and `needsReview` rules are also excluded.
