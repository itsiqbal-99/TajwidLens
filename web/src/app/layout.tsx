import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter/index.css";
import "@fontsource/noto-naskh-arabic/400.css";
import "@fontsource/noto-naskh-arabic/500.css";
import "@fontsource/noto-naskh-arabic/600.css";
import "./globals.css";
import "./reading-first.css";
import "./learning-ux.css";
import { AuthProvider } from "@/components/auth-provider";
import "./account.css";
import "./learning-progress.css";
import "./question-feedback.css";
import { assetPath } from "@/lib/asset-path";
import Script from "next/script";
import { developmentWorkerCleanup } from "@/lib/development-worker";

export const metadata: Metadata = {
  title: { default: "TajwidLens — Baca Al-Qur'an dengan Lebih Yakin", template: "%s | TajwidLens" },
  description: "Panduan bacaan Al-Qur'an yang kontekstual: pilih ayat, pahami hukum tajwid, dan bandingkan cara membaca saat waqaf atau wasal.",
  applicationName: "TajwidLens",
  appleWebApp: { capable: true, title: "TajwidLens", statusBarStyle: "default" },
  formatDetection: { telephone: false },
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

export const viewport: Viewport = {
  themeColor: "#2f4858",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" data-scroll-behavior="smooth" suppressHydrationWarning><body>{process.env.NODE_ENV === 'development' && <Script id="development-worker-cleanup" strategy="beforeInteractive" dangerouslySetInnerHTML={{__html:developmentWorkerCleanup(assetPath('/sw.js'))}}/>}<AuthProvider>{children}</AuthProvider></body></html>;
}
