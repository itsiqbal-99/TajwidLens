import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {lessons} from '../../web/src/data/lessons';
import {QuizCorpus,sha256} from '../src/modules/quiz/corpus';
import type {GenerationSources,GenerationRule,LessonRuleMap,ComprehensionCase} from '../src/modules/quiz/generation';
import type {LessonStudy,LearningReference} from '../../shared/learning-content';
import {questionHash} from '../src/modules/quiz/question-bank.service';
import type {QuestionContent} from '../src/modules/quiz/question.types';

export function validateQuestionManifest(manifest:unknown,questions:readonly QuestionContent[],sourceVersion:string){
  const value=manifest as {sourceVersion?:string;questionHashes?:unknown}|null;
  if(!value||value.sourceVersion!==sourceVersion||!Array.isArray(value.questionHashes)||JSON.stringify(value.questionHashes)!==JSON.stringify(questions.map(questionHash).sort()))throw new Error('Candidate/manifest mismatch; regenerate and review the source pack first');
}

export function loadQuestionSources():GenerationSources {
  const root=resolve(__dirname,'../..');
  const paths=['web/src/data/lessons.ts','web/src/data/tajwid-rules.ts','shared/lesson-catalog.json','web/src/data/tajweed-rules-generated.json',
    'web/src/data/tajweed-index.json','web/sources/quran-ws-v0.4.3/rules.json','web/sources/quran-ws-v0.4.3/annotations.json','api/content/lesson-rule-map.json',
    'api/src/modules/quiz/generation.ts','api/content/comprehension-cases.json','shared/learning-content.json','shared/learning-references.json','shared/hijaiyah.json'];
  const files=Object.fromEntries(paths.map(path=>[path,sha256(readFileSync(resolve(root,path)))]));
  const json=(path:string)=>JSON.parse(readFileSync(resolve(root,path),'utf8'));
  const raw=json('web/sources/quran-ws-v0.4.3/rules.json'),index=json('web/src/data/tajweed-index.json');
  return {lessons,rules:json('web/src/data/tajweed-rules-generated.json') as Record<string,GenerationRule>,rawRules:raw.rules,
    mapping:json('api/content/lesson-rule-map.json') as LessonRuleMap[],sourceVersion:sha256(JSON.stringify(files)),files,corpus:new QuizCorpus(),commit:index.source.commit,
    cases:json('api/content/comprehension-cases.json') as Record<string,ComprehensionCase[]>,studies:json('shared/learning-content.json') as LessonStudy[],references:json('shared/learning-references.json') as LearningReference[]};
}
