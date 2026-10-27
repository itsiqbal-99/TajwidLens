export type TajweedAnnotation = {
  id: string;
  ruleId: string;
  hukumId: string;
  start: number;
  end: number;
  quote: string;
};

export type TajweedRule = {
  id: string;
  hukumId: string;
  hukumAr: string;
  categoryId: string;
  category: string;
  topicId: string;
  topic: string;
  ruleAr: string;
  pattern: string;
  scope: "within-word" | "cross-word" | string;
  school: { id: string; scholar: string } | null;
};

export type TajweedVerse = {
  number: number;
  text: string;
  annotations: TajweedAnnotation[];
};

export type TajweedSurahPayload = {
  source: {
    provider: string;
    release: string;
    corpusVersion: string;
    commit: string;
    riwayah: string;
    displayEdition: string;
    displayEditionSha256: string;
    reviewPolicy: string;
  };
  surah: {
    number: number;
    name: string;
    arabicName: string;
    meaning: string;
    basmala?: string;
  };
  verses: TajweedVerse[];
};

export type TajweedIndex = {
  source: {
    release: string;
    corpusVersion: string;
    commit: string;
    displayEdition: string;
    displayEditionSha256: string;
  };
  counts: { accepted: number; excludedRule: number; unmatchedAyah: number };
  rejectedAyahs: string[];
  surahs: Array<{ number: number; name: string; arabicName: string; meaning: string; ayahCount: number }>;
  files: Array<{ surah: number; file: string; sha256: string; bytes: number }>;
};
