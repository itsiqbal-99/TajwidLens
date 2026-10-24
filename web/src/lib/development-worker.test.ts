import { runInNewContext } from 'node:vm';
import { expect, it } from 'vitest';
import { developmentWorkerCleanup } from './development-worker';

it('removes only this app worker and rebuildable caches before reloading development',async()=>{
  const removed:string[]=[],unregistered:string[]=[];
  let reloads=0;
  const registration=(name:string)=>({active:{scriptURL:`http://localhost:3000/${name}`},unregister:async()=>{unregistered.push(name);}});
  await runInNewContext(developmentWorkerCleanup('/sw.js'),{
    URL,navigator:{serviceWorker:{controller:{scriptURL:'http://localhost:3000/sw.js'},getRegistrations:async()=>[registration('sw.js'),registration('other-app/sw.js')]}},
    caches:{keys:async()=>['tajwidlens-pwa-v3','other-app-cache'],delete:async(key:string)=>{removed.push(key);}},
    location:{origin:'http://localhost:3000',reload:()=>{reloads++;}},
  });
  expect(unregistered).toEqual(['sw.js']);expect(removed).toEqual(['tajwidlens-pwa-v3']);expect(reloads).toBe(1);
});

it('does not disturb unrelated workers, caches or reload on subsequent loads',async()=>{
  let touched=false;
  await runInNewContext(developmentWorkerCleanup('/sw.js'),{
    URL,navigator:{serviceWorker:{getRegistrations:async()=>[{active:{scriptURL:'http://localhost:3000/other-app/sw.js'},unregister:()=>{touched=true;}}]}},
    caches:{keys:async()=>{touched=true;return [];}},location:{origin:'http://localhost:3000',reload:()=>{touched=true;}},
  });
  expect(touched).toBe(false);
});

it('works with a base path without unregistering a different TajwidLens scope',async()=>{
  const unregistered:string[]=[];
  await runInNewContext(developmentWorkerCleanup('/TajwidLens/sw.js'),{
    URL,navigator:{serviceWorker:{getRegistrations:async()=>['/sw.js','/TajwidLens/sw.js'].map(path=>({active:{scriptURL:'http://localhost:3000'+path},unregister:async()=>{unregistered.push(path);}}))}},
    caches:{keys:async()=>[]},location:{origin:'http://localhost:3000',reload:()=>{throw new Error('Not controlled');}},
  });
  expect(unregistered).toEqual(['/TajwidLens/sw.js']);
});

it('does nothing when service workers are unsupported',async()=>{
  await expect(runInNewContext(developmentWorkerCleanup('/sw.js'),{navigator:{}})).resolves.toBeUndefined();
});
