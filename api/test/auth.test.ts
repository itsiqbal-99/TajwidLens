import 'reflect-metadata';
import { mock, test } from 'node:test';
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
import { GoogleAuthError, GoogleService, requireGoogleIdentity } from '../src/modules/auth/google.service';
import { OAuth2Client } from 'google-auth-library';
import { Logger } from '@nestjs/common';
import { Mailer } from '../src/modules/auth/mailer.service';
import { setup } from '../src/common/setup';
import { chromium, expect as browserExpect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

test('configuration fails closed and preserves certificate verification',()=>{
  assert.throws(()=>readConfig({}),/DATABASE_URL/);
  const config=readConfig({DATABASE_URL:'postgres://localhost/test?sslmode=no-verify'});
  assert.ok(!config.databaseUrl.includes('sslmode'));
  assert.throws(()=>readConfig({DATABASE_URL:'postgres://localhost/test',NODE_ENV:'production'}),/HTTPS/);
  assert.deepEqual(readConfig({DATABASE_URL:'postgres://db.neon.tech/test'}).ssl,{rejectUnauthorized:true});
  assert.throws(()=>readConfig({DATABASE_URL:'postgres://localhost/test',NODE_ENV:'production',AUTH_ALLOW_UNVERIFIED_EMAIL:'true'}),/development\/test only/);
  assert.throws(()=>readConfig({DATABASE_URL:'postgres://localhost/test',AUTH_ALLOW_UNVERIFIED_EMAIL:'true'}),/development\/test only/);
  assert.equal(readConfig({DATABASE_URL:'postgres://localhost/test',NODE_ENV:'development',AUTH_ALLOW_UNVERIFIED_EMAIL:'true'}).allowUnverifiedEmail,true);
});

test('Google claims reject missing identity, unverified email and nonce mismatch',()=>{
  const payload={sub:'subject',email:'google@example.com',email_verified:true,nonce:'expected',iss:'https://accounts.google.com',aud:'client',iat:1,exp:2};
  assert.equal(requireGoogleIdentity(payload,'expected').sub,'subject');
  assert.throws(()=>requireGoogleIdentity(undefined,'expected'));
  assert.throws(()=>requireGoogleIdentity({...payload,email_verified:false},'expected'));
  assert.throws(()=>requireGoogleIdentity(payload,'wrong'));
});

test('Google failures expose only safe categories and never log credentials',async()=>{
  const config=readConfig({DATABASE_URL:'postgres://localhost/test',GOOGLE_CLIENT_ID:'test-client',GOOGLE_CLIENT_SECRET:'secret-client'});
  const google=new GoogleService({} as DataSource,config);
  const logs:string[]=[];
  const logger=mock.method(Logger.prototype,'warn',(message:unknown)=>{logs.push(String(message));});
  try {
    for(const [provider,reason] of [['invalid_client','google_configuration'],['invalid_grant','google_code'],['network-error','google_unavailable']]) {
      const token=mock.method(OAuth2Client.prototype,'getToken',async()=>{throw {response:{data:{error:provider,error_description:'secret-client authorization-code user@example.com'}}};});
      try {await assert.rejects(()=>google.validateIdentity('authorization-code','secret-verifier','nonce'),(error:unknown)=>error instanceof GoogleAuthError && error.reason===reason);}
      finally {token.mock.restore();}
    }
    const token=mock.method(OAuth2Client.prototype,'getToken',async()=>({tokens:{id_token:'secret-id-token'}}));
    const identity=mock.method(OAuth2Client.prototype,'verifyIdToken',async()=>{throw new Error('secret-id-token');});
    try {await assert.rejects(()=>google.validateIdentity('authorization-code','secret-verifier','nonce'),(error:unknown)=>error instanceof GoogleAuthError && error.reason==='google_identity');}
    finally {token.mock.restore();identity.mock.restore();}
    assert.ok(logs.length>=4);
    assert.doesNotMatch(logs.join('\n'),/secret-client|authorization-code|secret-verifier|secret-id-token|user@example.com/);
  } finally {logger.mock.restore();}
});

test('API authentication and persistence with migrated PostgreSQL emulator',async t=>{
  const memory=newDb();
  memory.public.registerFunction({name:'current_database',returns:DataType.text,implementation:()=> 'test'});
  memory.public.registerFunction({name:'version',returns:DataType.text,implementation:()=> 'PostgreSQL 16'});
  memory.public.registerFunction({name:'gen_random_uuid',returns:DataType.uuid,impure:true,implementation:randomUUID});
  const db:DataSource=memory.adapters.createTypeormDataSource({type:'postgres',entities:[User,Session,AuthToken,OAuthAttempt],migrations:[InitialAuth1760000000000],synchronize:false});
  await db.initialize();await db.runMigrations();
  const config=readConfig({DATABASE_URL:'postgres://localhost/test',FRONTEND_URL:'http://localhost:3101',API_URL:'http://localhost:4101',GOOGLE_CLIENT_ID:'test-client',GOOGLE_CLIENT_SECRET:'test-only'});
  const mails:{email:string;kind:string;token:string}[]=[];
  const requestLimit=process.env.E2E === 'true' ? 200 : 20;
  const mailer={assertAvailable(){},async send(email:string,kind:string,token:string){mails.push({email,kind,token});}};
  const module=await Test.createTestingModule({imports:[ThrottlerModule.forRoot([{ttl:60000,limit:requestLimit}])],controllers:[AuthController,UsersController],providers:[AuthService,GoogleService,SessionGuard,UsersService,{provide:APP_GUARD,useClass:ThrottlerGuard},
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
      await post('/auth/login',{email:account.email,password:account.password}).expect(401);
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
      assert.equal(session.isNewUser,true);
      await api.get('/api/v1/auth/me').set('Cookie',`tajwidlens=${session.token}`).expect(200);
      const third=await google.start();
      const returning=await google.callback(new URL(third.url).searchParams.get('state')!,'code',third.browser);
      assert.equal(returning.isNewUser,false);
    });
    await t.test('unconfigured mailer reports unavailable',async()=>{
      assert.throws(()=>new Mailer(config).assertAvailable(),/belum tersedia/);
    });
    await t.test('parallel Google attempts in one browser keep independent binding cookies',async()=>{
      const browser=request.agent(app.getHttpServer());
      const first=await browser.get('/api/v1/auth/google/start').expect(302);
      const second=await browser.get('/api/v1/auth/google/start').expect(302);
      const firstState=new URL(first.headers.location).searchParams.get('state')!;
      const secondState=new URL(second.headers.location).searchParams.get('state')!;
      await browser.get(`/api/v1/auth/google/callback?state=${firstState}&code=test-code`).expect(302).expect('Location',config.frontend+'/auth-complete/');
      await browser.get(`/api/v1/auth/google/callback?state=${secondState}&code=test-code`).expect(302).expect('Location',config.frontend+'/auth-complete/');
      await browser.get(`/api/v1/auth/google/callback?state=${firstState}&code=test-code`).expect(302).expect('Location',config.frontend+'/login/?error=google_session');
    });
    await t.test('Google callback distinguishes missing binding, cancellation and an existing password account',async()=>{
      const browser=request.agent(app.getHttpServer());
      const start=await browser.get('/api/v1/auth/google/start').expect(302);
      const state=new URL(start.headers.location).searchParams.get('state')!;
      await api.get(`/api/v1/auth/google/callback?state=${state}&code=test-code`).expect(302).expect('Location',config.frontend+'/login/?error=google_session');
      const google=module.get(GoogleService),validateIdentity=google.validateIdentity;
      google.validateIdentity=async()=>({sub:'collision-google',email:'test@example.com',email_verified:true,iss:'https://accounts.google.com',aud:'test-client',iat:1,exp:9999999999});
      try {await browser.get(`/api/v1/auth/google/callback?state=${state}&code=test-code`).expect(302).expect('Location',config.frontend+'/login/?error=google_account_exists');}
      finally {google.validateIdentity=validateIdentity;}
      assert.equal((await db.getRepository(User).findOneByOrFail({email:'test@example.com'})).googleSubject,null);
      const expired=await browser.get('/api/v1/auth/google/start').expect(302);
      const expiredState=new URL(expired.headers.location).searchParams.get('state')!;
      await db.getRepository(OAuthAttempt).update({hash:digest(expiredState)},{expiresAt:new Date(0)});
      await browser.get(`/api/v1/auth/google/callback?state=${expiredState}&code=test-code`).expect(302).expect('Location',config.frontend+'/login/?error=google_session');
      await api.get('/api/v1/auth/google/callback?error=access_denied').expect(302).expect('Location',config.frontend+'/login/?error=google_cancelled');
      await api.get('/api/v1/auth/google/callback?error=secret-provider-detail').expect(302).expect('Location',config.frontend+'/login/?error=google');
    });
    await t.test('explicit Google linking requires password, matching identity, browser and live session; preserves the account',async()=>{
      const password='linking account password';
      const original=await db.getRepository(User).save({email:'linker@example.com',nickname:'Original profile',passwordHash:await argon2.hash(password),emailVerifiedAt:new Date()});
      const browser=request.agent(app.getHttpServer());
      const link=(body:object)=>browser.post('/api/v1/auth/google/link').set('Origin',config.origin).set('X-TajwidLens-CSRF','1').send(body);
      await post('/auth/google/link',{password}).expect(401);
      await browser.post('/api/v1/auth/login').set('Origin',config.origin).set('X-TajwidLens-CSRF','1').send({email:original.email,password}).expect(200);
      await browser.post('/api/v1/auth/google/link').send({password}).expect(403);
      await link({password:'wrong'}).expect(401);
      await link({password,userId:randomUUID()}).expect(400);
      const google=module.get(GoogleService),previous=google.validateIdentity;
      const identity=(email:string,sub='linked-subject')=>async()=>({sub,email,email_verified:true,iss:'https://accounts.google.com',aud:'test-client',iat:1,exp:9999999999});
      const start=async()=>{const result=await link({password}).expect(200);return {result,state:new URL(result.body.url).searchParams.get('state')!};};
      const callback=(state:string)=>browser.get('/api/v1/auth/google/callback').query({state,code:'test-link-code'});
      try {
        google.validateIdentity=identity('other@example.com');
        const mismatch=await start();
        await callback(mismatch.state).expect(302).expect('Location',config.frontend+'/login/?error=google_link_mismatch');
        assert.equal((await db.getRepository(User).findOneByOrFail({id:original.id})).googleSubject,null);
        const missingSession=await start();
        await api.get('/api/v1/auth/google/callback').query({state:missingSession.state,code:'test-link-code'})
          .set('Cookie',missingSession.result.headers['set-cookie'][0]).expect(302).expect('Location',config.frontend+'/login/?error=google_session');
        const expired=await start();
        await db.getRepository(AuthToken).update({hash:digest(expired.state),kind:'google-link'},{expiresAt:new Date(0)});
        await callback(expired.state).expect(302).expect('Location',config.frontend+'/login/?error=google_session');
        google.validateIdentity=identity(original.email,'new-google');
        const occupied=await start();
        await callback(occupied.state).expect(302).expect('Location',config.frontend+'/login/?error=google_link_mismatch');
        assert.equal((await db.getRepository(User).findOneByOrFail({id:original.id})).googleSubject,null);
        google.validateIdentity=identity(original.email);
        const valid=await start(),count=await db.getRepository(User).count();
        await callback(valid.state).expect(302).expect('Location',config.frontend+'/profile/?google=linked');
        const linked=await db.getRepository(User).createQueryBuilder('u').addSelect('u.passwordHash').where('u.id = :id',{id:original.id}).getOneOrFail();
        assert.equal(linked.googleSubject,'linked-subject');assert.equal(linked.nickname,original.nickname);assert.equal(linked.passwordHash,original.passwordHash);
        assert.equal(await db.getRepository(User).count(),count);
        const me=await browser.get('/api/v1/auth/me').expect(200);assert.equal(me.body.id,original.id);assert.deepEqual(me.body.loginMethods,['password','google']);
        await callback(valid.state).expect(302).expect('Location',config.frontend+'/login/?error=google_session');
        const ordinary=await browser.get('/api/v1/auth/google/start').expect(302);
        await callback(new URL(ordinary.headers.location).searchParams.get('state')!).expect(302).expect('Location',config.frontend+'/auth-complete/');
        const login=await post('/auth/login',{email:original.email,password}).expect(200);assert.equal(login.body.id,original.id);
      } finally {google.validateIdentity=previous;}
    });
    await t.test('SMTP deferred: explicit dev registration, no verification claim, login and capabilities',async()=>{
      const devConfig={...config,allowUnverifiedEmail:true};
      const service=new AuthService(db,new Mailer(devConfig),devConfig);
      const input={email:'dev@example.com',password:'development password',nickname:'Dev'};
      const result=await service.register(input);
      assert.match(result.message,/belum diverifikasi/);
      assert.deepEqual(await service.register(input),result);
      assert.equal((await db.getRepository(User).findOneByOrFail({email:input.email})).emailVerifiedAt,null);
      const session=await service.login(input.email,input.password);
      assert.equal((await service.authenticate(session.token)).email,input.email);
      await assert.rejects(()=>module.get(AuthService).authenticate(session.token));
      await assert.rejects(()=>module.get(AuthService).login(input.email,input.password),/Verifikasi/);
      await assert.rejects(()=>service.requestToken(input.email,'reset'),/belum tersedia/);
      const status=await api.get('/api/v1/auth/status').expect(200);
      assert.deepEqual(status.body,{google:true,emailRegistration:false,emailDelivery:false,developmentRegistration:false});
      const google=await post('/auth/google/start',{}).expect(200);
      assert.ok(google.body.url.startsWith('https://accounts.google.com/'));
      assert.match(google.headers['set-cookie'][0],/HttpOnly/);
      const browserStart=await api.get('/api/v1/auth/google/start').expect(302);
      const authorization=new URL(browserStart.headers.location);
      assert.equal(authorization.origin,'https://accounts.google.com');
      assert.equal(authorization.searchParams.get('code_challenge_method'),'S256');
      assert.equal(authorization.searchParams.get('redirect_uri'),config.api+'/api/v1/auth/google/callback');
      assert.match(browserStart.headers['set-cookie'][0],/HttpOnly/);
      const clientId=config.googleClientId;config.googleClientId=undefined;
      try {await api.get('/api/v1/auth/google/start').expect(302).expect('Location',config.frontend+'/login/?error=google');}
      finally {config.googleClientId=clientId;}
      await api.get('/api/v1/auth/google/callback?state=invalid&code=invalid').expect(302).expect('Location',config.frontend+'/login/?error=google_session');
    });
    await t.test('Playwright registration, login, profile, recovery, logout and guest access',{skip:process.env.E2E !== 'true'},async()=>{
      // Capability mirrors the in-memory mailer double for this test only; no SMTP connection.
      config.smtpHost='test-mailer.invalid';
      await app.listen(4101);
      const root=resolve('../web/out');
      const site=createServer(async(req,res)=>{
        try {
          const pathname=new URL(req.url!,'http://localhost').pathname;
          const file=resolve(root,'.'+decodeURIComponent(pathname)+(pathname.endsWith('/') ? 'index.html' : ''));
          if(!file.startsWith(root+sep)) {res.writeHead(403);res.end();return;}
          const types:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
          res.setHeader('Content-Type',types[extname(file)] || 'application/octet-stream');res.end(await readFile(file));
        } catch {res.writeHead(404);res.end();}
      });
      await new Promise<void>(done=>site.listen(3101,done));
      const browser=await chromium.launch({channel:'msedge',headless:true});
      try {
        const page=await browser.newPage({viewport:{width:390,height:844}});
        // Isolate test API from the user's development API without rebuilding public config.
        await page.context().route('http://localhost:4000/**',route=>route.continue({url:route.request().url().replace('localhost:4000','localhost:4101')}));
        await page.goto('http://localhost:3101/');
        await page.waitForURL('**/login/');
        assert.equal(await page.locator('.desktop-nav').count(),0);
        await page.goto('http://localhost:3101/login/?error=google_account_exists');
        await page.getByRole('alert').filter({hasText:'Hubungkan Google di profil'}).waitFor();
        await page.goto('http://localhost:3101/login/?error=google_session');
        await page.getByRole('alert').filter({hasText:'Sesi Google kedaluwarsa'}).waitFor();
        await page.goto('http://localhost:3101/login/');
        await page.getByRole('link',{name:'Lanjutkan tanpa akun',exact:true}).click();
        await page.waitForURL('**/home/');
        await page.reload();await page.getByRole('heading',{name:/Baca Al-Qur/}).waitFor();
        await page.goBack({waitUntil:'domcontentloaded'});await page.waitForURL('**/login/');
        await page.goForward({waitUntil:'domcontentloaded'});await page.waitForURL('**/home/');
        await page.goto('http://localhost:3101/register/');
        await page.getByLabel('Nama panggilan').fill('Browser');
        await page.getByLabel('Email',{exact:true}).fill('not-an-email');
        await page.getByLabel('Kata sandi',{exact:true}).fill('browser password 123');
        await page.getByRole('button',{name:'Daftar',exact:true}).click();
        assert.equal(await page.locator('#email').evaluate((el:HTMLInputElement)=>el.checkValidity()),false);
        await page.getByLabel('Email',{exact:true}).fill('browser@example.com');
        await page.getByRole('button',{name:'Daftar',exact:true}).click();
        await page.getByRole('status').filter({hasText:'Jika alamat'}).waitFor();
        const verify=mails.find(m=>m.email==='browser@example.com' && m.kind==='verify')!;
        await page.goto(`http://localhost:3101/verify-email/#token=${verify.token}`);
        await page.getByRole('button',{name:'Verifikasi email',exact:true}).click();
        await page.getByText('Email berhasil diverifikasi.').waitFor();
        await page.goto('http://localhost:3101/login/');
        await browserExpect(page.getByRole('button',{name:'Masuk dengan Google',exact:true})).toBeEnabled();
        await page.getByLabel('Tampilkan kata sandi').click();
        assert.equal(await page.locator('#password').getAttribute('type'),'text');
        await page.getByLabel('Sembunyikan kata sandi').click();
        await page.getByLabel('Email',{exact:true}).fill('browser@example.com');
        await page.getByLabel('Kata sandi',{exact:true}).fill('wrong');
        await page.getByRole('button',{name:'Masuk',exact:true}).click();
        await page.getByRole('alert').waitFor();
        await page.getByLabel('Kata sandi',{exact:true}).fill('browser password 123');
        await page.getByRole('button',{name:'Masuk',exact:true}).click();
        await page.waitForURL('**/home/');
        await page.goto('http://localhost:3101/');await page.waitForURL('**/home/');
        await page.getByRole('link',{name:'Profil',exact:true}).click();
        await page.waitForURL('**/profile/');
        await page.getByLabel('Nama panggilan').fill('Nama tersimpan');
        await page.getByRole('button',{name:'Simpan profil'}).click();
        await page.getByText('Profil berhasil disimpan.').waitFor();
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
        await page.screenshot({path:'docs/phase-01/profile-mobile.png',fullPage:true});
        await page.reload();await page.getByLabel('Nama panggilan').waitFor();
        assert.equal(await page.getByLabel('Nama panggilan').inputValue(),'Nama tersimpan');
        const googleLinkService=module.get(GoogleService),beforeLink=googleLinkService.validateIdentity;
        googleLinkService.validateIdentity=async()=>({sub:'browser-linked-password',email:'browser@example.com',email_verified:true,iss:'https://accounts.google.com',aud:'test-client',iat:1,exp:9999999999});
        await page.context().route('http://localhost:4000/api/v1/auth/google/link',async route=>{
          const response=await route.fetch({url:'http://localhost:4101/api/v1/auth/google/link',maxRedirects:0});
          if(response.status()!==200) {await route.fulfill({response});return;}
          const authorization=new URL((await response.json()).url),state=authorization.searchParams.get('state');
          assert.equal(authorization.origin,'https://accounts.google.com');
          await route.fulfill({response,json:{url:`http://localhost:4101/api/v1/auth/google/callback?state=${state}&code=link-identity-double`}});
        });
        try {
          await page.getByLabel('Konfirmasi kata sandi akun',{exact:true}).fill('wrong');
          await page.getByRole('button',{name:'Hubungkan Google',exact:true}).click();
          await page.getByRole('alert').filter({hasText:'Kata sandi tidak sesuai.'}).waitFor();
          await page.getByLabel('Konfirmasi kata sandi akun',{exact:true}).fill('browser password 123');
          await page.getByRole('button',{name:'Hubungkan Google',exact:true}).click();
          await page.waitForURL('**/profile/?google=linked');
          await page.getByText('Google terhubung. Anda dapat masuk menggunakan akun Google Anda.',{exact:true}).waitFor();
          assert.equal(await page.getByLabel('Nama panggilan').inputValue(),'Nama tersimpan');
          await browserExpect(page.getByRole('button',{name:'Hubungkan Google',exact:true})).toHaveCount(0);
        } finally {
          googleLinkService.validateIdentity=beforeLink;
          await page.context().unroute('http://localhost:4000/api/v1/auth/google/link');
        }
        await page.getByRole('button',{name:'Keluar dari akun'}).click();await page.waitForURL('**/login/');
        await page.goto('http://localhost:3101/forgot-password/');
        await page.getByLabel('Email',{exact:true}).fill('browser@example.com');
        await page.getByRole('button',{name:'Kirim tautan pemulihan'}).click();
        await page.getByRole('status').filter({hasText:'Jika alamat'}).waitFor();
        const reset=[...mails].reverse().find(m=>m.email==='browser@example.com' && m.kind==='reset')!;
        await page.goto(`http://localhost:3101/reset-password/#token=${reset.token}`);
        await page.getByLabel('Kata sandi',{exact:true}).fill('changed browser password');
        await page.getByRole('button',{name:'Simpan kata sandi'}).click();
        await page.getByText('Kata sandi diperbarui. Silakan masuk kembali.').waitFor();
        await page.goto('http://localhost:3101/explore/');
        await page.locator('.tajweed-segment').first().waitFor();assert.ok(!(await page.url()).includes('login'));
        await page.goto('http://localhost:3101/learn/');await page.getByRole('heading',{level:1}).waitFor();
        await page.getByLabel('Pilih tema warna').click();
        await page.getByRole('button',{name:/Zamrud/}).click();
        await page.setViewportSize({width:1440,height:1000});
        await page.goto('http://localhost:3101/login/');
        await browserExpect(page.getByRole('button',{name:'Masuk dengan Google',exact:true})).toBeEnabled();
        await page.screenshot({path:'docs/phase-01/login-desktop.png',fullPage:true});
        assert.equal(await page.locator('.auth-layout').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(248, 249, 247)');
        await page.screenshot({path:'docs/phase-01/login-theme-independent.png',fullPage:true});
        await page.setViewportSize({width:390,height:844});
        await page.screenshot({path:'docs/phase-01/login-mobile.png',fullPage:true});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
        await page.goto('http://localhost:3101/register/');
        await page.screenshot({path:'docs/phase-01/register-mobile.png',fullPage:true});
        await page.setViewportSize({width:1440,height:1000});
        await page.screenshot({path:'docs/phase-01/register-desktop.png',fullPage:true});
        await page.emulateMedia({reducedMotion:'reduce'});
        assert.equal(await page.locator('.account-card').evaluate(el=>getComputedStyle(el).animationName),'none');
        await page.keyboard.press('Tab');
        assert.notEqual(await page.evaluate(()=>document.activeElement?.tagName),'BODY');

        // Exercise browser-bound state/callback/session with an identity double, not live Google consent.
        module.get(GoogleService).validateIdentity=async()=>({sub:'browser-google',email:'google-browser@example.com',given_name:'Google Browser',email_verified:true,iss:'https://accounts.google.com',aud:'test-client',iat:1,exp:9999999999});
        await page.context().route('http://localhost:4000/api/v1/auth/google/start',async route=>{
          const response=await route.fetch({url:'http://localhost:4101/api/v1/auth/google/start',maxRedirects:0});
          const authorization=new URL(response.headers().location);
          assert.equal(authorization.origin,'https://accounts.google.com');
          assert.equal(authorization.searchParams.get('code_challenge_method'),'S256');
          const state=authorization.searchParams.get('state');
          await route.fulfill({response,headers:{...response.headers(),location:`http://localhost:4101/api/v1/auth/google/callback?state=${state}&code=identity-double`}});
        });
        await page.goto('http://localhost:3101/login/');
        const opened=page.context().waitForEvent('page');
        await page.getByRole('button',{name:'Masuk dengan Google',exact:true}).click();
        await browserExpect(page.getByRole('button',{name:'Masuk dengan Google',exact:true})).toBeEnabled();
        await browserExpect(page.getByLabel('Email',{exact:true})).toBeEnabled();
        const popup=await opened;
        await page.waitForURL('**/profile/?welcome=1');
        await browserExpect.poll(()=>popup.isClosed()).toBe(true);
        await page.getByLabel('Nama panggilan').waitFor();
        assert.equal(await page.getByLabel('Nama panggilan').inputValue(),'Google Browser');
        await page.getByLabel('Nama panggilan').fill('Nama Google');
        await page.getByRole('button',{name:'Simpan dan mulai belajar'}).click();await page.waitForURL('**/home/');
        await browserExpect(page.locator('.account-nav')).toContainText('Nama Google');
        await page.goto('http://localhost:3101/profile/');
        await page.getByRole('button',{name:'Keluar dari akun'}).click();await page.waitForURL('**/login/');

        await page.goto('http://localhost:3101/register/');
        const returning=page.context().waitForEvent('page');
        await page.getByRole('button',{name:'Daftar dengan Google',exact:true}).click();
        const returningPopup=await returning;await page.waitForURL('**/home/');
        await browserExpect.poll(()=>returningPopup.isClosed()).toBe(true);
        await page.goto('http://localhost:3101/profile/');
        await page.getByRole('button',{name:'Keluar dari akun'}).click();await page.waitForURL('**/login/');

        // No originating listener: the same-tab flow must still reach an authenticated page.
        await page.goto('http://localhost:4000/api/v1/auth/google/start');
        await page.waitForURL('**/home/',{timeout:25000});
        await browserExpect(page.locator('.account-nav')).toContainText('Nama Google');
        await page.goto('http://localhost:3101/profile/');
        await page.getByRole('button',{name:'Keluar dari akun'}).click();await page.waitForURL('**/login/');

        await page.evaluate(()=>{window.open=()=>null;});
        await page.getByRole('button',{name:'Masuk dengan Google',exact:true}).click();
        await browserExpect(page.getByRole('link',{name:'lanjutkan di tab ini'})).toHaveAttribute('href','http://localhost:4000/api/v1/auth/google/start');
        await browserExpect(page.getByRole('button',{name:'Masuk',exact:true})).toBeEnabled();
        await browserExpect(page.getByLabel('Email',{exact:true})).toBeEnabled();
        await page.evaluate(()=>{window.open=()=>{throw new Error('Popup not allowed');};});
        await page.getByRole('button',{name:'Masuk dengan Google',exact:true}).click();
        await page.getByRole('alert').filter({hasText:'Browser tidak mengizinkan jendela Google.'}).waitFor();
        await browserExpect(page.getByLabel('Email',{exact:true})).toBeEnabled();

        config.smtpHost=undefined;config.allowUnverifiedEmail=true;
        await page.goto('http://localhost:3101/register/');await page.reload();
        await page.getByLabel('Nama panggilan').fill('Tanpa SMTP');
        await page.getByLabel('Email',{exact:true}).fill('browser-dev@example.com');
        await page.getByLabel('Kata sandi',{exact:true}).fill('development browser password');
        await page.getByRole('button',{name:'Daftar',exact:true}).click();
        await page.getByRole('status').filter({hasText:'siap untuk pengujian'}).waitFor();
        await page.goto('http://localhost:3101/login/');
        await page.getByLabel('Email',{exact:true}).fill('browser-dev@example.com');
        await page.getByLabel('Kata sandi',{exact:true}).fill('development browser password');
        await page.getByRole('button',{name:'Masuk',exact:true}).click();await page.waitForURL('**/home/');
        await page.goto('http://localhost:3101/profile/');await page.getByText('Email belum diverifikasi',{exact:true}).waitFor();
        await page.getByRole('button',{name:'Keluar dari akun'}).click();await page.waitForURL('**/login/');
        await page.goto('http://localhost:3101/forgot-password/');
        await page.getByRole('status').filter({hasText:'Pengiriman email ditunda'}).waitFor();
        assert.equal(await page.getByRole('button',{name:'Kirim tautan pemulihan'}).isDisabled(),true);
        config.googleClientId=undefined;config.allowUnverifiedEmail=false;
        await page.goto('http://localhost:3101/login/');await page.reload();
        await page.getByText('Login Google belum tersedia.',{exact:false}).waitFor();
        assert.equal(await page.getByRole('button',{name:'Masuk dengan Google',exact:true}).isDisabled(),true);
        await page.route('http://localhost:4000/**',route=>route.abort());
        await page.reload();await page.getByText(/Layanan akun sementara tidak dapat dijangkau/).waitFor();
        await page.getByRole('link',{name:'Lanjutkan tanpa akun',exact:true}).click();await page.waitForURL('**/home/');
      } finally {await browser.close();await new Promise<void>(done=>site.close(()=>done()));}
    });
    await t.test('rate limiting rejects excessive requests',async()=>{
      let throttled=false;
      for(let index=0;index<requestLimit+5;index++) {const result=await api.get('/api/v1/auth/me');if(result.status===429){throttled=true;break;}}
      assert.ok(throttled);
    });
  } finally {await app.close();await db.destroy();}
});




