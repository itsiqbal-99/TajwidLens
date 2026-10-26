import {Injectable} from '@nestjs/common';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import type {QuestionVerse} from '../../../../shared/quiz';
import type {QuranReference} from './question.types';

interface CorpusIndex {
  source:{corpusVersion:string;displayEdition:string;displayEditionSha256:string};
  files:{surah:number;file:string;sha256:string;bytes:number}[];
}
interface CorpusVerse {number:number;text:string;annotations:{id:string;ruleId:string;start:number;end:number;quote:string}[]}
export const sha256=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');

export function graphemeRange(text:string,start:number,end:number) {
  if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||start>=end||end>text.length)return false;
  const boundaries=new Set([0,text.length]);
  for(const segment of new Intl.Segmenter('ar',{granularity:'grapheme'}).segment(text))boundaries.add(segment.index);
  return boundaries.has(start)&&boundaries.has(end);
}

@Injectable()
export class QuizCorpus {
  private index:CorpusIndex|null=null;
  private surahs=new Map<number,CorpusVerse[]>();
  // Read-only data assets, never frontend implementation code or a separately generated Arabic text.
  private indexPath=process.env.QUIZ_CORPUS_INDEX || resolve(__dirname,'../../../../web/src/data/tajweed-index.json');
  private dataPath=process.env.QUIZ_CORPUS_DIRECTORY || resolve(__dirname,'../../../../web/public/data/tajweed');
  metadata() {
    this.index??=JSON.parse(readFileSync(this.indexPath,'utf8')) as CorpusIndex;
    if(!this.index.source?.displayEditionSha256 || !Array.isArray(this.index.files))throw new Error('Corpus index is invalid');
    return this.index;
  }
  verse(surah:number,ayah:number):CorpusVerse {
    const index=this.metadata();
    if(!Number.isInteger(surah)||!Number.isInteger(ayah)||ayah<1)throw new Error('Invalid Quran reference');
    if(!this.surahs.has(surah)){
      const file=index.files.find(entry=>entry.surah===surah);
      if(!file || file.file!==`${surah}.json`)throw new Error('Surah is not in the corpus manifest');
      const bytes=readFileSync(resolve(this.dataPath,file.file));
      if(bytes.length!==file.bytes || sha256(bytes)!==file.sha256)throw new Error('Corpus payload integrity failed');
      const payload=JSON.parse(bytes.toString('utf8')) as {surah:{number:number};verses:CorpusVerse[]};
      if(payload.surah.number!==surah || !Array.isArray(payload.verses))throw new Error('Corpus payload reference failed');
      this.surahs.set(surah,payload.verses);
    }
    const verse=this.surahs.get(surah)!.find(verse=>verse.number===ayah);
    if(!verse)throw new Error('Ayah is not in the corpus');
    return verse;
  }
  verses(surah:number):readonly CorpusVerse[] {this.verse(surah,1);return this.surahs.get(surah)!;}
  resolve(reference:QuranReference):QuestionVerse {
    const index=this.metadata(),verse=this.verse(reference.surah,reference.ayah);
    if(reference.offsetUnit!=='utf16' || reference.corpusVersion!==index.source.corpusVersion
      || reference.editionSha256!==index.source.displayEditionSha256 || reference.verseSha256!==sha256(verse.text))throw new Error('Question corpus version/hash does not match');
    if(!graphemeRange(verse.text,reference.start,reference.end))throw new Error('Highlight splits an Arabic grapheme or is outside the verse');
    const annotation=verse.annotations.find(item=>item.id===reference.annotationId);
    if(!annotation || annotation.ruleId!==reference.ruleId || verse.text.slice(annotation.start,annotation.end)!==annotation.quote
      || reference.start>annotation.start || reference.end<annotation.end)throw new Error('Highlight does not contain its referenced annotation');
    return {surah:reference.surah,ayah:reference.ayah,text:verse.text,start:reference.start,end:reference.end,
      offsetUnit:'utf16',edition:index.source.displayEdition};
  }
}
