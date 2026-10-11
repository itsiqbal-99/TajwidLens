import type { Metadata } from "next";
import "@fontsource-variable/inter/index.css";
import "@fontsource/noto-naskh-arabic/400.css";
import "@fontsource/noto-naskh-arabic/500.css";
import "@fontsource/noto-naskh-arabic/600.css";
import "./globals.css";
import { AppHeader, AppFooter } from "@/components/shell";

export const metadata: Metadata = {
  title: { default: "TajwidLens — Baca Al-Qur'an dengan Lebih Yakin", template: "%s | TajwidLens" },
  description: "Panduan bacaan Al-Qur'an yang kontekstual: pilih ayat, pahami hukum tajwid, dan bandingkan cara membaca saat waqaf atau wasal.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" suppressHydrationWarning><body><AppHeader /><main id="main-content">{children}</main><AppFooter /></body></html>;
}
