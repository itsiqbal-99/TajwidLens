import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { assetPath } from "@/lib/asset-path";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-layout">
      <header className="auth-header">
        <Link href="/home/" className="auth-brand" aria-label="TajwidLens, beranda">
          <Image className="auth-brand-mark" src={assetPath('/android-chrome-512x512.png')} width={36} height={36} alt="Logo TajwidLens"/>
          <span>TajwidLens</span>
        </Link>
        <Link href="/home/" className="auth-back-link">
          Jelajahi aplikasi <ArrowUpRight size={15} aria-hidden="true"/>
        </Link>
      </header>
      <main id="main-content" className="auth-main">
        {children}
      </main>
      <footer className="auth-footer">
        <span>© {new Date().getFullYear()} TajwidLens</span>
        <span>Belajar dengan tenang. Baca dengan yakin.</span>
      </footer>
    </div>
  );
}
