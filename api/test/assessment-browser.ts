import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {INestApplication} from '@nestjs/common';
import {DataSource} from 'typeorm';
import * as argon2 from 'argon2';
import {chromium,expect as baseExpect} from '@playwright/test';
import type {BrowserContext,Page,Request} from '@playwright/test';
import {User} from '../src/modules/users/user.entity';
import {Session} from '../src/modules/auth/auth.entity';
import {passwordOptions} from '../src/modules/auth/auth.service';
import {QuizQuestion,QuizAttempt,QuizAttemptQuestion,MistakeReview} from '../src/modules/quiz/quiz.entity';
import {QuizService} from '../src/modules/quiz/quiz.service';
import {LearningService} from '../src/modules/learning/learning.service';
import {UserLessonProgress} from '../src/modules/learning/learning.entity';
import {QuestionReport} from '../src/modules/quiz/feedback.entity';
const expect=baseExpect.configure({timeout:30000});

// Only called with a run-owned PostgreSQL schema, never the application/public schema.
export async function assessmentBrowserAcceptance(app:INestApplication,db:DataSource,quiz:QuizService,learning:LearningService){
  assert.match(('schema' in db.options?db.options.schema:'') || '',/^phase03_verify_[a-f0-9]{32}$/);
  const root=resolve('../web/out'),site=createServer(async(req,res)=>{
    try{const pathname=new URL(req.url!,'http://localhost').pathname,file=resolve(root,'.'+decodeURIComponent(pathname)+(pathname.endsWith('/')?'index.html':''));
      if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
      const types:Record<string,string>={'.html':'text/html','.txt':'text/plain','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
      res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));
    }catch{res.writeHead(404);res.end();}
  });
  let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;const contexts:BrowserContext[]=[];let stage='bootstrap';
  const password='Fixture-'+randomUUID(),hash=await argon2.hash(password,passwordOptions);
  const user=await db.getRepository(User).save({email:'browser-'+randomUUID()+'@example.test',nickname:'Pelajar Evaluasi',passwordHash:hash,emailVerifiedAt:new Date()});
  const legacyDate=new Date('2026-02-03T00:00:00Z');
  await db.getRepository(UserLessonProgress).save({userId:user.id,lessonId:'harakat',status:'COMPLETED',completedAt:legacyDate,completionSource:'LEGACY_SELF_REPORTED',legacyCompletedAt:legacyDate});
  const settle=async(page:Page)=>page.evaluate(async()=>{window.scrollTo({top:0,behavior:'instant'});await Promise.all(document.getAnimations().filter(a=>a.effect && Number.isFinite(a.effect.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));});
  try{
    await app.listen(4103);await new Promise<void>(done=>site.listen(3103,done));browser=await chromium.launch({channel:'msedge',headless:true});
    const newPage=async(mobile=false)=>{const context=await browser!.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1050},reducedMotion:mobile?'reduce':'no-preference'});contexts.push(context);await context.route('http://localhost:4000/**',route=>route.continue({url:route.request().url().replace('localhost:4000','localhost:4103')}));return context.newPage();};
    const login=async(page:Page,next='/dashboard/')=>{await page.goto('http://localhost:3103/login/?next='+encodeURIComponent(next));await page.getByLabel('Email',{exact:true}).fill(user.email);await page.getByLabel('Kata sandi',{exact:true}).fill(password);await page.getByRole('button',{name:'Masuk',exact:true}).click();await page.waitForURL('http://localhost:3103'+next);};
    const page=await newPage();page.on('dialog',dialog=>dialog.accept());stage='login and legacy dashboard';
    await login(page);
    for(const width of [1024,1280,1440]){await page.setViewportSize({width,height:1050});await expect(page.getByRole('navigation',{name:'Navigasi utama'}).getByRole('link',{name:'Referensi',exact:true})).toBeVisible();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Navigation must fit '+width);}
    await expect(page.getByRole('heading',{name:'Sudah dipelajari, menunggu quiz.'})).toBeVisible();
    await page.getByLabel('Pilih tema warna').click();await page.getByRole('button',{name:/Taman/}).click();
    stage='unavailable lesson';await page.goto('http://localhost:3103/learn/harakat/');await expect(page.getByText('Quiz belum tersedia',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Tandai Selesai'})).toHaveCount(0);
    await page.goto('http://localhost:3103/quiz/?lessonId=harakat');await expect(page.getByRole('heading',{name:'Soal sedang dipersiapkan.'})).toBeVisible();
    await settle(page);await page.screenshot({path:'docs/phase-03/quiz-unavailable-desktop.png',fullPage:true});
    stage='lesson quiz entry';await page.goto('http://localhost:3103/learn/pengantar/');
    let duplicateGets=0;const countGet=(request:Request)=>{if(request.method()==='GET' && /\/api\/v1\/quiz\/attempts\//.test(request.url()))duplicateGets++;};page.on('request',countGet);
    await page.getByRole('link',{name:'Uji Pemahaman',exact:true}).click();await expect(page.getByRole('heading',{name:'Soal 1 dari 7',exact:true})).toBeVisible();assert.equal(duplicateGets,0,'Do not refetch the just-created attempt');page.off('request',countGet);
    const id=()=>new URL(page.url()).searchParams.get('attempt')!;
    const firstId=id(),items=await db.getRepository(QuizAttemptQuestion).find({where:{attemptId:firstId},order:{ordinal:'ASC'}});
    assert.equal(items.length,7);await expect(page.locator('.quiz-choices legend')).toHaveCount(1);await expect(page.locator('.quiz-answer-review')).toHaveCount(0);
    for(let i=0;i<7;i++){
      stage='failed quiz question '+(i+1);
      const item=items[i],option=i<5?item.snapshot.correctAnswer:item.snapshot.options.find(o=>o.id!==item.snapshot.correctAnswer)!.id;
      if(i===0){
        let fail=true;
        await page.route('**/api/v1/quiz/attempts/*/answers',route=>route.request().method()==='OPTIONS'?route.continue({url:route.request().url().replace('localhost:4000','localhost:4103')}):fail?route.fulfill({status:503,headers:{'Access-Control-Allow-Origin':'http://localhost:3103','Access-Control-Allow-Credentials':'true'},json:{message:'Fixture saving unavailable'}}):route.continue({url:route.request().url().replace('localhost:4000','localhost:4103')}));
        await page.locator('input[value="'+option+'"]').check();await expect(page.locator('.assessment-error')).toContainText('Fixture saving unavailable');assert.equal((await quiz.get(user.id,firstId)).questions[0].selectedOptionId,null);fail=false;
      }
      await page.locator('input[value="'+option+'"]').check();await expect(page.getByText('Pilihan tersimpan',{exact:true})).toBeVisible();
      if(i===1){await page.reload();await expect(page.getByRole('heading',{name:'Soal 2 dari 7',exact:true})).toBeVisible();await expect(page.locator('input[value="'+option+'"]').first()).toBeChecked();}
      if(i===2){await settle(page);await page.screenshot({path:'docs/phase-03/quiz-question-desktop.png',fullPage:true});}
      await page.getByRole('button',{name:i===6?'Kirim jawaban':'Berikutnya',exact:true}).click();
    }
    stage='failed quiz result';await expect(page.getByRole('heading',{name:'Pemahaman bertumbuh lewat latihan.'})).toBeVisible();await expect(page.locator('.quiz-answer-review')).toHaveCount(7);assert.equal((await learning.dashboard(user.id)).summary.completedLessons,0);
    const report=async(target:Page,category:string)=>{
      await target.getByRole('button',{name:'Laporkan kesalahan soal',exact:true}).first().click();
      const dialog=target.getByRole('dialog',{name:'Laporkan kesalahan',exact:true});await expect(dialog).toBeVisible();
      await dialog.getByLabel('Keterangan',{exact:false}).fill('Discarded fixture');await target.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
      await target.getByRole('button',{name:'Laporkan kesalahan soal',exact:true}).first().click();await expect(dialog.getByLabel('Keterangan',{exact:false})).toHaveValue('');
      await dialog.getByLabel('Bagian yang perlu diperiksa').selectOption(category);await dialog.getByLabel('Keterangan',{exact:false}).fill('Laporan fixture pengujian; bukan review ilmiah.');
      await dialog.screenshot({path:'docs/phase-03b/feedback-dialog-'+(target===page?'desktop':'mobile')+'.png'});
      if(target===page && category==='QURAN_TEXT_REFERENCE'){
        let fail=true;await target.route('**/api/v1/questions/*/feedback',route=>route.request().method()==='OPTIONS'?route.continue({url:route.request().url().replace('localhost:4000','localhost:4103')}):fail?route.fulfill({status:503,headers:{'Access-Control-Allow-Origin':'http://localhost:3103','Access-Control-Allow-Credentials':'true'},json:{message:'Fixture report temporarily unavailable'}}):route.continue({url:route.request().url().replace('localhost:4000','localhost:4103')}));
        await dialog.getByRole('button',{name:'Kirim laporan',exact:true}).click();await expect(dialog.locator('.assessment-error')).toContainText('Fixture report temporarily unavailable');
        assert.equal(await db.getRepository(QuestionReport).countBy({reporterUserId:user.id}),0);fail=false;
      }
      await dialog.getByRole('button',{name:'Kirim laporan',exact:true}).click();await expect(dialog.getByText('Terima kasih. Laporanmu sudah tersimpan untuk ditinjau.',{exact:true})).toBeVisible();
      await dialog.getByRole('button',{name:'Selesai',exact:true}).click();
    };
    await report(page,'QURAN_TEXT_REFERENCE');assert.equal(await db.getRepository(QuestionReport).countBy({reporterUserId:user.id}),1);assert.equal((await quiz.get(user.id,firstId)).result!.correctCount,5);
    await settle(page);await page.screenshot({path:'docs/phase-03/quiz-failed-desktop.png',fullPage:true});
    stage='retry and pass';await page.getByRole('button',{name:'Coba evaluasi lagi',exact:true}).click();await expect(page.getByRole('heading',{name:'Soal 1 dari 7',exact:true})).toBeVisible();
    const retryId=id();assert.notEqual(retryId,firstId);const fresh=await db.getRepository(QuizAttemptQuestion).find({where:{attemptId:retryId},order:{ordinal:'ASC'}});assert.ok(fresh.every(q=>!items.some(old=>old.questionId===q.questionId)));
    for(let i=0;i<7;i++){const item=fresh[i],option=i<6?item.snapshot.correctAnswer:item.snapshot.options.find(o=>o.id!==item.snapshot.correctAnswer)!.id;await page.locator('input[value="'+option+'"]').check();await expect(page.getByText('Pilihan tersimpan',{exact:true})).toBeVisible();await page.getByRole('button',{name:i===6?'Kirim jawaban':'Berikutnya',exact:true}).click();}
    await expect(page.getByRole('heading',{name:'Bagus! Evaluasi materi ini selesai.'})).toBeVisible();assert.equal((await learning.dashboard(user.id)).summary.completedLessons,1);
    await settle(page);await page.screenshot({path:'docs/phase-03/quiz-passed-desktop.png',fullPage:true});
    stage='cross-device mobile';const second=await newPage(true);second.on('dialog',dialog=>dialog.accept());await login(second,'/quiz/?attempt='+retryId);await expect(second.getByRole('heading',{name:'Bagus! Evaluasi materi ini selesai.'})).toBeVisible();assert.equal(await second.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await settle(second);await second.screenshot({path:'docs/phase-03/quiz-passed-mobile.png',fullPage:true});
    const mobileAttempt=await quiz.create(user.id,'pengantar');await second.goto('http://localhost:3103/quiz/?attempt='+mobileAttempt.id);await expect(second.getByRole('heading',{name:'Soal 1 dari 7',exact:true})).toBeVisible();
    assert.equal(await second.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await settle(second);await second.screenshot({path:'docs/phase-03/quiz-question-mobile.png',fullPage:true});
    stage='mistake replay';await page.goto('http://localhost:3103/reviews/');await expect(page.getByRole('heading',{name:'Pemahaman layak diulang.'})).toBeVisible();await expect(page.locator('.replay-item')).not.toHaveCount(0);
    await page.getByRole('button',{name:'Latih kembali',exact:true}).first().click();await expect(page.getByRole('heading',{name:'Soal 1 dari 1',exact:true})).toBeVisible();
    const replayId=id(),replay=await db.getRepository(QuizAttemptQuestion).findOneByOrFail({attemptId:replayId});await page.locator('input[value="'+replay.snapshot.correctAnswer+'"]').check();await expect(page.getByText('Pilihan tersimpan',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Kirim jawaban',exact:true}).click();await expect(page.getByRole('heading',{name:'Konsep berhasil dilatih kembali.'})).toBeVisible();
    await report(page,'INACCURATE_EXPLANATION');assert.equal(await db.getRepository(QuestionReport).countBy({reporterUserId:user.id}),2);
    assert.equal((await quiz.get(user.id,firstId)).result!.correctCount,5);assert.equal((await learning.dashboard(user.id)).summary.completedLessons,1);
    await page.goto('http://localhost:3103/dashboard/');await expect(page.locator('.dashboard-metrics')).toContainText('Lulus evaluasi');await settle(page);await page.screenshot({path:'docs/phase-03/dashboard-verified-legacy.png',fullPage:true});
    stage='guest detective';const guest=await newPage(true);await guest.goto('http://localhost:3103/detective/');
    await guest.getByRole('button',{name:'Buka menu',exact:true}).click();await guest.getByRole('navigation',{name:'Navigasi seluler'}).getByRole('link',{name:'Referensi',exact:true}).click();await expect(guest.getByRole('heading',{name:'Sumber, metode, dan batasannya.',exact:true})).toBeVisible();await guest.goto('http://localhost:3103/detective/');await expect(guest.getByText(/Anda berlatih sebagai tamu/)).toBeVisible();await expect(guest.locator('.quiz-verse mark')).toBeVisible();
    const before=await Promise.all([QuizAttempt,QuizAttemptQuestion,MistakeReview,UserLessonProgress,User,Session].map(e=>db.getRepository(e).count()));
    await guest.locator('.quiz-option input').first().focus();await guest.keyboard.press('Space');await guest.getByRole('button',{name:'Periksa jawaban',exact:true}).click();await expect(guest.getByText('Latihan selesai · hasil tamu tidak disimpan',{exact:true})).toBeVisible();
    await expect(guest.locator('.quiz-answer-review h3')).toBeFocused();
    assert.deepEqual(await Promise.all([QuizAttempt,QuizAttemptQuestion,MistakeReview,UserLessonProgress,User,Session].map(e=>db.getRepository(e).count())),before);
    await report(guest,'HIGHLIGHT_MISMATCH');assert.ok(await db.getRepository(QuestionReport).countBy({category:'HIGHLIGHT_MISMATCH'}));
    assert.equal(await guest.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await settle(guest);await guest.screenshot({path:'docs/phase-03/detective-guest-mobile.png',fullPage:true});
    // Persisted authenticated wrong answer creates a review without changing completion.
    stage='authenticated detective';await page.goto('http://localhost:3103/detective/');await expect(page.locator('.quiz-option')).toHaveCount(4);await page.locator('.quiz-option input').first().check();await page.getByRole('button',{name:'Periksa jawaban',exact:true}).click();await expect(page.getByText('Hasil latihan tersimpan',{exact:true})).toBeVisible();
    console.log('PASS Phase 03B browser: Referensi visible at 1024/1280/1440, quiz/Replay/guest report dialogs and PostgreSQL persistence; original score unchanged');
    // Session expiry is a visible error and never an optimistic completion.
    stage='session expiry';const expired=await quiz.create(user.id,'pengantar');await page.goto('http://localhost:3103/quiz/?attempt='+expired.id);await expect(page.getByRole('heading',{name:'Soal 1 dari 7',exact:true})).toBeVisible();await db.getRepository(Session).delete({userId:user.id});await page.locator('.quiz-option input').first().check();await page.waitForURL('**/login/**');
    assert.equal((await quiz.get(user.id,expired.id)).status,'IN_PROGRESS');
    console.log('PASS browser: unavailable, 7-question fail/retry/pass, refresh, cross-device, Replay, legacy dashboard, guest no writes, keyboard, reduced motion, mobile, expired session');
  }catch(error){
    console.error('Browser stage: '+stage+'\n'+String((error as Error).message).replaceAll(password,'[fixture password]').replaceAll(user.email,'[fixture email]').slice(0,4500));
    if(contexts[0]?.pages()[0]){const failed=contexts[0].pages()[0];console.error('Visible UI: '+(await failed.locator('body').innerText()).replaceAll(password,'[fixture password]').replaceAll(user.email,'[fixture email]').slice(0,3500));await failed.screenshot({path:'docs/phase-03/browser-failure.png',fullPage:true});}
    throw error;
  }
  finally{for(const context of contexts)await context.close();if(browser)await browser.close();await new Promise<void>(done=>site.close(()=>done()));}
}
