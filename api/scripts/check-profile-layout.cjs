// Visual-only account fixture. Never creates or edits a live account.
const {chromium,expect}=require('@playwright/test');
const assert=require('node:assert/strict');

(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const user={id:'00000000-0000-4000-8000-000000000001',email:'pelajar@example.com',nickname:'Pelajar Tajwid',fullName:'Pelajar Tajwid',learningGoal:'Membaca dengan lebih yakin, selangkah demi selangkah.',level:'pemula',emailVerified:true,loginMethods:['password','google']};
    const headers={'Access-Control-Allow-Origin':'http://localhost:3000','Access-Control-Allow-Credentials':'true'};
    let signedIn=true;
    await page.route('**/api/v1/auth/status',route=>route.fulfill({json:{google:true,emailRegistration:true,emailDelivery:false,developmentRegistration:true},headers}));
    await page.route('**/api/v1/auth/me',route=>route.fulfill({status:signedIn?200:401,json:signedIn?user:{message:'Unauthorized'},headers}));
    await page.goto('http://localhost:3000/profile/',{waitUntil:'domcontentloaded',timeout:60000});
    await expect(page.locator('.profile-hero h1')).toContainText(user.nickname);
    await expect(page.locator('.account-nav')).toContainText('Welcome,');
    await expect(page.locator('.account-nav')).toContainText(user.nickname);
    await page.evaluate(()=>document.fonts.ready);
    for(const width of [1440,1280,1024,768,390,320]) {
      await page.setViewportSize({width,height:1000});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Profile overflow at ${width}`);
      const account=await page.locator('.account-nav').boundingBox();
      assert.ok(account && account.x>=0 && account.x+account.width<=width,`Account navigation outside viewport ${width}`);
      await expect(page.getByRole('button',{name:'Simpan profil',exact:true})).toBeVisible();
      if(width===1440||width===390) await page.screenshot({path:`docs/phase-01/profile-redesign-${width===1440?'desktop':'mobile'}.png`,fullPage:true});
      if(width===1440) await page.screenshot({path:'docs/phase-01/profile-redesign-preview.png'});
    }
    await page.getByLabel('Nama panggilan',{exact:true}).focus();
    await expect(page.getByLabel('Nama panggilan',{exact:true})).toBeFocused();
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.locator('.profile-hero').evaluate(el=>getComputedStyle(el).animationName),'none');
    await page.evaluate(()=>document.documentElement.dataset.theme='dark');
    await page.setViewportSize({width:390,height:1000});
    await page.getByLabel('Nama panggilan',{exact:true}).blur();
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:'docs/phase-01/profile-redesign-dark.png',fullPage:true});
    user.nickname='Nama panggilan sangat panjang untuk menguji batas tampilan UI';
    user.email='nama.sangat.panjang.untuk.pengujian.layout@example.com';
    await page.reload();
    await expect(page.locator('.profile-hero h1')).toContainText(user.nickname);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Long account details overflow');
    signedIn=false;
    await page.goto('http://localhost:3000/home/');
    await expect(page.getByRole('link',{name:'Masuk',exact:true})).toHaveAttribute('href','/login/');
    await page.setViewportSize({width:320,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Guest navbar overflow');
    await page.screenshot({path:'docs/phase-01/navbar-guest-mobile.png',clip:{x:0,y:0,width:320,height:80}});
    console.log('Profile fixture: six widths, navbar greeting, long names, keyboard focus, dark theme and reduced motion PASS');
  } finally {await browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
