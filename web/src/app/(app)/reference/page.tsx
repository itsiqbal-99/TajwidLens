import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import tajweedIndex from "@/data/tajweed-index.json";
import tajweedRules from "@/data/tajweed-rules-generated.json";
import { lessons } from "@/data/lessons";
import learningReferences from '../../../../../shared/learning-references.json';

export const metadata: Metadata = { title: "Referensi dan Sumber" };

const terms = [
  ["Makhraj", "Tempat keluarnya bunyi huruf."],
  ["Ghunnah", "Dengung yang keluar melalui rongga hidung pada kondisi bacaan tertentu."],
  ["Harakat", "Tanda vokal pendek pada huruf Arab: fathah, kasrah, dan dammah."],
  ["Sukun", "Tanda atau keadaan huruf tanpa vokal sesudahnya."],
  ["Tasydid", "Tanda huruf rangkap: bagian pertama sukun, bagian kedua berharakat."],
  ["Tanwin", "Dua harakat pada akhir kata yang menghasilkan bunyi n ketika disambung."],
  ["Waqaf", "Berhenti pada suatu tempat dalam bacaan dengan memperhatikan lafaz dan makna."],
  ["Wasal", "Menyambung bacaan ke kata atau ayat berikutnya."],
  ["Ibtida", "Memulai bacaan dari tempat yang sesuai setelah berhenti."],
] as const;

export default function ReferencePage() {
  return <div className="page-container page-top reference-page">
    <div className="page-heading"><span className="eyebrow">REFERENSI &amp; TRANSPARANSI</span><h1>Sumber, metode, dan batasannya.</h1><p>Setiap warna berasal dari anotasi prahitung yang dipatok versinya—bukan tebakan browser.</p></div>
    <div className="reference-layout">
      <aside className="reference-toc"><strong>Di halaman ini</strong><a href="#glosarium">Glosarium</a><a href="#sumber">Sumber</a><a href="#metode">Metode impor</a><a href="#cakupan">Cakupan</a><a href="#panduan">Panduan penggunaan</a></aside>
      <div className="reference-content">
        <section id="rujukan-belajar"><span className="section-kicker">RUJUKAN PEMBELAJARAN</span><h2>Materi dan soal yang dapat ditelusuri.</h2><p>Dasar pembelajaran diperiksa silang dengan sumber berikut. Nomor bab/halaman ditautkan pada masing-masing materi dan pembahasan quiz. Ini bukan klaim bahwa penerbit sumber telah meninjau soal TajwidLens.</p><div className="source-block">{learningReferences.map(source=><div key={source.id}><strong>{source.title}</strong><p>{source.publisher}. {source.scope}</p><p>{source.note}</p><a href={source.url} target="_blank" rel="noreferrer">Buka rujukan <ExternalLink size={15}/></a></div>)}</div></section>
        <section id="glosarium"><span className="section-kicker">01 / GLOSARIUM</span><h2>Istilah yang sering muncul</h2><div className="glossary-grid">{terms.map(([title, body]) => <div key={title}><h3>{title}</h3><p>{body}</p></div>)}</div></section>
        <section id="sumber"><span className="section-kicker">02 / SUMBER DATA</span><h2>Korpus yang dipatok dan dapat diaudit</h2><div className="source-block">
          <div><strong>Teks yang ditampilkan</strong><p>KFGQPC UthmanicHafs v3.0 (2026), riwayat Hafs &apos;an &apos;Asim. Teks disimpan per ayat dan diverifikasi terhadap digest edisi sebelum data dibuat.</p><a href="https://github.com/quran-ws/quran-tajweed/tree/c0d07c02965d7853f8002491f05f90e8b0f24d06/editions" target="_blank" rel="noreferrer">Metadata edisi <ExternalLink size={15} /></a></div>
          <div><strong>Anotasi tajwid</strong><p>Quran.ws Tajweed release {tajweedIndex.source.release}, corpus {tajweedIndex.source.corpusVersion}, commit <code>{tajweedIndex.source.commit.slice(0, 12)}</code>. TajwidLens hanya mengimpor aturan berstatus <code>stable</code> dan tanpa <code>needsReview</code>.</p><a href="https://quran.ws/docs/reference/quran-tajweed/" target="_blank" rel="noreferrer">Dokumentasi korpus <ExternalLink size={15} /></a><a href="https://github.com/quran-ws/quran-tajweed/tree/c0d07c02965d7853f8002491f05f90e8b0f24d06" target="_blank" rel="noreferrer">Sumber yang dipatok <ExternalLink size={15} /></a></div>
          <div><strong>Lisensi</strong><p>Aturan, anotasi, dan edisi Quran.ws Tajweed didistribusikan di bawah CC BY 4.0. Berkas lisensi asli disertakan di direktori sumber proyek.</p><a href="https://quran.ws/docs/reference/licensing/" target="_blank" rel="noreferrer">Rincian lisensi <ExternalLink size={15} /></a></div>
        </div></section>
        <section id="metode"><span className="section-kicker">03 / METODE IMPOR</span><h2>Gagal tertutup ketika teks tidak cocok</h2><p>Offset anotasi sumber tidak langsung ditempelkan ke edisi tampilan. Generator membandingkan seluruh grafem ayat dan hanya memindahkan rentang jika susunannya cocok satu-per-satu setelah normalisasi perbedaan encoding yang didokumentasikan upstream. Rentang diperluas ke batas grafem agar tanda baca Arab tidak terpotong.</p><p>Empat ayat—11:41, 27:20, 36:22, dan 52:37—memiliki perbedaan material. Semua rentang dari ayat tersebut ditolak, bukan diperkirakan. Hash sumber, payload per surah, kutipan setiap rentang, batas indeks, dan total 6.236 ayat diperiksa oleh skrip validasi.</p></section>
        <section id="cakupan"><span className="section-kicker">04 / CAKUPAN SAAT INI</span><h2>Apa yang benar-benar tersedia</h2><div className="coverage"><div><strong>114</strong><span>seluruh surah</span></div><div><strong>6.236</strong><span>ayat KFGQPC</span></div><div><strong>{tajweedIndex.counts.accepted.toLocaleString("id-ID")}</strong><span>rentang diterima</span></div><div><strong>{Object.keys(tajweedRules).length}</strong><span>aturan stabil</span></div><div><strong>{lessons.length}</strong><span>materi belajar</span></div></div>
          <p>Korpus mencakup tujuh topik utama: nun/tanwin, mim sakinah, ghunnah pada huruf bertasydid, mad, qalqalah, tafkhim/tarqiq, dan hubungan huruf. Korpus upstream belum mencakup seluruh kemungkinan tajwid—termasuk keputusan waqaf/ibtida berdasarkan makna dan beberapa cabang hukum. Karena itu aplikasi tidak mengisi celah dengan deteksi otomatis.</p><p>Warna dan penjelasan adalah alat bantu belajar, bukan pengganti talaqqi dan koreksi langsung bersama guru Al-Qur&apos;an yang kompeten.</p>
        </section>
        <section id="panduan"><span className="section-kicker">05 / PANDUAN PENGGUNAAN</span><h2>Baca dari rentang, bukan sekadar kata</h2><ol className="reference-steps"><li>Pilih surah atau ayat melalui kolom pencarian di <Link href="/explore/">Jelajahi Al-Qur&apos;an</Link>.</li><li>Ketuk pita warna tepat pada huruf atau tanda baca yang ingin dipahami.</li><li>Jika satu bagian memiliki beberapa hukum, pilih setiap warna di panel untuk membaca penjelasannya secara terpisah.</li><li>Periksa teks aturan Arab, konteks, dan ID aturan sebelum menjadikannya rujukan.</li><li>Konfirmasikan pelafalan dan keputusan waqaf/ibtida bersama guru.</li></ol><Link className="text-link" href="/reading-guide/?surah=1&ayah=6">Lihat contoh rentang tumpang tindih <ArrowUpRight size={17} /></Link></section>
      </div>
    </div>
  </div>;
}
