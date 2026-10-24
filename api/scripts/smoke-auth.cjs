// Uses the configured database read-only. The child server is isolated from development ports.
const {spawn} = require('node:child_process');
const assert = require('node:assert/strict');
const {resolve} = require('node:path');

(async()=>{
  const server=spawn(process.execPath,[resolve(__dirname,'../dist/main.js')],{
    cwd:resolve(__dirname,'..'),stdio:'ignore',windowsHide:true,
    env:{...process.env,NODE_ENV:'development',PORT:'4102',API_URL:'http://localhost:4102',SMTP_HOST:'',AUTH_ALLOW_UNVERIFIED_EMAIL:'true'},
  });
  server.on('error',error=>console.error('Child startup error:',error.code));
  try {
    let ready=false;
    for(let attempt=0;attempt<120;attempt++) {
      try {const response=await fetch('http://localhost:4102/api/v1/health',{signal:AbortSignal.timeout(2000)});if(response.ok){ready=true;break;}} catch {}
      if(server.exitCode !== null) break;
      await new Promise(done=>setTimeout(done,1000));
    }
    assert.ok(ready,'Backend must start with configured Neon and no SMTP');
    const status=await fetch('http://localhost:4102/api/v1/auth/status').then(response=>response.json());
    assert.equal(status.emailDelivery,false);assert.equal(status.developmentRegistration,true);
    assert.equal((await fetch('http://localhost:4102/api/v1/auth/me')).status,401);
    const recovery=await fetch('http://localhost:4102/api/v1/auth/password/forgot',{
      method:'POST',headers:{Origin:'http://localhost:3000','Content-Type':'application/json','X-TajwidLens-CSRF':'1'},body:JSON.stringify({email:'smoke@example.invalid'}),
    });
    assert.equal(recovery.status,503);
    console.log('Live Neon startup without SMTP, capabilities, unauthorized session and deferred recovery PASS');
    console.log('Google configured:',status.google,'; live consent/callback not exercised.');
  } finally {server.kill();}
})().catch(error=>{console.error('Live startup smoke FAILED:',error instanceof assert.AssertionError ? error.message : 'Check local configuration.');process.exitCode=1;});
