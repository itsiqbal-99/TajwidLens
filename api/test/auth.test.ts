import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { newDb, DataType } from 'pg-mem';
import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import * as argon2 from 'argon2';
import { readConfig, CONFIG } from '../src/config/config';
import { User } from '../src/modules/users/user.entity';
import { AuthToken, OAuthAttempt, Session } from '../src/modules/auth/auth.entity';
import { InitialAuth1760000000000 } from '../src/database/1760000000000-InitialAuth';
import { AuthService, digest, secret } from '../src/modules/auth/auth.service';
import { AuthController } from '../src/modules/auth/auth.controller';
import { UsersController } from '../src/modules/users/users.controller';
import { UsersService } from '../src/modules/users/users.service';
import { SessionGuard } from '../src/modules/auth/session.guard';
import { GoogleService, requireGoogleIdentity } from '../src/modules/auth/google.service';
import { Mailer } from '../src/modules/auth/mailer.service';
import { setup } from '../src/common/setup';
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

test('configuration fails closed and preserves certificate verification',()=>{
  assert.throws(()=>readConfig({}),/DATABASE_URL/);
  const config=readConfig({DATABASE_URL:'postgres://localhost/test?sslmode=no-verify'});
  assert.ok(!config.databaseUrl.includes('sslmode'));
  assert.throws(()=>readConfig({DATABASE_URL:'postgres://localhost/test',NODE_ENV:'production'}),/HTTPS/);
  assert.deepEqual(readConfig({DATABASE_URL:'postgres://db.neon.tech/test'}).ssl,{rejectUnauthorized:true});
});

test('Google claims reject missing identity, unverified email and nonce mismatch',()=>{
  const payload={sub:'subject',email:'google@example.com',email_verified:true,nonce:'expected',iss:'https://accounts.google.com',aud:'client',iat:1,exp:2};
  assert.equal(requireGoogleIdentity(payload,'expected').sub,'subject');
  assert.throws(()=>requireGoogleIdentity(undefined,'expected'));
  assert.throws(()=>requireGoogleIdentity({...payload,email_verified:false},'expected'));
  assert.throws(()=>requireGoogleIdentity(payload,'wrong'));
});

test('API authentication and persistence with migrated PostgreSQL emulator',async t=>{
  const memory=newDb();
  memory.public.registerFunction({name:'current_database',returns:DataType.text,implementation:()=> 'test'});
  memory.public.registerFunction({name:'version',returns:DataType.text,implementation:()=> 'PostgreSQL 16'});
  memory.public.registerFunction({name:'gen_random_uuid',returns:DataType.uuid,impure:true,implementation:randomUUID});
  const db:DataSource=memory.adapters.createTypeormDataSource({type:'postgres',entities:[User,Session,AuthToken,OAuthAttempt],migrations:[InitialAuth1760000000000],synchronize:false});
  await db.initialize();await db.runMigrations();
  const config=readConfig({DATABASE_URL:'postgres://localhost/test',FRONTEND_URL:'http://localhost:3101',GOOGLE_CLIENT_ID:'test-client',GOOGLE_CLIENT_SECRET:'test-only'});
  const mails:{email:string;kind:string;token:string}[]=[];
  const mailer={assertAvailable(){},async send(email:string,kind:string,token:string){mails.push({email,kind,token});}};
  const module=await Test.createTestingModule({imports:[ThrottlerModule.forRoot([{ttl:60000,limit:20}])],controllers:[AuthController,UsersController],providers:[AuthService,GoogleService,SessionGuard,UsersService,{provide:APP_GUARD,useClass:ThrottlerGuard},
    {provide:DataSource,useValue:db},{provide:CONFIG,useValue:config},{provide:Mailer,useValue:mailer}]}).compile();
  const app=module.createNestApplication(); setup(app,config);await app.init();
  const api=request(app.getHttpServer());
  const post=(path:string,body:object)=>api.post('/api/v1'+path).set('Origin',config.origin).set('X-TajwidLens-CSRF','1').send(body);
  const account={email:' TEST@EXAMPLE.COM ',password:'correct horse battery',nickname:'Pelajar'};
  let cookie:string;
  try {
    await t.test('CSRF, validation, and unauthorized ownership',async()=>{
      await api.post('/api/v1/auth/register').send(account).expect(403);
      await post('/auth/register',{...account,password:'short'}).expect(400);
      await api.get('/api/v1/users/me').expect(401);
    });
    await t.test('registration normalizes email, hashes password and hides duplicates',async()=>{
      const first=await post('/auth/register',account).expect(202);
      const second=await post('/auth/register',account).expect(202);
      assert.deepEqual(first.body,second.body);assert.equal(mails.length,1);
      const user=await db.getRepository(User).createQueryBuilder('u').addSelect('u.passwordHash').getOneOrFail();
      assert.equal(user.email,'test@example.com');assert.ok(user.passwordHash?.startsWith('$argon2id$'));
      assert.ok(await argon2.verify(user.passwordHash!,account.password));
    });
    await t.test('verification single use and expiration',async()=>{
      await post('/auth/verify-email',{token:mails[0].token}).expect(200);
      await post('/auth/verify-email',{token:mails[0].token}).expect(400);
      const user=await db.getRepository(User).findOneByOrFail({email:'test@example.com'});
      const token=secret();await db.getRepository(AuthToken).save({hash:digest(token),userId:user.id,kind:'verify',expiresAt:new Date(0)});
      await post('/auth/verify-email',{token}).expect(400);
    });
    await t.test('login, profile edit, protected fields and persistence',async()=>{
      await post('/auth/login',{email:account.email,password:'wrong'}).expect(401);
      const result=await post('/auth/login',account).expect(400);
      assert.ok(result.body);
      const login=await post('/auth/login',{email:account.email,password:account.password}).expect(200);
      cookie=login.headers['set-cookie'][0];assert.match(cookie,/HttpOnly/);assert.ok(!JSON.stringify(login.body).includes('passwordHash'));
      await api.patch('/api/v1/users/me').set('Cookie',cookie).set('Origin',config.origin).set('X-TajwidLens-CSRF','1').send({nickname:'Baru',id:randomUUID()}).expect(400);
      await api.patch('/api/v1/users/me').set('Cookie',cookie).set('Origin',config.origin).set('X-TajwidLens-CSRF','1').send({nickname:'Baru'}).expect(200);
      assert.equal((await db.getRepository(User).findOneByOrFail({email:'test@example.com'})).nickname,'Baru');
    });
    await t.test('forgot is generic, reset single use revokes sessions',async()=>{
      const missing=await post('/auth/password/forgot',{email:'missing@example.com'}).expect(202);
      const existing=await post('/auth/password/forgot',{email:'test@example.com'}).expect(202);assert.deepEqual(missing.body,existing.body);
      const token=mails.at(-1)!.token;
      await post('/auth/password/reset',{token,password:'new correct password'}).expect(200);
      await post('/auth/password/reset',{token,password:'another password'}).expect(400);
      await api.get('/api/v1/auth/me').set('Cookie',cookie).expect(401);
      await post('/auth/login',{email:'test@example.com',password:account.password}).expect(401);
    });
    await t.test('logout and expiration enforced by database',async()=>{
      const login=await post('/auth/login',{email:'test@example.com',password:'new correct password'}).expect(200);
      cookie=login.headers['set-cookie'][0];await post('/auth/logout',{}).set('Cookie',cookie).expect(200);
      await api.get('/api/v1/auth/me').set('Cookie',cookie).expect(401);
      const expired=secret(),user=await db.getRepository(User).findOneByOrFail({email:'test@example.com'});
      await db.getRepository(Session).save({hash:digest(expired),userId:user.id,expiresAt:new Date(0)});
      await api.get('/api/v1/auth/me').set('Cookie',`tajwidlens=${expired}`).expect(401);
    });
    await t.test('OAuth state, browser binding, replay, and account linking',async()=>{
      const google=module.get(GoogleService);
      await assert.rejects(()=>google.callback('bad','code','browser'));
      const start=await google.start(),url=new URL(start.url),state=url.searchParams.get('state')!;
      assert.equal(url.searchParams.get('code_challenge_method'),'S256');assert.ok(url.searchParams.get('nonce'));
      await assert.rejects(()=>google.callback(state,'code','wrong-browser'));
      google.validateIdentity=async()=>({sub:'google-sub',email:'test@example.com',email_verified:true,iss:'https://accounts.google.com',aud:'test-client',iat:1,exp:9999999999});
      await assert.rejects(()=>google.callback(state,'code',start.browser),/metode masuk/);
      await assert.rejects(()=>google.callback(state,'code',start.browser));
      const second=await google.start();
      google.validateIdentity=async()=>({sub:'new-google',email:'google@example.com',email_verified:true,iss:'https://accounts.google.com',aud:'test-client',iat:1,exp:9999999999});
      const session=await google.callback(new URL(second.url).searchParams.get('state')!,'code',second.browser);
      await api.get('/api/v1/auth/me').set('Cookie',`tajwidlens=${session}`).expect(200);
    });
    await t.test('unconfigured mailer reports unavailable',async()=>{
      assert.throws(()=>new Mailer(config).assertAvailable(),/belum tersedia/);
    });
    await t.test('Playwright registration, login, profile, recovery, logout and guest access',{skip:process.env.E2E !== 'true'},async()=>{
      await app.listen(4000);
      const root=resolve('../web/out');
      const site=createServer(async(req,res)=>{
        try {
          const pathname=new URL(req.url!,'http://localhost').pathname;
          const file=resolve(root,'.'+decodeURIComponent(pathname)+(pathname.endsWith('/') ? 'index.html' : ''));
          if(!file.startsWith(root+sep)) {res.writeHead(403);res.end();return;}
          const types:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
          res.setHeader('Content-Type',types[extname(file)] || 'application/octet-stream');res.end(await readFile(file));
        } catch {res.writeHead(404);res.end();}
      });
      await new Promise<void>(done=>site.listen(3101,done));
      const browser=await chromium.launch({channel:'msedge',headless:true});
      try {
        const page=await browser.newPage({viewport:{width:390,height:844}});
        await page.goto('http://localhost:3101/register/');
        await page.getByLabel('Nama panggilan').fill('Browser');
        await page.getByLabel('Email',{exact:true}).fill('browser@example.com');
        await page.getByLabel('Kata sandi').fill('browser password 123');
        await page.getByRole('button',{name:'Daftar',exact:true}).click();
        await page.getByRole('status').filter({hasText:'Jika alamat'}).waitFor();
        const verify=mails.find(m=>m.email==='browser@example.com' && m.kind==='verify')!;
        await page.goto(`http://localhost:3101/verify-email/#token=${verify.token}`);
        await page.getByRole('button',{name:'Verifikasi email',exact:true}).click();
        await page.getByText('Email berhasil diverifikasi.').waitFor();
        await page.goto('http://localhost:3101/login/');
        assert.ok((await page.getByRole('link',{name:'Lanjutkan dengan Google'}).getAttribute('href'))?.endsWith('/auth/google/start'));
        await page.getByLabel('Email',{exact:true}).fill('browser@example.com');
        await page.getByLabel('Kata sandi').fill('wrong');
        await page.getByRole('button',{name:'Masuk',exact:true}).click();
        await page.getByRole('alert').waitFor();
        await page.getByLabel('Kata sandi').fill('browser password 123');
        await page.getByRole('button',{name:'Masuk',exact:true}).click();
        await page.waitForURL('**/profile/');
        await page.getByLabel('Nama panggilan').fill('Nama tersimpan');
        await page.getByRole('button',{name:'Simpan profil'}).click();
        await page.getByText('Profil berhasil disimpan.').waitFor();
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
        await page.screenshot({path:'docs/phase-01/profile-mobile.png',fullPage:true});
        await page.reload();await page.getByLabel('Nama panggilan').waitFor();
        assert.equal(await page.getByLabel('Nama panggilan').inputValue(),'Nama tersimpan');
        await page.getByRole('button',{name:'Keluar dari akun'}).click();await page.waitForURL('**/login/');
        await page.goto('http://localhost:3101/forgot-password/');
        await page.getByLabel('Email',{exact:true}).fill('browser@example.com');
        await page.getByRole('button',{name:'Kirim tautan pemulihan'}).click();
        await page.getByRole('status').filter({hasText:'Jika alamat'}).waitFor();
        const reset=[...mails].reverse().find(m=>m.email==='browser@example.com' && m.kind==='reset')!;
        await page.goto(`http://localhost:3101/reset-password/#token=${reset.token}`);
        await page.getByLabel('Kata sandi').fill('changed browser password');
        await page.getByRole('button',{name:'Simpan kata sandi'}).click();
        await page.getByText('Kata sandi diperbarui. Silakan masuk kembali.').waitFor();
        await page.goto('http://localhost:3101/explore/');
        await page.locator('#main-content').waitFor();assert.ok(!(await page.url()).includes('login'));
        await page.setViewportSize({width:1440,height:1000});
        await page.goto('http://localhost:3101/login/');
        await page.screenshot({path:'docs/phase-01/login-desktop.png',fullPage:true});
        await page.getByRole('button',{name:'Aktifkan tema gelap'}).click();
        await page.screenshot({path:'docs/phase-01/login-dark.png',fullPage:true});
      } finally {await browser.close();await new Promise<void>(done=>site.close(()=>done()));}
    });
    await t.test('rate limiting rejects excessive requests',async()=>{
      let throttled=false;
      for(let index=0;index<25;index++) {const result=await api.get('/api/v1/auth/me');if(result.status===429){throttled=true;break;}}
      assert.ok(throttled);
    });
  } finally {await app.close();await db.destroy();}
});




