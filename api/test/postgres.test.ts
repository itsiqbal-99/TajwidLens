import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { readConfig } from '../src/config/config';
import { User } from '../src/modules/users/user.entity';
import { Session, AuthToken, OAuthAttempt } from '../src/modules/auth/auth.entity';
import { InitialAuth1760000000000 } from '../src/database/1760000000000-InitialAuth';

test('real PostgreSQL migrations and persistence',{skip:!process.env.TEST_DATABASE_URL},async()=>{
  const url=new URL(process.env.TEST_DATABASE_URL!);
  assert.match(url.pathname,/_test$/,'Use a dedicated database whose name ends in _test');
  assert.notEqual(process.env.TEST_DATABASE_URL,process.env.DATABASE_URL,'Never use application database');
  const config=readConfig({DATABASE_URL:url.toString()});
  const db=new DataSource({type:'postgres',url:config.databaseUrl,ssl:config.ssl,entities:[User,Session,AuthToken,OAuthAttempt],
    migrations:[InitialAuth1760000000000],synchronize:false,migrationsRun:false});
  await db.initialize();
  try {
    await db.runMigrations();
    const runner=db.createQueryRunner();await runner.connect();await runner.startTransaction();
    try {
      const user=await runner.manager.save(User,runner.manager.create(User,{email:`${randomUUID()}@example.com`,nickname:'Integration'}));
      assert.equal((await runner.manager.findOneByOrFail(User,{id:user.id})).nickname,'Integration');
    } finally {await runner.rollbackTransaction();await runner.release();}
  } finally {await db.destroy();}
});
