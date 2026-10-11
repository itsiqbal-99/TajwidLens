"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Moon, Sun, X, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

const nav = [
  { href: "/", label: "Beranda" },
  { href: "/learn/", label: "Belajar Tajwid" },
  { href: "/explore/", label: "Jelajahi Al-Qur'an" },
  { href: "/reading-guide/", label: "Panduan Bacaan" },
  { href: "/pronunciation/", label: "Pelafalan" },
  { href: "/reference/", label: "Referensi" },
];

export function AppHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const saved = window.localStorage.getItem("tajwidlens-theme");
    const isDark = saved === "dark";
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }, []);

  function toggleTheme() {
    const next = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.localStorage.setItem("tajwidlens-theme", next ? "dark" : "light");
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Lewati ke konten
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" href="/" aria-label="TajwidLens, ke beranda">
            <span className="brand-mark" aria-hidden="true">
              ت
            </span>
            <span>
              Tajwid<span className="brand-accent">Lens</span>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="Navigasi utama">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "nav-active" : ""} ${item.href === "/reading-guide/" ? "nav-feature" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="icon-button theme-button"
              type="button"
              onClick={toggleTheme}
              aria-label="Ganti tema terang atau gelap"
              title="Ganti tema"
            >
              <Sun className="theme-icon-sun" size={19} />
              <Moon className="theme-icon-moon" size={19} />
            </button>
            <button
              className="icon-button mobile-menu-button"
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Tutup menu" : "Buka menu"}
            >
              {open ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
        {open && (
          <nav
            id="mobile-nav"
            className="mobile-nav"
            aria-label="Navigasi seluler"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href ? "nav-active" : ""}
                onClick={() => setOpen(false)}
              >
                {item.label}
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}

export function AppFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <Link className="brand footer-brand" href="/">
            <span className="brand-mark" aria-hidden="true">
              ت
            </span>
            <span>
              Tajwid<span className="brand-accent">Lens</span>
            </span>
          </Link>
          <p className="footer-tagline">
            Understand Every Rule. Read with Confidence.
          </p>
          <p>
            Pendamping belajar bacaan Al-Qur&apos;an. Tidak menggantikan talaqqi
            bersama guru.
          </p>
        </div>
        <div className="footer-links">
          <Link href="/reference/">Sumber &amp; batasan</Link>
          <Link href="/learn/">Materi tajwid</Link>
          <Link href="/reading-guide/">Panduan bacaan</Link>
        </div>
        <small>© {new Date().getFullYear()} TajwidLens </small>
      </div>
    </footer>
  );
}
