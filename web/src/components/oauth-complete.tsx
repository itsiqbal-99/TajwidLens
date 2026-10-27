"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { authDiagnostic } from "@/lib/auth-api";
import { oauthChannel, oauthStorageKey } from "@/lib/oauth-completion";
import { useAuth } from "./auth-provider";
import { ActionFeedback } from "./action-feedback";

export function OAuthComplete() {
  const router = useRouter();
  const { refresh } = useAuth();
  const started = useRef(false);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");

  const verify = useCallback(async () => {
    setPending(true);
    setError("");
    if (!(await refresh(true))) {
      setPending(false);
      setError("Sesi Google belum dapat diverifikasi. Coba lagi tanpa mengulangi persetujuan Google.");
      return;
    }

    const destination = new URLSearchParams(window.location.search).get("welcome") === "1"
      ? "/profile/?welcome=1"
      : "/dashboard/";
    try {
      authDiagnostic("navigation-requested");
      const completionId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : null;
      if (completionId && typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel(oauthChannel);
        channel.postMessage({ type: "complete", id: completionId });
        channel.close();
      }
      if (completionId) try {
          localStorage.setItem(oauthStorageKey, completionId);
          localStorage.removeItem(oauthStorageKey);
        } catch {
          // Storage is optional; same-tab navigation and window focus still re-check the cookie.
        }
      window.close();
      router.replace(destination);
    } catch {
      authDiagnostic("navigation-failure");
      setPending(false);
      setError("Sesi sudah aktif, tetapi halaman tujuan tidak dapat dibuka otomatis.");
    }
  }, [refresh, router]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void verify();
  }, [verify]);

  if (error) return <section className="account-page account-card oauth-complete">
    <AlertCircle size={38} aria-hidden="true" />
    <h1>Login belum selesai.</h1>
    <p role="alert" className="error-message">{error}</p>
    <button className="account-primary" type="button" disabled={pending} onClick={() => void verify()}>Periksa sesi lagi</button>
    <p><Link href="/login/">Kembali ke halaman masuk</Link> atau <Link href="/home/">lanjutkan tanpa akun</Link>.</p>
  </section>;

  return <section className="account-page account-card oauth-complete">
    <CheckCircle2 size={38} aria-hidden="true" />
    <h1>Memastikan login Google…</h1>
    <ActionFeedback state="pending">Memverifikasi sesi sebelum membuka halaman akun Anda.</ActionFeedback>
  </section>;
}
