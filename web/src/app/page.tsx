"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/auth-provider";
import { assetPath } from "@/lib/asset-path";

export default function EntryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/dashboard/" : "/login/");
  }, [user, loading, router]);
  return <main className="entry-splash" role="status" aria-label="Memuat TajwidLens">
    <div className="entry-splash-content" aria-hidden="true">
      <Image src={assetPath('/android-chrome-192x192.png')} width={76} height={76} alt="" preload />
      <strong>Tajwid<span>Lens</span></strong>
      <div className="entry-splash-track"><span /></div>
    </div>
    <span className="sr-only">Memuat TajwidLens</span>
  </main>;
}
