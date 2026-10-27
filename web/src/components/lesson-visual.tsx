import { BookOpenText, AudioLines, Blend, Waves, Activity, MoveHorizontal, Signpost } from "lucide-react";

type Props = {
  category: string;
  sample: string;
  label: string;
  large?: boolean;
};

const categoryIcons: Record<string, typeof BookOpenText> = {
  Dasar: BookOpenText,
  Pelafalan: AudioLines,
  "Pertemuan huruf": Blend,
  Dengung: Waves,
  "Sifat bunyi": Activity,
  "Panjang bacaan": MoveHorizontal,
  "Konteks bacaan": Signpost,
};

export function LessonVisual({ category, sample, label, large = false }: Props) {
  const Icon = categoryIcons[category] ?? BookOpenText;
  return <div className={`lesson-visual${large ? " lesson-visual-large" : ""}`}>
    <Icon className="lesson-visual-icon" size={20} strokeWidth={1.5} aria-hidden="true" />
    <strong className="lesson-visual-sample" dir="rtl" lang="ar">{sample}</strong>
    <span className="lesson-visual-label">{label}</span>
  </div>;
}
