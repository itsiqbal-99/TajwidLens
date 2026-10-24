"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight, BookOpen, Compass, GraduationCap, ScanText, AudioLines, Library, ArrowRight, UserRound, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "./auth-provider";
import { ThemePicker } from "./theme-picker";

const nav = [
  { href: "/home/", label: "Beranda", icon: Compass },
  { href: "/learn/", label: "Belajar Tajwid", icon: GraduationCap },
  { href: "/explore/", label: "Jelajahi Al-Qur'an", icon: BookOpen },
  { href: "/reading-guide/", label: "Panduan Bacaan", icon: ScanText },
  { href: "/pronunciation/", label: "Pelafalan", icon: AudioLines },
  { href: "/reference/", label: "Referensi", icon: Library },
];

export function BrandIcon() {
  return <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 12.5c4.7-1.9 8.6-1.2 12 1.6 3.4-2.8 7.3-3.5 12-1.6v16.2c-4.7-1.9-8.6-1.3-12 1.5-3.4-2.8-7.3-3.4-12-1.5V12.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M20 14.2v15.3" stroke="currentColor" strokeWidth="2"/><circle cx="27.7" cy="20.8" r="4.6" fill="var(--brand-mark-bg)" stroke="var(--brand-mark-accent)" strokeWidth="2"/><path d="m31.2 24.3 3.5 3.5" stroke="var(--brand-mark-accent)" strokeWidth="2" strokeLinecap="round"/></svg></span>;
}

export function AppHeader() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { queueMicrotask(() => setOpen(false)); }, [pathname]);
  useEffect(() => { if (!open) return; const handle = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); }; window.addEventListener("keydown", handle); return () => window.removeEventListener("keydown", handle); }, [open]);

  return <>
    <a className="skip-link" href="#main-content">Lewati ke konten</a>
    <header className="site-header"><div className="header-inner">
      <Link className="brand" href="/home/" aria-label="TajwidLens, kembali ke beranda"><BrandIcon/><span>Tajwid<span className="brand-accent">Lens</span></span><span className="brand-separator" aria-hidden="true"/><span className="brand-descriptor">THE READING COMPANION</span></Link>
      <nav className="desktop-nav" aria-label="Navigasi utama">{nav.filter((item) => item.href !== "/reading-guide/").map((item) => <Link key={item.href} href={item.href} className={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "nav-active" : ""}>{item.label}</Link>)}</nav>
      <div className="header-actions"><Link className={`account-nav ${user ? 'account-nav-signed' : 'account-nav-guest'}`} href={user ? "/profile/" : "/login/"} aria-label={loading ? 'Akun' : user ? 'Profil' : 'Masuk'} aria-current={user && pathname.startsWith('/profile/') ? 'page' : undefined}>
        <span className="account-nav-avatar" aria-hidden="true">{user ? user.nickname.trim().slice(0,1).toUpperCase() : <UserRound size={17}/>}</span>
        <span className="account-nav-copy"><small>{loading ? 'Memuat akun' : user ? 'Welcome,' : 'Akun TajwidLens'}</small><strong>{loading ? 'Akun' : user ? user.nickname : 'Masuk'}</strong></span><ChevronRight size={14} aria-hidden="true" />
      </Link><ThemePicker /><Link className={`header-cta ${pathname.startsWith("/reading-guide/") ? "header-cta-active" : ""}`} href="/reading-guide/">Panduan Bacaan <ArrowUpRight size={15}/></Link><button className="icon-button mobile-menu-button" type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Tutup menu" : "Buka menu"}>{open ? <X size={21}/> : <Menu size={21}/>}</button></div>
    </div>{open && <nav className="mobile-nav" id="mobile-nav" aria-label="Navigasi seluler">{nav.map(({href, label, icon: Icon}) => <Link href={href} key={href} className={pathname === href || (href !== "/" && pathname.startsWith(href)) ? "nav-active" : ""} onClick={() => setOpen(false)}><Icon size={18}/><span>{label}</span><ArrowUpRight size={15}/></Link>)}</nav>}</header>
  </>;
}

export function AppFooter() {
  return <footer className="site-footer"><div className="footer-inner"><div className="footer-main"><Link className="brand footer-brand" href="/home/"><BrandIcon/><span>Tajwid<span className="brand-accent">Lens</span></span></Link><p>Panduan memahami bacaan Al-Qur&apos;an, berangkat dari ayatnya.</p><span className="footer-note">Pendamping pembelajaran digital, bukan pengganti talaqqi bersama guru.</span></div><div className="footer-navigation"><div><span>JELAJAHI</span><Link href="/explore/">Al-Qur&apos;an</Link><Link href="/reading-guide/">Panduan bacaan</Link><Link href="/learn/">Materi tajwid</Link></div><div><span>PELAJARI</span><Link href="/pronunciation/">Pelafalan</Link><Link href="/reference/">Sumber &amp; referensi</Link><Link href="/reading-guide/?surah=113&ayah=2&annotation=113%3A2%3A1">Contoh bacaan <ArrowRight size={13}/></Link></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} TajwidLens</span><span>Understand Every Rule. Read with Confidence.</span></div></div></footer>;
}
