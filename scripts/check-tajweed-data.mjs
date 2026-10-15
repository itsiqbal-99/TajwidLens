import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const index = JSON.parse(readFileSync(resolve(root, "src/data/tajweed-index.json"), "utf8"));
const catalog = JSON.parse(readFileSync(resolve(root, "src/data/tajweed-rules-generated.json"), "utf8"));
let ayahs = 0; let spans = 0;
for (const entry of index.files) {
  const bytes = readFileSync(resolve(root, `public/data/tajweed/${entry.file}`));
  if (createHash("sha256").update(bytes).digest("hex") !== entry.sha256) throw new Error(`Payload checksum mismatch: ${entry.file}`);
  const payload = JSON.parse(bytes.toString("utf8"));
  for (const verse of payload.verses) {
    ayahs += 1;
    for (const annotation of verse.annotations) {
      spans += 1;
      if (!catalog[annotation.ruleId]) throw new Error(`Unknown rule ${annotation.ruleId}`);
      if (!(annotation.start >= 0 && annotation.end > annotation.start && annotation.end <= verse.text.length)) throw new Error(`Invalid range ${annotation.id}`);
      if (verse.text.slice(annotation.start, annotation.end) !== annotation.quote) throw new Error(`Quote mismatch ${annotation.id}`);
      const boundaries = new Set([...new Intl.Segmenter("ar", { granularity: "grapheme" }).segment(verse.text)].flatMap(({ index, segment }) => [index, index + segment.length]));
      if (!boundaries.has(annotation.start) || !boundaries.has(annotation.end)) throw new Error(`Split grapheme ${annotation.id}`);
    }
  }
}
if (ayahs !== 6236 || spans !== index.counts.accepted) throw new Error(`Unexpected totals: ${ayahs} ayahs, ${spans} spans`);
console.log(`Verified ${index.files.length} payload hashes, ${ayahs.toLocaleString()} KFGQPC ayahs, and ${spans.toLocaleString()} source annotations.`);
