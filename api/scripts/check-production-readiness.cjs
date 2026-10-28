const origin=process.env.FRONTEND_URL;
if(!origin)throw new Error('FRONTEND_URL is required');
const parsed=new URL(origin);
if(parsed.protocol!=='https:'||parsed.origin!==origin.replace(/\/$/,''))throw new Error('FRONTEND_URL must be an HTTPS origin');

async function main(){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),15000);
  try {
    const response=await fetch(parsed.origin+'/api/v1/health/readiness',{headers:{accept:'application/json'},signal:controller.signal});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data.status!=='ready'||data.lessonsReady!==24||data.detectiveReady!==true)
      throw new Error('Production readiness check failed');
    console.log('Production readiness verified: database, migrations, corpus, 24 lessons and Detective.');
  } finally {clearTimeout(timeout);}
}
main().catch(()=>{console.error('Production readiness failed; deployment must not be promoted.');process.exitCode=1;});
