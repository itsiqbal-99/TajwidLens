// Read-only visual checks; AUTH_LAYOUT_FIXTURE=1 isolates layout from API availability.
const {chromium,expect} = require('@playwright/test');
const assert = require('node:assert/strict');

(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    if(process.env.AUTH_LAYOUT_FIXTURE==='1') {
      await page.route('**/api/v1/auth/status',route=>route.fulfill({json:{google:true,emailRegistration:true,emailDelivery:false,developmentRegistration:true},headers:{'Access-Control-Allow-Origin':'http://localhost:3000','Access-Control-Allow-Credentials':'true'}}));
      await page.route('**/api/v1/auth/me',route=>route.fulfill({status:401,json:{message:'Unauthorized'},headers:{'Access-Control-Allow-Origin':'http://localhost:3000','Access-Control-Allow-Credentials':'true'}}));
      console.log('Visual capability fixture active; this is not a live API availability check.');
    }
    for(const mode of ['login','register']) {
      await page.setViewportSize({width:1440,height:1100});
      await page.goto(`http://localhost:3000/${mode}/`,{waitUntil:'domcontentloaded',timeout:60000});
      await expect(page.getByRole('button',{name:mode==='login'?'Masuk':'Daftar',exact:true})).toBeEnabled();
      await expect(page.getByRole('button',{name:mode==='login'?'Masuk dengan Google':'Daftar dengan Google',exact:true})).toBeEnabled();
      await page.evaluate(()=>document.fonts.ready);
      const logo=page.getByRole('img',{name:'Logo TajwidLens',exact:true});
      await expect(logo).toHaveAttribute('src','/android-chrome-512x512.png');
      await expect(logo).toBeVisible();
      assert.equal(await logo.evaluate(el=>el.complete && el.naturalWidth===512),true);
      const illustration=page.locator('.auth-illustration img');
      await expect(illustration).toBeVisible();
      await expect.poll(()=>illustration.evaluate(el=>el.complete && el.naturalWidth===1200)).toBe(true);
      assert.equal(await illustration.evaluate(el=>getComputedStyle(el).filter),'none');
      await expect.poll(()=>illustration.evaluate(el=>getComputedStyle(el).opacity)).toBe('0.94');
      await expect(page.locator('.auth-quote-arabic')).toHaveText('خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ');
      await expect(page.locator('.auth-quote-arabic')).toHaveAttribute('lang','ar');
      await expect(page.locator('.auth-quote-arabic')).toHaveAttribute('dir','rtl');
      await expect(page.locator('.auth-quote-translation')).toHaveText('“Sebaik-baik orang di antara kalian adalah yang belajar Al-Qur\'an dan mengajarkannya.”');
      await expect(page.locator('.auth-quote figcaption')).toContainText('HR. Bukhari no. 5027');
      await expect(page.locator('.auth-quote figcaption')).toContainText("Dari Utsman bin 'Affan");
      await page.evaluate(()=>document.documentElement.dataset.theme='zamrud');
      assert.equal(await page.locator('.auth-layout').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(248, 249, 247)');
      const art=await page.locator('.auth-hero').boundingBox();
      await page.mouse.move(art.x+art.width*.8,art.y+art.height*.7);
      assert.notEqual(await page.locator('.auth-hero').evaluate(el=>el.style.getPropertyValue('--art-x')),'');
      await page.mouse.move(1400,20);
      assert.equal(await page.locator('.auth-hero').evaluate(el=>el.style.getPropertyValue('--art-x')),'');
      for(const width of [1440,1024,850,768,390,320]) {
        await page.setViewportSize({width,height:width>850?1000:844});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${mode} overflow at ${width}`);
        const form=await page.locator('.account-card').boundingBox(),quote=await page.locator('.auth-quote').boundingBox();
        assert.ok(form && quote);
        const hero=await page.locator('.auth-hero').boundingBox(),wallpaper=await illustration.boundingBox();
        assert.ok(hero && wallpaper && wallpaper.width>=hero.width && wallpaper.height>=hero.height,'Wallpaper must cover the entire left panel');
        if(width>850) assert.ok(quote.x+quote.width<=form.x,`${mode} must have two sides`);
        else assert.ok(quote.y>=form.y+form.height,`${mode} must put full quote after form`);
        if(width===1440 || width===390) await page.screenshot({path:`docs/phase-01/${mode}-redesign-${width===1440?'desktop':'mobile'}.png`,fullPage:true});
      }
      await page.emulateMedia({reducedMotion:'reduce'});
      assert.equal(await page.locator('.auth-artwork-depth').evaluate(el=>getComputedStyle(el).transform),'none');
      assert.equal(await page.locator('.account-card').evaluate(el=>getComputedStyle(el).animationName),'none');
      assert.equal(await illustration.evaluate(el=>getComputedStyle(el).animationName),'none');
      assert.equal(await page.locator('.auth-quote figure').evaluate(el=>getComputedStyle(el).animationName),'none');
      await page.getByLabel('Tampilkan kata sandi').click();
      await expect(page.locator('#password')).toHaveAttribute('type','text');
      await page.getByLabel('Sembunyikan kata sandi').click();
      await expect(page.locator('#password')).toHaveAttribute('type','password');
      await page.emulateMedia({reducedMotion:'no-preference'});
      console.log(`${mode}: official logo, exact hadith, responsive layout, enabled controls and reduced motion PASS`);
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
