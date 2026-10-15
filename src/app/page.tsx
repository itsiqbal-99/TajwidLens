import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, BookOpenText, Compass, Headphones, MoveUpRight, Search, ScanText } from "lucide-react";
import { HeroReadingDemo } from "@/components/hero-reading-demo";
import { getVerse } from "@/data/quran";

const paths = [
  { number: "01", label: "PANDUAN UTAMA", title: "Mulai dari bacaan yang membingungkan.", description: "Pilih bagian ayat dan pahami cara mengucapkan, huruf pemicu, serta hukum yang berlaku.", href: "/reading-guide/", icon: ScanText },
  { number: "02", label: "PERPUSTAKAAN", title: "Pelajari hukum tajwid secara bertahap.", description: "Materi tersusun dengan kondisi kaidah, teknik pengucapan, dan contoh dalam Al-Qur'an.", href: "/learn/", icon: BookOpenText },
  { number: "03", label: "STUDIO PELAFALAN", title: "Kenali bunyi dari tempat keluarnya.", description: "Jelajahi makhraj, sifat huruf, dan perbedaan pengucapan huruf hijaiyah.", href: "/pronunciation/", icon: Headphones },
];

export default function HomePage() {
  return <>
    <section className="new-hero page-container">
      <div className="new-hero-copy">
        <div className="hero-overline"><span className="tiny-square"/> PENDAMPING MEMBACA AL-QUR&apos;AN <span className="overline-count">/ 01</span></div>
        <h1>Baca Al-Qur&apos;an, <span>pahami setiap bacaannya.</span></h1>
        <p className="new-hero-lead">Saat sebuah kata terasa sulit, temukan bagaimana membacanya dan mengapa hukumnya berlaku—langsung dari konteks ayat.</p>
        <div className="new-hero-actions"><Link className="button button-primary" href="/reading-guide/?surah=113&ayah=2">Mulai dari satu ayat <ArrowUpRight size={17}/></Link><Link className="button button-secondary home-learn-shortcut" href="/learn/"><BookOpenText size={17}/> Belajar tajwid</Link><Link className="understated-link" href="/explore/">Jelajahi Al-Qur&apos;an <ArrowRight size={16}/></Link></div>
        <div className="hero-credibility"><span><b>114</b> surah</span><span><b>6.236</b> ayat</span><span><b>Hafs</b> ‘an ‘Ashim</span></div>
      </div>
      <div className="new-hero-visual"><HeroReadingDemo verses={{"113:2": getVerse(113, 2)?.text ?? "", "1:3": getVerse(1, 3)?.text ?? ""}}/></div>
    </section>

    <div className="chapter-line"><div className="page-container chapter-inner"><span>TAJWIDLENS — MEMAHAMI BACAAN</span><span>JELAJAHI DENGAN LEBIH TERARAH <ArrowRight size={16}/></span></div></div>

    <section className="page-container editorial-intro"><div className="editorial-label">01 / PENDEKATAN KAMI</div><div className="editorial-copy"><h2>Bukan hanya tahu <i>nama hukumnya.</i> Pahami alasan di balik bacaannya.</h2><p>Tajwid dipelajari paling bermakna ketika kembali ke ayatnya. TajwidLens menghubungkan bacaan, kaidah, dan konteks dalam satu ruang baca yang sederhana.</p></div></section>

    <section className="reading-journey"><div className="page-container reading-journey-inner"><div className="journey-heading"><span className="eyebrow">CARA KERJA</span><h2>Tiga langkah.<br/>Satu pemahaman.</h2></div><div className="journey-steps"><div><span className="step-index">01</span><div><h3>Temukan ayat</h3><p>Buka surah dan ayat, lalu temukan bagian bacaan yang ingin dipelajari.</p></div><Compass size={20}/></div><div><span className="step-index">02</span><div><h3>Pilih kata atau frasa</h3><p>Sentuh bagian yang relevan. Hukum dapat melibatkan satu atau beberapa kata.</p></div><ScanText size={20}/></div><div><span className="step-index">03</span><div><h3>Pahami dalam konteks</h3><p>Baca alasan hukum, petunjuk pelafalan, dan contoh penerapan serupa.</p></div><BookOpen size={20}/></div></div></div></section>

    <section className="page-container showcase-section"><div className="showcase-copy"><span className="eyebrow">MEMBACA DENGAN KONTEKS</span><h2>Satu kata.<br/><i>Dua cara membaca.</i></h2><p>Berhenti dan menyambung bacaan dapat mengubah bunyi akhir serta panjang mad. Bandingkan dua kondisi berdasarkan contoh yang telah disiapkan.</p><Link className="understated-link" href="/reading-guide/?surah=1&ayah=3&annotation=1-3-1-mad-arid">Coba perbandingan waqaf &amp; wasal <ArrowUpRight size={17}/></Link></div><div className="showcase-visual"><div className="showcase-caption">AL-FATIHAH / AYAT 03 <span>STUDI BACAAN</span></div><p className="showcase-arabic" dir="rtl" lang="ar">ٱلرَّحِيمِ</p><div className="showcase-modes"><div><span>01 / WAQAF</span><strong>ar-raḥīm</strong><p>Mim akhir disukunkan. Panjang mad bisa 2, 4, atau 6 harakat.</p></div><div><span>02 / WASAL</span><strong>ar-raḥīmi</strong><p>Mim akhir tetap berkasrah. Mad alami dua harakat.</p></div></div><div className="showcase-bottom">Pelajari perbedaan bacaan secara kontekstual <MoveUpRight size={17}/></div></div></section>

    <section className="page-container pathways-section"><div className="pathways-heading"><div><span className="eyebrow">TEMUKAN JALUR BELAJARMU</span><h2>Mulai dari yang ingin Anda pahami.</h2></div><Link className="understated-link" href="/reference/">Tentang sumber &amp; metode <ArrowUpRight size={16}/></Link></div><div className="pathways-list">{paths.map(({number, label, title, description, href, icon: Icon}) => <Link href={href} key={number} className="pathway"><span className="pathway-number">{number}</span><div className="pathway-icon"><Icon size={22} strokeWidth={1.65}/></div><div className="pathway-text"><span>{label}</span><h3>{title}</h3><p>{description}</p></div><span className="pathway-arrow"><ArrowUpRight size={21}/></span></Link>)}</div></section>

    <section className="end-invite"><div className="page-container end-invite-inner"><div><span className="eyebrow">MULAI DARI SINI</span><h2>Ada bacaan yang<br/>membuat Anda ragu?</h2><p>Cari surah, pilih ayat, dan telusuri penjelasannya dengan lebih tenang.</p></div><Link className="button button-light" href="/reading-guide/"><Search size={18}/> Buka Panduan Bacaan <ArrowUpRight size={17}/></Link></div></section>
  </>;
}
