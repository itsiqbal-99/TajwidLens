"use client";

import { Download, Share2, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { assetPath } from "@/lib/asset-path";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandaloneMode() {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || iosNavigator.standalone === true;
}

export function PwaInstaller() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [standalone, setStandalone] = useState(true);
  const [dismissed, setDismissed] = useState(true);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const standaloneNow = isStandaloneMode();
    const iosNow = isIOSDevice();
    const dismissedNow = window.sessionStorage.getItem("tajwidlens-install-dismissed") === "1";
    queueMicrotask(() => {
      setStandalone(standaloneNow);
      setIsIOS(iosNow);
      setDismissed(dismissedNow);
    });

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register(assetPath("/sw.js"), { updateViaCache: "none" }).catch(() => undefined);
    }

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setStandalone(true);
      setInstallPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const close = () => {
    window.sessionStorage.setItem("tajwidlens-install-dismissed", "1");
    setDismissed(true);
  };

  const install = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setStandalone(true);
    setInstallPrompt(null);
  };

  if (standalone || dismissed || (!isIOS && !installPrompt)) return null;

  return <aside className="pwa-install" aria-live="polite" aria-label="Pasang aplikasi TajwidLens">
    <button className="pwa-install-close" type="button" onClick={close} aria-label="Tutup saran pemasangan"><X size={16}/></button>
    <span className="pwa-install-icon" aria-hidden="true"><Smartphone size={22}/></span>
    <div className="pwa-install-copy">
      <strong>Pasang TajwidLens</strong>
      <span>{isIOS ? "Simpan di layar utama iPhone atau iPad." : "Buka lebih cepat seperti aplikasi Android."}</span>
      {showIOSGuide && <small><Share2 size={13}/> Ketuk tombol Bagikan, lalu pilih <b>Tambahkan ke Layar Utama</b>.</small>}
    </div>
    <button className="pwa-install-action" type="button" onClick={install}>{isIOS ? <Share2 size={15}/> : <Download size={15}/>} {showIOSGuide ? "Petunjuk" : "Pasang"}</button>
  </aside>;
}
