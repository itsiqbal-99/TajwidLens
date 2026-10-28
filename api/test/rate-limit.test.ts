import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import {assessmentDatabase} from './assessment-fixtures';
import {PostgresThrottlerStorage} from '../src/common/postgres-throttler.storage';

test('shared database rate limit is atomic, blocks and resets',async()=>{
  const db=await assessmentDatabase();
  try {
    const storage=new PostgresThrottlerStorage(db);
    assert.equal((await storage.increment('login:client',1000,2,1000,'default')).totalHits,1);
    assert.equal((await storage.increment('login:client',1000,2,1000,'default')).isBlocked,false);
    const blocked=await storage.increment('login:client',1000,2,1000,'default');
    assert.equal(blocked.totalHits,3);assert.equal(blocked.isBlocked,true);
    await db.query('UPDATE rate_limits SET "expiresAt"=0,"blockedUntil"=NULL');
    const reset=await storage.increment('login:client',1000,2,1000,'default');
    assert.equal(reset.totalHits,1);assert.equal(reset.isBlocked,false);
  } finally {await db.destroy();}
});
