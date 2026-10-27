"use client";
import { Palette, Check } from "lucide-react";
import { useEffect, useState } from "react";

const themes = [
  { id: "samudra", label: "Samudra", description: "Biru awan & koral" },
  { id: "zamrud", label: "Zamrud", description: "Hijau malam & emas" },
  { id: "senja", label: "Senja", description: "Krem hangat & terakota" },
  { id: "taman", label: "Taman", description: "Putih, hijau daun & mentari" },
] as const;
type ThemeId = typeof themes[number]["id"];

export function ThemePicker() {
  const [theme, setTheme] = useState<ThemeId>("samudra");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const saved = window.localStorage.getItem("tajwidlens-theme");
    const next: ThemeId = saved === "dark" || saved === "zamrud" ? "zamrud" : saved === "senja" ? "senja" : saved === "taman" ? "taman" : "samudra";
    document.documentElement.dataset.theme = next;
    queueMicrotask(() => {setTheme(next);setReady(true);});
  }, []);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("tajwidlens-theme", theme);
  }, [theme,ready]);
  function chooseTheme(next: ThemeId) { setTheme(next); }
  return <details className="theme-picker"><summary className="icon-button theme-button" aria-label="Pilih tema warna" title="Pilih tema"><Palette size={18}/></summary><div className="theme-menu" role="group" aria-label="Tema warna">{themes.map((item) => <button type="button" key={item.id} className={theme === item.id ? "is-active" : ""} onClick={(event) => { chooseTheme(item.id); event.currentTarget.closest("details")?.removeAttribute("open"); }} aria-pressed={theme === item.id}><i className={`theme-swatch theme-swatch-${item.id}`} aria-hidden="true"/><span><strong>{item.label}</strong><small>{item.description}</small></span>{theme === item.id && <Check size={16}/>}</button>)}</div></details>;
}
