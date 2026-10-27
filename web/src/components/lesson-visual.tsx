import type { CSSProperties } from "react";

type Props = {
  category: string;
  sample: string;
  index?: number;
  large?: boolean;
};

const categoryMeta: Record<string, { label: string; symbol: string }> = {
  Dasar: { label: "Fondasi bacaan", symbol: "ا" },
  Pelafalan: { label: "Arah bunyi", symbol: "ح" },
  "Pertemuan huruf": { label: "Relasi huruf", symbol: "نْ" },
  Dengung: { label: "Resonansi", symbol: "مّ" },
  "Sifat bunyi": { label: "Karakter suara", symbol: "قْ" },
  "Panjang bacaan": { label: "Ritme harakat", symbol: "آ" },
  "Konteks bacaan": { label: "Alur bacaan", symbol: "م" },
};

export function LessonVisual({ category, sample, index = 0, large = false }: Props) {
  const meta = categoryMeta[category] ?? categoryMeta.Dasar;
  const style = { "--visual-order": index } as CSSProperties;
  return <div className={`lesson-visual ${large ? "lesson-visual-large" : ""}`} data-category={category} data-pattern={index % 4} style={style} aria-label={`Visual ${meta.label}`}>
    <svg viewBox="0 0 240 150" aria-hidden="true" focusable="false">
      <path className="visual-orbit visual-orbit-one" d="M32 101C51 43 126 19 201 50" />
      <path className="visual-orbit visual-orbit-two" d="M43 123C100 151 185 127 213 71" />
      <circle className="visual-disc visual-disc-one" cx="51" cy="88" r="19" />
      <circle className="visual-disc visual-disc-two" cx="184" cy="55" r="30" />
      <circle className="visual-dot" cx="205" cy="117" r="6" />
      <path className="visual-wave" d="M72 94c11-18 22-18 33 0s22 18 33 0 22-18 33 0" />
      <path className="visual-axis" d="M27 128h186" />
    </svg>
    <div className="lesson-visual-copy">
      <span>{meta.label}</span>
      <strong dir="rtl" lang="ar">{sample || meta.symbol}</strong>
      <small>{meta.symbol}</small>
    </div>
  </div>;
}
