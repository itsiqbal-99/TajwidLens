import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {INestApplication} from '@nestjs/common';
import {DataSource} from 'typeorm';
import * as argon2 from 'argon2';
import {chromium,expect} from '@playwright/test';
import type {BrowserContext,Page} from '@playwright/test';
import {User} from '../src/modules/users/user.entity';
import {Session} from '../src/modules/auth/auth.entity';
import {passwordOptions} from '../src/modules/auth/auth.service';
import {UserLessonProgress} from '../src/modules/learning/learning.entity';
import {LearningService} from '../src/modules/learning/learning.service';
import {lessonCatalog} from '../src/modules/learning/catalog';

export async function learningBrowserAcceptance(app:INestApplication,db:DataSource,service:LearningService,evidence:string) {
  const settleMotion=(page:Page)=>page.evaluate(async()=>{
    await Promise.all(document.getAnimations().filter(animation=>animation.effect && Number.isFinite(animation.effect.getComputedTiming().endTime)).map(animation=>animation.finished.catch(()=>{})));
  });
  const run=randomUUID(),password=`Learning-${randomUUID()}`;
  const owned:User[]=[];
  const responseHeaders={'Access-Control-Allow-Origin':'http://localhost:3102','Access-Control-Allow-Credentials':'true'};
  const root=resolve('../web/out');
  const site=createServer(async(req,res)=>{
    try {
      const pathname=new URL(req.url!,'http://localhost').pathname;
      const file=resolve(root,'.'+decodeURIComponent(pathname)+(pathname.endsWith('/')?'index.html':''));
      if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
      const types:Record<string,string>={'.html':'text/html','.txt':'text/plain','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
      res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));
    } catch {res.writeHead(404);res.end();}
  });
  let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
  const contexts:BrowserContext[]=[];
  try {
    const hash=await argon2.hash(password,passwordOptions);
    for(const suffix of ['a','b']) owned.push(await db.getRepository(User).save({email:`phase02-${run}-${suffix}@example.com`,nickname:suffix==='a'?'Pelajar Phase 02':'Pelajar Kedua',passwordHash:hash,emailVerifiedAt:new Date()}));
    await app.listen(4102);await new Promise<void>(done=>site.listen(3102,done));
    browser=await chromium.launch({channel:'msedge',headless:true});
    const newPage=async()=>{
      const context=await browser!.newContext({viewport:{width:1440,height:1000}});contexts.push(context);
      await context.route('http://localhost:4000/**',route=>route.continue({url:route.request().url().replace('localhost:4000','localhost:4102')}));
      return context.newPage();
    };
    const login=async(page:Page,user:User,next='')=>{
      await page.goto('http://localhost:3102/login/'+next);
      await page.getByLabel('Email',{exact:true}).fill(user.email);await page.getByLabel('Kata sandi',{exact:true}).fill(password);
      await page.getByRole('button',{name:'Masuk',exact:true}).click();
    };
    const first=await newPage();await login(first,owned[0]);await first.waitForURL('**/dashboard/');
    await expect(first.getByText('0 dari 24 materi selesai',{exact:true})).toBeVisible();
    await expect(first.getByRole('link',{name:'Mulai belajar',exact:true})).toBeVisible();
    await first.getByLabel('Pilih tema warna').click();await first.getByRole('button',{name:/Taman/}).click();
    await expect(first.locator('html')).toHaveAttribute('data-theme','taman');
    await settleMotion(first);await first.screenshot({path:`docs/phase-02/${evidence}-dashboard-new.png`,fullPage:true});
    await first.getByRole('link',{name:'Mulai belajar',exact:true}).click();await first.waitForURL('**/learn/pengantar/');
    await expect(first.getByText('Sedang dipelajari',{exact:true})).toBeVisible();
    assert.equal((await service.dashboard(owned[0].id)).summary.completedLessons,0,'Opening never completes');
    let failComplete=true;
    await first.route('http://localhost:4000/api/v1/learning/progress/pengantar/complete',route=>route.request().method()==='OPTIONS'?route.continue({url:'http://localhost:4102/api/v1/learning/progress/pengantar/complete'}):failComplete?route.fulfill({status:503,headers:responseHeaders,json:{message:'Unavailable'}}):route.continue({url:'http://localhost:4102/api/v1/learning/progress/pengantar/complete'}));
    await first.getByRole('button',{name:'Tandai Selesai',exact:true}).click();
    await expect(first.locator('.learning-inline-error')).toContainText('Progres belum berhasil dikonfirmasi');
    assert.equal((await service.dashboard(owned[0].id)).summary.completedLessons,0,'Failed request never claims success');
    failComplete=false;
    await first.getByRole('button',{name:'Tandai Selesai',exact:true}).click();
    await expect(first.getByText('Ditandai selesai',{exact:true})).toBeVisible();
    const complete=await service.detail(owned[0].id,'pengantar');
    await first.reload();await expect(first.getByText('Ditandai selesai',{exact:true})).toBeVisible();
    await expect(first.getByRole('button',{name:'Tandai Selesai',exact:true})).toHaveCount(0);
    await service.update(owned[0].id,'pengantar','COMPLETED');assert.equal((await service.detail(owned[0].id,'pengantar')).completedAt,complete.completedAt);
    assert.equal(await db.getRepository(UserLessonProgress).countBy({userId:owned[0].id,lessonId:'pengantar'}),1);
    await first.getByRole('link',{name:'Kembali ke dashboard',exact:true}).click();
    await expect(first.getByText('1 dari 24 materi selesai',{exact:true})).toBeVisible();
    await expect(first.locator('.dashboard-module-map a')).toHaveCount(24);
    await expect(first.getByRole('link',{name:'1. Pengantar ilmu tajwid — Selesai',exact:true})).toBeVisible();
    await expect(first.locator('.dashboard-topic-list > div').filter({hasText:'Dasar'}).locator('strong')).toHaveText('1/3');
    await first.getByRole('link',{name:'Jelajahi materi',exact:true}).click();
    await expect(first.locator('.lesson-row[href="/learn/pengantar/"] .lesson-status-badge')).toHaveText('Selesai');
    await expect(first.locator('.lesson-row[href="/learn/huruf-hijaiyah/"] .lesson-status-badge')).toHaveText('Belum mulai');
    await expect(first.locator('.learning-path .path-lesson-completed').first()).toContainText('Selesai');
    await first.locator('.lesson-row').first().scrollIntoViewIfNeeded();
    await settleMotion(first);await first.screenshot({path:`docs/phase-02/${evidence}-library-status.png`,fullPage:false});
    await first.getByRole('link',{name:'Ruang Belajar',exact:true}).click();
    await expect(first.getByText('1 dari 24 materi selesai',{exact:true})).toBeVisible();
    await expect(first.getByRole('link',{name:'Lanjutkan belajar',exact:true})).toHaveAttribute('href','/learn/huruf-hijaiyah/');
    for(const width of [1440,1024,768,390,320]) {
      await first.setViewportSize({width,height:900});
      assert.equal(await first.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Dashboard overflow at ${width}`);
      if(width===1440||width===390) {await settleMotion(first);await first.screenshot({path:`docs/phase-02/${evidence}-dashboard-${width===1440?'desktop':'mobile'}.png`,fullPage:true});}
    }
    await first.emulateMedia({reducedMotion:'reduce'});assert.equal(await first.locator('.dashboard-continue').evaluate(el=>getComputedStyle(el).animationName),'none');
    await first.getByLabel('Pilih tema warna').click();await first.getByRole('button',{name:/Zamrud/}).click();
    await first.screenshot({path:`docs/phase-02/${evidence}-dashboard-theme.png`,fullPage:true});
    await first.getByRole('link',{name:'Profil',exact:true}).click();
    await first.route('http://localhost:4000/api/v1/auth/logout',route=>route.request().method()==='OPTIONS'?route.continue({url:'http://localhost:4102/api/v1/auth/logout'}):route.fulfill({status:503,headers:responseHeaders,json:{message:'Logout belum berhasil. Coba lagi.'}}));
    await first.getByRole('button',{name:'Keluar dari akun'}).click();await expect(first.getByRole('alert').filter({hasText:'Logout belum berhasil. Coba lagi.'})).toBeVisible();
    await expect(first).toHaveURL('http://localhost:3102/profile/');
    await first.unroute('http://localhost:4000/api/v1/auth/logout');
    await first.evaluate(()=>Reflect.set(window,'phase02LogoutMarker','same-document'));
    const logoutStarted=Date.now();
    await first.getByRole('button',{name:'Keluar dari akun'}).click();await first.waitForURL('**/login/');
    assert.equal(await first.evaluate(()=>Reflect.get(window,'phase02LogoutMarker')),'same-document','Logout must not reload the entire application');
    console.log(`Fixture logout navigation: ${Date.now()-logoutStarted}ms; server-confirmed, no document reload`);
    const second=await newPage();await login(second,owned[0]);await second.waitForURL('**/dashboard/');
    await expect(second.getByText('1 dari 24 materi selesai',{exact:true})).toBeVisible();
    let releaseStatus!:()=>void,statusHeld=false,statusHandled=false;
    const statusGate=new Promise<void>(done=>{releaseStatus=done;});
    await second.route('http://localhost:4000/api/v1/auth/status',async route=>{statusHeld=true;await statusGate;await route.fulfill({headers:responseHeaders,json:{google:false,emailRegistration:true,emailDelivery:false,developmentRegistration:true}});statusHandled=true;});
    try {
      await second.reload();await expect.poll(()=>statusHeld).toBe(true);
      await expect(second.getByText('1 dari 24 materi selesai',{exact:true})).toBeVisible({timeout:4000});
    } finally {releaseStatus();await expect.poll(()=>statusHandled).toBe(true);await second.unroute('http://localhost:4000/api/v1/auth/status');}
    const other=await newPage();await login(other,owned[1],'?next=/learn/ikhfa-haqiqi/');await other.waitForURL('**/learn/ikhfa-haqiqi/');
    await expect(other.getByText('Sedang dipelajari',{exact:true})).toBeVisible();
    // A late completion response belongs to its lesson, even after client-side navigation.
    let releaseCompletion!:()=>void;
    let completionReceived=false,completionHandled=false;
    const completionGate=new Promise<void>(done=>{releaseCompletion=done;});
    const delayedUrl='http://localhost:4000/api/v1/learning/progress/ikhfa-haqiqi/complete';
    await other.route(delayedUrl,async route=>{
      if(route.request().method()==='OPTIONS') {await route.continue({url:delayedUrl.replace('4000','4102')});return;}
      completionReceived=true;
      await completionGate;await route.fulfill({status:503,headers:responseHeaders,json:{message:'Unavailable'}});completionHandled=true;
    });
    try {
      await other.getByRole('button',{name:'Tandai Selesai',exact:true}).click();
      await expect(other.getByRole('button',{name:'Menyimpan…',exact:true})).toBeDisabled();
      await expect.poll(()=>completionReceived).toBe(true);
      await other.locator('.learning-order a[href="/learn/izhar-halqi/"]').click();await other.waitForURL('**/learn/izhar-halqi/');
      await expect(other.getByText('Sedang dipelajari',{exact:true})).toBeVisible();
      // Navigation may cancel the old fetch; wait for our handler, not a cancelled browser response.
      releaseCompletion();await expect.poll(()=>completionHandled).toBe(true);
      await other.evaluate(()=>new Promise<void>(done=>requestAnimationFrame(()=>requestAnimationFrame(()=>done()))));
      await expect(other.locator('.learning-inline-error')).toHaveCount(0);
      await expect(other.getByRole('button',{name:'Tandai Selesai',exact:true})).toBeEnabled();
    } finally {releaseCompletion();await other.unroute(delayedUrl);}
    await other.getByRole('link',{name:'Kembali ke dashboard',exact:true}).click();await expect(other.getByText('0 dari 24 materi selesai',{exact:true})).toBeVisible();
    assert.equal((await service.detail(owned[1].id,'pengantar')).status,'NOT_STARTED');
    const guest=await newPage();let guestMutations=0;
    guest.on('request',req=>{if(req.url().includes('/learning/')&&req.method()==='PUT')guestMutations++;});
    await guest.goto('http://localhost:3102/login/');await guest.getByRole('link',{name:'Lanjutkan tanpa akun',exact:true}).click();await guest.waitForURL('**/home/');
    await guest.goto('http://localhost:3102/learn/pengantar/');await expect(guest.getByRole('heading',{name:'Pengantar ilmu tajwid',exact:true})).toBeVisible();
    await expect(guest.getByRole('link',{name:'Masuk untuk menyimpan progres'})).toBeVisible();await expect(guest.getByRole('button',{name:'Tandai Selesai',exact:true})).toHaveCount(0);assert.equal(guestMutations,0);
    await guest.goto('http://localhost:3102/learn/');await expect(guest.locator('.lesson-row')).toHaveCount(24);await expect(guest.locator('.lesson-status-badge')).toHaveCount(0);
    await guest.goto('http://localhost:3102/dashboard/');await guest.waitForURL('**/login/?next=%2Fdashboard%2F');
    await second.route('http://localhost:4000/api/v1/learning/dashboard',route=>route.fulfill({status:503,headers:responseHeaders,json:{message:'Unavailable'}}));
    await second.reload();await expect(second.getByRole('heading',{name:'Progres belum dapat ditampilkan.',exact:true})).toBeVisible();await expect(second.getByRole('progressbar')).toHaveCount(0);
    await second.unroute('http://localhost:4000/api/v1/learning/dashboard');await second.getByRole('button',{name:'Coba lagi',exact:true}).click();await expect(second.getByText('1 dari 24 materi selesai',{exact:true})).toBeVisible();
    await second.route('http://localhost:4000/api/v1/learning/dashboard',route=>route.fulfill({headers:responseHeaders,json:{summary:{totalLessons:24}}}));
    await second.reload();await expect(second.getByRole('heading',{name:'Progres belum dapat ditampilkan.',exact:true})).toBeVisible();await expect(second.getByRole('progressbar')).toHaveCount(0);
    await second.unroute('http://localhost:4000/api/v1/learning/dashboard');
    await db.getRepository(Session).delete({userId:owned[0].id});
    await second.reload();await second.waitForURL('**/login/?next=%2Fdashboard%2F');
    await login(second,owned[0]);await second.waitForURL('**/dashboard/');await expect(second.getByText('1 dari 24 materi selesai',{exact:true})).toBeVisible();
    for(const lesson of lessonCatalog) await service.update(owned[0].id,lesson.id,'COMPLETED');
    await second.reload();await expect(second.getByText('24 dari 24 materi selesai',{exact:true})).toBeVisible();await expect(second.getByRole('progressbar')).toHaveAttribute('aria-valuenow','100');
    await expect(second.locator('.module-map-cell.status-completed')).toHaveCount(24);
    await expect(second.getByRole('link',{name:'Ulangi materi',exact:true})).toHaveAttribute('href','/learn/');
    await settleMotion(second);await second.screenshot({path:`docs/phase-02/${evidence}-dashboard-complete.png`,fullPage:true});
    assert.equal((await service.dashboard(owned[1].id)).summary.completedLessons,0);
  } finally {
    await Promise.allSettled(contexts.map(context=>context.close()));if(browser)await browser.close().catch(()=>{});
    await new Promise<void>(done=>site.listening?site.close(()=>done()):done());
    for(const user of owned) {
      const record=await db.getRepository(User).findOneBy({id:user.id});
      if(record?.email!==user.email || !record.email.startsWith(`phase02-${run}-`)) throw new Error('Test cleanup target mismatch');
      await db.getRepository(User).delete({id:user.id,email:user.email});
      assert.equal(await db.getRepository(UserLessonProgress).countBy({userId:user.id}),0);
    }
  }
}
