"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { TajweedAnnotation, TajweedRule } from "@/data/tajweed-types";
import { getHukumColor } from "@/lib/tajweed-presentation";

type Segment = { start: number; end: number; value: string; annotations: TajweedAnnotation[] };

function makeSegments(text: string, annotations: TajweedAnnotation[]) {
  const boundaries = new Set([0, text.length]);
  for (const annotation of annotations) {
    boundaries.add(annotation.start);
    boundaries.add(annotation.end);
  }
  const offsets = [...boundaries].sort((a, b) => a - b);
  return offsets.slice(0, -1).map((start, index): Segment => {
    const end = offsets[index + 1];
    return {
      start,
      end,
      value: text.slice(start, end),
      annotations: annotations.filter((item) => item.start < end && item.end > start),
    };
  });
}

function segmentStyle(segment: Segment, rules: Record<string, TajweedRule>, selectedId: string | null): CSSProperties | undefined {
  if (!segment.annotations.length) return undefined;
  const colors = [...new Set(segment.annotations.map((item) => getHukumColor(rules[item.ruleId])))];
  const selected = segment.annotations.find((item) => item.id === selectedId);
  const stops = colors.flatMap((color, index) => {
    const start = (index / colors.length) * 100;
    const end = ((index + 1) / colors.length) * 100;
    const opacity = selected ? "var(--tajwid-band-selected-opacity)" : "var(--tajwid-band-opacity)";
    return [`color-mix(in srgb, ${color} ${opacity}, transparent) ${start}%`, `color-mix(in srgb, ${color} ${opacity}, transparent) ${end}%`];
  });
  return {
    backgroundImage: `linear-gradient(90deg, ${stops.join(", ")})`,
    boxShadow: selected
      ? `inset 0 -4px ${getHukumColor(rules[selected.ruleId])}, 0 0 0 1px color-mix(in srgb, ${getHukumColor(rules[selected.ruleId])} 45%, transparent)`
      : `inset 0 -3px ${colors[0]}`,
  };
}

export function TajweedText({ text, annotations, rules, selectedId, visible, fontSize, onSelect }: {
  text: string;
  annotations: TajweedAnnotation[];
  rules: Record<string, TajweedRule>;
  selectedId: string | null;
  visible: boolean;
  fontSize: number;
  onSelect: (annotations: TajweedAnnotation[]) => void;
}) {
  const segments = useMemo(() => makeSegments(text, visible ? annotations : []), [annotations, text, visible]);

  return <p className="arabic-verse tajweed-text" dir="rtl" lang="ar" style={{ fontSize }} aria-label={text}>
    {segments.map((segment) => segment.annotations.length ? <span
      key={`${segment.start}-${segment.end}`}
      role="button"
      tabIndex={0}
      className={`tajweed-segment ${segment.annotations.length > 1 ? "has-overlap" : ""}`}
      style={segmentStyle(segment, rules, selectedId)}
      aria-label={`${segment.value}; ${segment.annotations.length} anotasi tajwid`}
      onClick={() => onSelect(segment.annotations)}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(segment.annotations); } }}
    >{segment.value}</span> : <span key={`${segment.start}-${segment.end}`}>{segment.value}</span>)}
  </p>;
}
