import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourceDir = resolve(root, "sources/quran-ws-v0.4.3");
const outputDir = resolve(root, "public/data/tajweed");
const generatedDir = resolve(root, "src/data");
const lock = JSON.parse(readFileSync(resolve(sourceDir, "source-lock.json"), "utf8"));

const readLocked = (name) => {
  const bytes = readFileSync(resolve(sourceDir, name));
  const text = bytes.toString("utf8");
  const digest = createHash("sha256").update(bytes).digest("hex");
  const normalizedText = text.replaceAll("\r\n", "\n");
  const normalizedDigest = createHash("sha256").update(normalizedText, "utf8").digest("hex");
  if (digest !== lock.files[name] && normalizedDigest !== lock.files[name]) throw new Error(`Source checksum mismatch: ${name}`);
  return JSON.parse(normalizedText);
};

const annotations = readLocked("annotations.json");
const corpus = readLocked("rules.json");
const reference = readLocked("edition.json");
const target = readLocked("kfgqpc-edition.json");
readLocked("edition-comparison.json");

if (annotations.corpusVersion !== lock.corpusVersion || corpus.version !== lock.corpusVersion) throw new Error("Corpus version mismatch");
if (annotations.riwayah !== lock.riwayah || target.riwayah !== lock.riwayah) throw new Error("Riwayah mismatch");
if (Object.keys(target.ayahs).length !== 6236) throw new Error("Expected 6,236 target ayahs");

const canonicalEditionDigest = (edition) => createHash("sha256").update(Object.keys(edition.ayahs)
  .sort((a, b) => { const [as, aa] = a.split(":").map(Number); const [bs, ba] = b.split(":").map(Number); return as - bs || aa - ba; })
  .map((key) => `${key}\u0000${edition.ayahs[key]}`).join("\u0001"), "utf8").digest("hex");

if (canonicalEditionDigest(reference) !== annotations.edition.sha256) throw new Error("Annotation reference edition digest mismatch");
const targetDigest = canonicalEditionDigest(target);
const expectedTargetDigest = "9e8f389fd43a2b5d159d080c2153cc1b67373663a560bc4fc294267b852d4d88";
if (targetDigest !== expectedTargetDigest) throw new Error("KFGQPC target edition digest mismatch");

const segmenter = new Intl.Segmenter("ar", { granularity: "grapheme" });
const normalizeCluster = (value) => value.normalize("NFD")
  .replaceAll("\u0657", "\u064b").replaceAll("\u065e", "\u064c").replaceAll("\u0656", "\u064d")
  .replaceAll("\u08f0", "\u064b").replaceAll("\u08f1", "\u064c").replaceAll("\u08f2", "\u064d")
  .normalize("NFD");
const graphemes = (text) => [...segmenter.segment(text)].map(({ segment, index }) => ({ start: index, end: index + segment.length, normalized: normalizeCluster(segment) }));

const topicById = new Map(corpus.topics.map((item) => [item.id, item]));
const categoryById = new Map(corpus.categories.map((item) => [item.id, item]));
const hukumById = new Map(corpus.hukums.map((item) => [item.id, item]));
const eligibleRules = new Map(corpus.rules.filter((item) => item.status === "stable" && !item.needsReview).map((item) => [item.id, item]));

const topicLabels = {
  "tafkheem-tarqeeq": "Tebal dan tipis",
  "letter-relations": "Pertemuan huruf",
  "noon-tanween": "Nun sukun dan tanwin",
  "meem-sakinah": "Mim sukun",
  mushaddadatan: "Nun dan mim bertasydid",
  madd: "Panjang bacaan",
  qalqalah: "Qalqalah"
};
const categoryLabels = {
  "izhar-halqi": "Izhar halqi", "idgham-bi-ghunnah": "Idgham dengan dengung", "idgham-bila-ghunnah": "Idgham tanpa dengung",
  iqlab: "Iqlab", "ikhfa-haqiqi": "Ikhfa haqiqi", "idgham-shafawi": "Idgham mimi", "ikhfa-shafawi": "Ikhfa syafawi",
  "izhar-shafawi": "Izhar syafawi", mushaddadatan: "Ghunnah musyaddadah", "madd-tabee": "Mad alami",
  "madd-far-hamz": "Mad karena hamzah", "madd-lazim": "Mad lazim", "leen-letters": "Huruf lin", "qalqalah-ranks": "Qalqalah",
  "raa-rules": "Hukum ra", "lam-jalalah": "Lam jalalah", "tafkheem-ranks": "Tingkatan tafkhim", "mutamathilain-sagheer": "Pertemuan huruf sejenis",
  "mutajanisain-sagheer": "Pertemuan huruf semakraj", "ikhfa-ghunnah-quality": "Sifat dengung ikhfa"
};

const ruleCatalog = Object.fromEntries([...eligibleRules.values()].map((rule) => {
  const hukum = hukumById.get(rule.hukum); const category = categoryById.get(hukum.category); const topic = topicById.get(category.topic);
  return [rule.id, { id: rule.id, hukumId: hukum.id, hukumAr: hukum.label.ar, categoryId: category.id,
    category: categoryLabels[category.id] ?? category.label.ar, topicId: topic.id, topic: topicLabels[topic.id] ?? topic.label.ar,
    ruleAr: rule.label.ar, pattern: rule.case, scope: rule.scope, school: hukum.school ?? null }];
}));

const quran = JSON.parse(readFileSync(resolve(root, "src/data/quran-full.json"), "utf8"));
mkdirSync(outputDir, { recursive: true });
const manifests = [];
const rejectedAyahs = [];
const counts = { accepted: 0, excludedRule: 0, unmatchedAyah: 0 };
const learningVerses = {};
const searchExamples = [];
const exampleCounts = new Map();

for (const surah of quran) {
  const verses = [];
  for (const oldVerse of surah.verses) {
    const ref = `${surah.number}:${oldVerse.number}`;
    const sourceText = reference.ayahs[ref]; const text = target.ayahs[ref];
    const sourceClusters = graphemes(sourceText); const targetClusters = graphemes(text);
    const aligned = sourceClusters.length === targetClusters.length && sourceClusters.every((item, index) => item.normalized === targetClusters[index].normalized);
    if (!aligned) rejectedAyahs.push(ref);
    const sourceSpans = annotations.spans[ref] ?? [];
    const verseAnnotations = [];
    for (let index = 0; index < sourceSpans.length; index++) {
      const [start, end, ruleIndex] = sourceSpans[index];
      const ruleId = annotations.ruleIds[ruleIndex];
      if (!eligibleRules.has(ruleId)) { counts.excludedRule += 1; continue; }
      if (!aligned) { counts.unmatchedAyah += 1; continue; }
      const first = sourceClusters.findIndex((cluster) => cluster.end > start);
      let last = sourceClusters.length - 1;
      for (let cursor = first; cursor < sourceClusters.length; cursor++) { if (sourceClusters[cursor].start >= end) { last = cursor - 1; break; } }
      if (first < 0 || last < first) throw new Error(`Invalid source span ${ref}#${index}`);
      const mappedStart = targetClusters[first].start; const mappedEnd = targetClusters[last].end;
      const meta = ruleCatalog[ruleId];
      verseAnnotations.push({ id: `${ref}:${index}`, ruleId, hukumId: meta.hukumId, start: mappedStart, end: mappedEnd, quote: text.slice(mappedStart, mappedEnd) });
      counts.accepted += 1;
    }
    verses.push({ number: oldVerse.number, text, annotations: verseAnnotations });
    if ([1, 112, 113, 114].includes(surah.number) || (surah.number === 2 && [8, 10, 19].includes(oldVerse.number))) {
      learningVerses[ref] = verses.at(-1);
    }
    for (const item of verseAnnotations) {
      if ((exampleCounts.get(item.hukumId) ?? 0) >= 3) continue;
      const words = [...text.matchAll(/\S+/gu)].filter((word) => word.index < item.end && word.index + word[0].length > item.start).map((word) => word[0]).join(" ");
      searchExamples.push({ ...item, surah: surah.number, ayah: oldVerse.number, words });
      exampleCounts.set(item.hukumId, (exampleCounts.get(item.hukumId) ?? 0) + 1);
    }
  }
  const payload = { source: { provider: "Quran.ws Tajweed", release: lock.release, corpusVersion: lock.corpusVersion, commit: lock.commit,
    riwayah: lock.riwayah, displayEdition: "KFGQPC UthmanicHafs v3.0 (2026)", displayEditionSha256: targetDigest,
    reviewPolicy: "stable-without-needsReview" }, surah: { number: surah.number, name: surah.name, arabicName: surah.arabicName, meaning: surah.meaning, basmala: surah.number !== 1 && surah.number !== 9 ? target.ayahs["1:1"] : undefined }, verses };
  const json = `${JSON.stringify(payload)}\n`; const file = `${surah.number}.json`; writeFileSync(resolve(outputDir, file), json, "utf8");
  manifests.push({ surah: surah.number, file, sha256: createHash("sha256").update(json).digest("hex"), bytes: Buffer.byteLength(json) });
}

writeFileSync(resolve(generatedDir, "tajweed-rules-generated.json"), `${JSON.stringify(ruleCatalog, null, 2)}\n`, "utf8");
writeFileSync(resolve(generatedDir, "learning-verses.json"), `${JSON.stringify(learningVerses)}\n`, "utf8");
writeFileSync(resolve(generatedDir, "tajweed-examples.json"), `${JSON.stringify(searchExamples)}\n`, "utf8");
writeFileSync(resolve(generatedDir, "tajweed-index.json"), `${JSON.stringify({ source: { release: lock.release, corpusVersion: lock.corpusVersion, commit: lock.commit,
  displayEdition: "KFGQPC UthmanicHafs v3.0 (2026)", displayEditionSha256: targetDigest }, counts, rejectedAyahs,
  surahs: quran.map(({ number, name, arabicName, meaning, verses }) => ({ number, name, arabicName, meaning, ayahCount: verses.length })), files: manifests }, null, 2)}\n`, "utf8");

console.log(JSON.stringify({ eligibleRules: eligibleRules.size, ...counts, rejectedAyahs }, null, 2));
