"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export default function EntryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/dashboard/" : "/login/");
  }, [user, loading, router]);
  return <main className="entry-loading" role="status">Menyiapkan TajwidLens…</main>;
}
