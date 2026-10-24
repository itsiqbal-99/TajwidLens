// Opt-in UI smoke against local development + Neon. Creates and removes only its own test account.
require('ts-node/register');
const {readConfig} = require('../src/config/config');
const {Pool} = require('pg');
const {randomUUID,randomBytes} = require('node:crypto');
const {chromium,expect} = require('@playwright/test');
const assert = require('node:assert/strict');

(async()=>{
  const config=readConfig();
  assert.ok(!config.production && config.allowUnverifiedEmail && !config.smtpHost,'Explicit no-SMTP development configuration required');
  assert.equal(config.frontend,'http://localhost:3000');
  assert.equal(config.api,'http://localhost:4000');
  const email=`ui-check-${randomUUID()}@example.invalid`, password=randomBytes(24).toString('base64url');
  console.log('Live UI run:',email);
  const db=new Pool({connectionString:config.databaseUrl,ssl:config.ssl,connectionTimeoutMillis:10000,idleTimeoutMillis:1000,max:1});
  db.on('error',()=>{});
  const browser=await chromium.launch({channel:'msedge',headless:true});
  let page,phase='load login';
  try {
    page=await browser.newPage({viewport:{width:1440,height:1000}});
    page.on('response',response=>{if(response.url().includes('/api/v1/auth/')) console.log('API',new URL(response.url()).pathname,response.status());});
    await page.goto(config.frontend+'/login/',{waitUntil:'domcontentloaded'});
    await expect(page.getByRole('button',{name:'Masuk dengan Google',exact:true})).toBeEnabled();
    await page.screenshot({path:'docs/phase-01/login-redesign-desktop.png',fullPage:true});
    for(const width of [390,320]) {
      await page.setViewportSize({width,height:844});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      if(width===390) await page.screenshot({path:'docs/phase-01/login-redesign-mobile.png',fullPage:true});
    }
    await page.goto(config.frontend+'/register/',{waitUntil:'domcontentloaded'});
    phase='register through UI';
    await expect(page.getByRole('button',{name:'Daftar dengan Google',exact:true})).toBeEnabled();
    await expect(page.getByRole('button',{name:'Daftar',exact:true})).toBeEnabled();
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:'docs/phase-01/register-redesign-mobile.png',fullPage:true});
    await page.setViewportSize({width:1440,height:1000});
    await page.screenshot({path:'docs/phase-01/register-redesign-desktop.png',fullPage:true});
    await page.getByLabel('Nama panggilan').fill('Uji UI lokal');
    await page.getByLabel('Email',{exact:true}).fill(email);
    await page.getByLabel('Kata sandi',{exact:true}).fill(password);
    await page.getByRole('button',{name:'Daftar',exact:true}).click();
    await page.getByRole('status').filter({hasText:'siap untuk pengujian'}).waitFor();
    const created=await db.query('SELECT id,nickname,"emailVerifiedAt" FROM users WHERE email=$1',[email]);
    assert.equal(created.rows.length,1);assert.equal(created.rows[0].emailVerifiedAt,null);
    phase='login through UI';console.log('Registration persisted in Neon PASS');
    await page.getByRole('link',{name:'Masuk',exact:true}).click();
    await page.waitForURL(url=>url.pathname==='/login/');
    await page.getByRole('heading',{name:'Senang Anda kembali.'}).waitFor();
    await page.getByLabel('Email',{exact:true}).fill(email);
    await page.getByLabel('Kata sandi',{exact:true}).fill(password);
    await page.getByRole('button',{name:'Masuk',exact:true}).click();await page.waitForURL('**/home/');
    phase='session reload and profile';
    await page.reload();await page.getByRole('link',{name:'Profil',exact:true}).waitFor();
    await page.getByRole('link',{name:'Profil',exact:true}).click();
    await page.getByText('Email belum diverifikasi',{exact:true}).waitFor();
    phase='logout';
    await page.getByRole('button',{name:'Keluar dari akun'}).click();await page.waitForURL('**/login/');
    console.log('Actual web UI registration, Neon persistence, login, reload and logout PASS');

    await page.route('**/api/v1/auth/status',route=>route.fulfill({status:404,contentType:'application/json',body:JSON.stringify({message:'Cannot GET /api/v1/auth/status'})}));
    phase='missing status endpoint regression';
    await page.reload();
    await page.getByText('Informasi layanan akun belum tersedia.',{exact:false}).waitFor();
    await expect(page.getByLabel('Email',{exact:true})).toBeEnabled();
    await expect(page.getByLabel('Kata sandi',{exact:true})).toBeEnabled();
    await page.getByLabel('Email',{exact:true}).fill(email);
    await page.getByLabel('Kata sandi',{exact:true}).fill(password);
    await page.getByRole('button',{name:'Masuk',exact:true}).click();await page.waitForURL('**/home/');
    console.log('Missing capability endpoint does not block actual password login/session PASS');
  } catch(error) {
    console.error('Failed phase:',phase,'at',page ? new URL(page.url()).pathname : 'browser startup',String(error.message).split('\n')[0]);
    if(page) await page.screenshot({path:'docs/phase-01/live-ui-failure.png',fullPage:true});
    throw error;
  } finally {
    await browser.close();
    const removed=await db.query('DELETE FROM users WHERE email=$1 AND nickname=$2 RETURNING id',[email,'Uji UI lokal']);
    console.log('Removed this run’s temporary UI account:',removed.rowCount);
    await db.end();
  }
})().catch(error=>{console.error('Live UI check FAILED:',error instanceof assert.AssertionError ? error.message : error.name);process.exitCode=1;});
