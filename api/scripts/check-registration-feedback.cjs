// UI-only request fixtures; creates no accounts and never contacts SMTP.
const {chromium,expect}=require('@playwright/test');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const headers={'Access-Control-Allow-Origin':'http://localhost:3000','Access-Control-Allow-Credentials':'true'};
    await page.route('**/api/v1/auth/status',r=>r.fulfill({headers,json:{google:true,emailRegistration:true,emailDelivery:true,developmentRegistration:false}}));
    await page.route('**/api/v1/auth/me',r=>r.fulfill({headers,status:401,json:{message:'Unauthorized'}}));
    let failed=true,requests=0;
    await page.route('**/api/v1/auth/register',r=>{
      if(r.request().method()==='OPTIONS') return r.fulfill({status:204,headers:{...headers,'Access-Control-Allow-Headers':'Content-Type,X-TajwidLens-CSRF','Access-Control-Allow-Methods':'POST'}});
      requests++;
      return r.fulfill({headers,status:failed?503:202,json:{message:failed?'Layanan sementara tidak tersedia. Coba lagi.':'Jika alamat dapat digunakan, tautan akan dikirim ke email tersebut.'}});
    });
    await page.goto('http://localhost:3000/register/?next=/learn/',{waitUntil:'domcontentloaded',timeout:60000});
    await page.getByLabel('Nama panggilan',{exact:true}).fill('Pelajar');
    await page.getByLabel('Email',{exact:true}).fill('fixture@example.com');
    await page.getByLabel('Kata sandi',{exact:true}).fill('fixture password 123');
    await page.getByRole('button',{name:'Daftar',exact:true}).click();
    await expect(page.locator('.account-error')).toContainText('Layanan sementara');
    await expect(page.getByLabel('Email',{exact:true})).toHaveValue('fixture@example.com');
    await expect(page.getByLabel('Kata sandi',{exact:true})).toHaveValue('fixture password 123');
    failed=false;
    await page.getByRole('button',{name:'Daftar',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Pendaftaran diterima.',exact:true})).toBeVisible();
    await expect(page.locator('.account-registration-status')).toBeFocused();
    await expect(page.locator('form')).toHaveCount(0);
    await expect(page.locator('.account-registration-status')).toContainText('Jika alamat dapat digunakan');
    await expect(page.getByRole('link',{name:'Lanjut ke halaman masuk',exact:true})).toHaveAttribute('href','/login/?next=%2Flearn%2F');
    for(const width of [1440,768,390,320]) {
      await page.setViewportSize({width,height:900});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      if(width===1440||width===390) await page.screenshot({path:`docs/phase-01/registration-complete-${width===1440?'desktop':'mobile'}.png`,fullPage:true});
    }
    await page.getByRole('button',{name:'Daftar akun lain',exact:true}).click();
    for(const label of ['Nama panggilan','Email','Kata sandi']) await expect(page.getByLabel(label,{exact:true})).toHaveValue('');
    await expect(page.locator('#password')).toHaveAttribute('type','password');
    assert.equal(requests,2,'No automatic repeat registration');
    console.log('Registration UI fixture PASS: failed input retained, success announced/focused, form cleared, safe next link, four widths, no duplicate submit');
  } finally {await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
