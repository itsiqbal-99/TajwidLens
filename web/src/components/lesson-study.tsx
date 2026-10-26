import {ArrowUpRight,BookOpenText,Check,ChevronDown,Lightbulb,ListChecks} from 'lucide-react';
import content from '../../../shared/learning-content.json';
import references from '../../../shared/learning-references.json';
import alphabet from '../../../shared/hijaiyah.json';
import type {LessonStudy,StudyReference} from '../../../shared/learning-content';

export function StudyReferences({items}:{items:StudyReference[]}){
  return <div className="study-references"><div><BookOpenText size={18}/><h3>Rujukan materi ini</h3></div><p>Ringkasan ditulis untuk belajar. Pelafalan tetap perlu didengar dan dikoreksi bersama guru.</p><ul>{items.map((item,index)=>{const source=references.find(r=>r.id===item.id);return source?<li key={index}><a href={source.url+(item.page?`#page=${item.page}`:'')} target="_blank" rel="noreferrer"><strong>{source.title}</strong><ArrowUpRight size={16}/></a><span>{source.publisher}</span><small>{item.location}{item.page?` · Mulai halaman PDF ${item.page}`:''}</small></li>:null;})}</ul></div>;
}

export function LessonStudyContent({lessonId}:{lessonId:string}){
  const study=(content as LessonStudy[]).find(s=>s.lessonId===lessonId);
  if(!study)return null;
  const foundation=['pengantar','huruf-hijaiyah','harakat'].includes(lessonId);
  return <div className={`lesson-study ${foundation?'study-foundation':''}`}>
    <section className="study-opening"><span className="section-kicker">{foundation?'MULAI DARI KONSEPNYA':'PENGUATAN KONSEP'}</span><h2>{foundation?'Pahami yang sedang Anda baca.':'Poin penting sebelum evaluasi.'}</h2><p>{study.intro}</p><div className="study-objectives"><div><ListChecks size={19}/><strong>Setelah materi ini, Anda dapat…</strong></div><ul>{study.objectives.map(objective=><li key={objective}><Check size={15}/>{objective}</li>)}</ul></div></section>
    {lessonId==='huruf-hijaiyah'&&<section className="study-alphabet-section"><span className="section-kicker">KENALI IDENTITAS DAN BENTUKNYA</span><h2>Satu huruf, beberapa posisi.</h2><p>Baca kolom dari identitas huruf menuju bentuk sambungnya. Garis pendek hanya memperlihatkan sambungan; bukan tanda vokal.</p><div className="study-table-scroll" tabIndex={0} role="region" aria-label="Tabel huruf hijaiyah dan bentuk sambung, dapat digeser horizontal"><table className="study-alphabet"><caption>28 huruf dasar abjad Arab; hamzah dijelaskan pada bagian berikutnya.</caption><thead><tr><th scope="col">Huruf</th><th scope="col">Nama</th><th scope="col">Awal</th><th scope="col">Tengah</th><th scope="col">Akhir</th><th scope="col">Ke huruf sesudahnya</th></tr></thead><tbody>{alphabet.map(([letter,name,start,middle,end,joins])=><tr key={String(letter)}><th scope="row" lang="ar" dir="rtl">{letter}</th><td>{name}</td><td lang="ar" dir="rtl">{start}</td><td lang="ar" dir="rtl">{middle}</td><td lang="ar" dir="rtl">{end}</td><td>{joins?'Menyambung':'Tidak menyambung'}</td></tr>)}</tbody></table></div><p className="study-small-note">ا د ذ ر ز و tidak menyambung ke huruf berikutnya di sisi kiri. Nama Latin membantu pengenalan, bukan panduan bunyi yang persis. Bentuk huruf dapat sedikit berbeda menurut jenis tulisan.</p></section>}
    <div className="study-concepts">{study.concepts.map((concept,index)=><section className="study-concept" key={concept.id} id={`konsep-${concept.id}`}><span className="study-concept-number">{String(index+1).padStart(2,'0')}</span><div><h2>{concept.title}</h2><p>{concept.explanation}</p>{concept.examples&&<div className="study-examples" aria-label={`Contoh latihan ${concept.title}`}>{concept.examples.map(example=><div key={example.arabic}><strong dir="rtl" lang="ar">{example.arabic}</strong><span>{example.reading}</span><small>{example.note}</small></div>)}</div>}</div></section>)}</div>
    {study.steps&&<section className="study-routine"><span className="section-kicker">URUTAN LATIHAN</span><h2>Coba pelan-pelan, satu langkah dulu.</h2><ol>{study.steps.map((step,index)=><li key={step}><span>{index+1}</span><p>{step}</p></li>)}</ol></section>}
    {study.practice&&<section className="study-guided-practice"><span className="section-kicker">COBA JELASKAN KEMBALI</span><h2>Sudah menangkap perbedaannya?</h2><p>Latihan bersama ini tidak memberi nilai atau menandai materi selesai.</p>{study.practice.map(item=><details key={item.prompt}><summary><Lightbulb size={17}/><span>{item.prompt}</span><ChevronDown size={17}/></summary><p>{item.answer}</p></details>)}</section>}
    <StudyReferences items={study.references}/>
  </div>;
}
