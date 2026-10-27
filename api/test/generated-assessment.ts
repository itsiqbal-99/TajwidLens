import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {DataSource} from 'typeorm';
import {chromium,expect as baseExpect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {loadQuestionSources,validateQuestionManifest} from '../scripts/question-sources';
import {validateGenerated} from '../src/modules/quiz/generation';
import {loadSourceApprovals} from '../src/modules/quiz/quiz.module';
import {QuestionBankService,questionHash} from '../src/modules/quiz/question-bank.service';
import {QuestionContent,RepositorySourceApproval} from '../src/modules/quiz/question.types';
import {QuizService} from '../src/modules/quiz/quiz.service';
import {DetectiveService} from '../src/modules/quiz/detective.service';
import {QuizQuestion,QuizAttempt,QuizAttemptQuestion} from '../src/modules/quiz/quiz.entity';
import {User} from '../src/modules/users/user.entity';
import {Session} from '../src/modules/auth/auth.entity';
import {digest,secret} from '../src/modules/auth/auth.service';
import {QuestionReport} from '../src/modules/quiz/feedback.entity';
import {lessonCatalog} from '../src/modules/learning/catalog';
import {readConfig} from '../src/config/config';
import {assessmentApp} from './assessment-fixtures';
const expect=baseExpect.configure({timeout:30000});

// Real source content and real owner authorization, only in the run-owned disposable schema.
export async function verifyGeneratedAssessments(db:DataSource,config:ReturnType<typeof readConfig>,browserCheck:boolean){
  assert.match(('schema' in db.options?db.options.schema:'')||'',/^phase03_verify_[a-f0-9]{32}$/);
  const source=loadQuestionSources(),questions:QuestionContent[]=JSON.parse(readFileSync('content/generated-candidates.json','utf8'));
  validateQuestionManifest(JSON.parse(readFileSync('content/generated-manifest.json','utf8')),questions,source.sourceVersion);
  const approvals=loadSourceApprovals();let approval=approvals.find(a=>'kind' in a&&a.sourceVersion===source.sourceVersion);
  if(!approval&&process.argv.includes('--fixture-approval')){
    const fixture:RepositorySourceApproval={kind:'REPOSITORY_DETERMINISTIC',environment:'development',id:'isolated-test-authorization',sourceVersion:source.sourceVersion,
      files:source.files,questionHashes:questions.map(questionHash),authorizedAt:new Date(Date.now()-1000).toISOString(),authorization:'Synthetic isolated test only; not project-owner authorization',evidence:'Temporary schema test of the existing publication gate; not scientific or live approval'};
    approvals.push(fixture);approval=fixture;
  }
  assert.ok(approval,'Real source authorization required, or explicit --fixture-approval on this disposable schema');assert.equal(questions.length,316);
  const testConfig={...config,frontend:'http://localhost:3103',origin:'http://localhost:3103',api:'http://localhost:4103'};
  const {app,module}=await assessmentApp(db,testConfig,approvals),bank=module.get(QuestionBankService),quiz=module.get(QuizService),detective=module.get(DetectiveService);
  try{
    assert.ok(validateGenerated(questions,source,bank).every(v=>v.passed));
    await bank.import(questions);await bank.publish(questions.map(q=>q.id),approval.id);
    const before=await db.getRepository(QuizQuestion).find({order:{id:'ASC'}});await bank.import(questions);
    assert.deepEqual(await db.getRepository(QuizQuestion).find({order:{id:'ASC'}}),before);
    assert.ok(before.every(q=>q.review===null&&bank.repositoryVerified(q)&&!bank.sourceVerified(q)));
    const availability=await Promise.all(lessonCatalog.map(l=>quiz.availability(l.id)));
    assert.ok(availability.every(a=>a.available&&a.eligibleCount>=8));
    assert.equal((await bank.eligible()).length,316);
    const user=await db.getRepository(User).save({email:'generated-'+randomUUID()+'@example.test',nickname:'Pelajar Pengujian',emailVerifiedAt:new Date()});
    for(const lessonId of ['qalqalah','ikhfa-haqiqi']){
      const attempt=await quiz.create(user.id,lessonId);assert.equal(attempt.questions.length,7);
      assert.equal(new Set(attempt.questions.map(q=>q.type)).size,lessonId==='qalqalah'?1:2);
      assert.doesNotMatch(JSON.stringify(attempt),/correctAnswer|correctOptionId|explanation|sourceApprovalId|contentHash|ruleId/);
      const items=await db.getRepository(QuizAttemptQuestion).find({where:{attemptId:attempt.id},order:{ordinal:'ASC'}});
      const result=await quiz.submit(user.id,attempt.id,items.map((q,i)=>({questionId:q.id,optionId:i<6?q.snapshot.correctAnswer:q.snapshot.options.find(o=>o.id!==q.snapshot.correctAnswer)!.id})));
      assert.equal(result.result!.correctCount,6);assert.equal(result.result!.completionVerified,true);
      assert.ok(result.result!.feedback.every(q=>q.validation==='AUTOMATED_SOURCE'));
    }
    const challenge=(await detective.next(null)).challenge!,question=await db.getRepository(QuizQuestion).findOneByOrFail({id:challenge.question.id});
    const attemptCount=await db.getRepository(QuizAttempt).count();
    const answer=await detective.answer(null,challenge.token,question.correctAnswer);assert.equal(answer.feedback.correct,true);assert.equal(answer.saved,false);
    assert.equal(await db.getRepository(QuizAttempt).count(),attemptCount);
    const held=questions.find(q=>q.quran)!,row=await db.getRepository(QuizQuestion).findOneByOrFail({id:held.id});
    const hash=questionHash(row);
    await db.getRepository(QuizQuestion).update(row.id,{suspended:true,moderation:{at:new Date().toISOString(),by:'isolated-generation-test',reason:'Strict quarantine test'}});
    await assert.rejects(()=>bank.publish(questions.map(q=>q.id),approval.id),/karantina/);
    await bank.import(questions);assert.ok(!(await bank.eligible()).some(q=>q.id===row.id));
    assert.equal(questionHash(await db.getRepository(QuizQuestion).findOneByOrFail({id:row.id})),hash);
    console.log('PASS actual-source bank: 316 exact versions, 24/24 available, theory/mixed contracts, 6/7 completion, guest Detective, immutable import and strict quarantine; authorization '+(process.argv.includes('--fixture-approval')?'TEST FIXTURE ONLY':'REAL OWNER RECORD'));
    if(browserCheck)await generatedBrowser(app,db,quiz,user.id);
  }finally{await app.close();}
}

async function generatedBrowser(app:Awaited<ReturnType<typeof assessmentApp>>['app'],db:DataSource,quiz:QuizService,userId:string){
  const capture=async(page:Page,path:string)=>{
    await page.evaluate(async()=>{window.scrollTo({top:0,behavior:'instant'});await document.fonts.ready;
      await Promise.all(document.getAnimations().filter(a=>a.effect&&Number.isFinite(a.effect.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));});
    await page.screenshot({path,fullPage:true});
  };
  const root=resolve('../web/out'),site=createServer(async(req,res)=>{
    try{const path=new URL(req.url!,'http://localhost').pathname,file=resolve(root,'.'+decodeURIComponent(path)+(path.endsWith('/')?'index.html':''));
      if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
      const types:Record<string,string>={'.html':'text/html','.txt':'text/plain','.css':'text/css','.js':'text/javascript','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
      res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));
    }catch{res.writeHead(404);res.end();}
  });
  const token=secret();await db.getRepository(Session).save({hash:digest(token),userId,expiresAt:new Date(Date.now()+600000)});
  await app.listen(4103);await new Promise<void>(done=>site.listen(3103,done));
  const browser=await chromium.launch({channel:'msedge',headless:true});
  let stage='browser setup';
  let activePage:Page|undefined;
  const failedResponses:string[]=[];
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1050}});
    await context.route('http://localhost:4000/**',route=>route.continue({url:route.request().url().replace('localhost:4000','localhost:4103')}));
    await context.addCookies([{name:'tajwidlens',value:token,url:'http://localhost:3103',httpOnly:true,sameSite:'Lax'}]);
    const page=await context.newPage();activePage=page;page.on('dialog',d=>d.accept());
    stage='lesson entry';
    await page.goto('http://localhost:3103/learn/harakat/');await page.getByRole('link',{name:'Uji Pemahaman',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Soal 1 dari 7',exact:true})).toBeVisible();
    const id=new URL(page.url()).searchParams.get('attempt')!,items=await db.getRepository(QuizAttemptQuestion).find({where:{attemptId:id},order:{ordinal:'ASC'}});
    for(let i=0;i<7;i++){
      stage='question '+(i+1);
      await expect(page.getByRole('heading',{name:`Soal ${i+1} dari 7`,exact:true})).toBeVisible();
      if(i===0){await capture(page,'docs/phase-03b/generated-quiz-desktop.png');await page.setViewportSize({width:390,height:844});}
      if(i===2){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await capture(page,'docs/phase-03b/generated-quiz-mobile.png');}
      const item=items[i],option=i<6?item.snapshot.correctAnswer:item.snapshot.options.find(o=>o.id!==item.snapshot.correctAnswer)!.id;
      await page.locator(`input[value="${option}"]`).check();await expect(page.getByText('Pilihan tersimpan',{exact:true})).toBeVisible();
      await page.getByRole('button',{name:i===6?'Kirim jawaban':'Berikutnya',exact:true}).click();
    }
    stage='completion';await expect(page.getByRole('heading',{name:'Bagus! Evaluasi materi ini selesai.',exact:true})).toBeVisible();
    await expect(page.getByText('Validasi otomatis dari materi dan anotasi aplikasi · belum review ahli tajwid.',{exact:true})).toHaveCount(7);
    assert.equal((await quiz.get(userId,id)).result!.completionVerified,true);
    stage='guest Detective';const guest=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
    await guest.route('http://localhost:4000/**',route=>route.continue({url:route.request().url().replace('localhost:4000','localhost:4103')}));
    const detective=await guest.newPage();activePage=detective;
    detective.on('response',response=>{if(response.status()>=400&&response.status()!==401)failedResponses.push(response.status()+' '+new URL(response.url()).pathname);});
    detective.on('pageerror',error=>failedResponses.push('pageerror '+error.message.slice(0,150)));
    stage='guest question loading';await detective.goto('http://localhost:3103/detective/');await expect(detective.locator('.quiz-verse mark')).toBeVisible();
    const questionId=(await detective.locator('.quiz-choices input').first().getAttribute('name'))!.slice('question-'.length);
    const question=await db.getRepository(QuizQuestion).findOneByOrFail({id:questionId});
    assert.ok(await detective.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    stage='guest capture';await capture(detective,'docs/phase-03b/generated-detective-mobile.png');
    stage='guest answer';
    await detective.locator(`input[value="${question.correctAnswer}"]`).check();await detective.getByRole('button',{name:'Periksa jawaban',exact:true}).click();
    await expect(detective.getByText('Latihan selesai · hasil tamu tidak disimpan',{exact:true})).toBeVisible();
    stage='guest report';await detective.getByRole('button',{name:'Laporkan kesalahan soal',exact:true}).click();
    await detective.getByRole('dialog').locator('select').selectOption('INACCURATE_EXPLANATION');
    await detective.getByRole('button',{name:'Kirim laporan',exact:true}).click();
    await expect(detective.getByRole('dialog')).toContainText('Terima kasih. Laporanmu sudah tersimpan untuk ditinjau.');
    const reports=await db.getRepository(QuestionReport).findBy({questionId});assert.equal(reports.length,1);assert.equal(reports[0].reporterUserId,null);
    console.log('PASS browser actual generated content: lesson entry, 7 questions, source disclaimer, desktop/mobile, 6/7 persisted, guest annotated Detective and report');
  }catch(error){
    console.error('Generated browser stage '+stage+': '+(error instanceof Error?error.message.split('\n').slice(0,8).join(' ').slice(0,600):'Unknown error'));
    console.error('Response diagnostics: '+JSON.stringify(failedResponses));
    if(activePage){await activePage.screenshot({path:'docs/phase-03b/generated-browser-failure.png',fullPage:true});console.error('Visible error: '+(await activePage.locator('[role="alert"],.assessment-empty').allTextContents()).join(' ').slice(0,500));}
    throw error;
  }
  finally{await browser.close();await new Promise<void>((done,reject)=>site.close(error=>error?reject(error):done()));}
}
