import type { Metadata } from "next";
import "@fontsource-variable/inter/index.css";
import "@fontsource/noto-naskh-arabic/400.css";
import "@fontsource/noto-naskh-arabic/500.css";
import "@fontsource/noto-naskh-arabic/600.css";
import "./globals.css";
import "./reading-first.css";
import "./account.css";
import { AuthProvider } from "@/components/auth-provider";
import { AppHeader, AppFooter } from "@/components/shell";
import { assetPath } from "@/lib/asset-path";

export const metadata: Metadata = {
  title: { default: "TajwidLens — Baca Al-Qur'an dengan Lebih Yakin", template: "%s | TajwidLens" },
  description: "Panduan bacaan Al-Qur'an yang kontekstual: pilih ayat, pahami hukum tajwid, dan bandingkan cara membaca saat waqaf atau wasal.",
  icons: {
    icon: [
      { url: assetPath("/favicon.ico"), sizes: "any", type: "image/x-icon" },
      { url: assetPath("/favicon-32x32.png"), sizes: "32x32", type: "image/png" },
      { url: assetPath("/favicon-16x16.png"), sizes: "16x16", type: "image/png" },
      { url: assetPath("/favicon-192x192.png"), sizes: "192x192", type: "image/png" },
      { url: assetPath("/favicon-512x512.png"), sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: assetPath("/apple-touch-icon.png"), sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" suppressHydrationWarning><body><AuthProvider><AppHeader /><main id="main-content">{children}</main><AppFooter /></AuthProvider></body></html>;
}
