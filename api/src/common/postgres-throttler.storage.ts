import {createHash} from 'node:crypto';
import {DataSource} from 'typeorm';
import type {ThrottlerStorage} from '@nestjs/throttler';

type RateRow={hits:number;expiresAt:string|number;blockedUntil:string|number|null};

export class PostgresThrottlerStorage implements ThrottlerStorage {
  private lastCleanup=0;
  constructor(private readonly db:DataSource) {}

  async increment(key:string,ttl:number,limit:number,blockDuration:number,_throttlerName:string) {
    const now=Date.now(),expiresAt=now+ttl,blockedUntil=now+blockDuration;
    if(now-this.lastCleanup>60000) {
      this.lastCleanup=now;
      await this.db.query('DELETE FROM rate_limits WHERE "expiresAt" < $1 AND ("blockedUntil" IS NULL OR "blockedUntil" < $1)',[now-86400000]);
    }
    const hashed=createHash('sha256').update(key).digest('hex');
    let [row]=await this.db.query(`INSERT INTO rate_limits (key,hits,"expiresAt","blockedUntil")
      VALUES ($1,1,$2,NULL)
      ON CONFLICT (key) DO UPDATE SET
        hits=CASE WHEN rate_limits."expiresAt" <= $3 THEN 1 ELSE rate_limits.hits+1 END,
        "expiresAt"=CASE WHEN rate_limits."expiresAt" <= $3 THEN $2 ELSE rate_limits."expiresAt" END,
        "blockedUntil"=CASE WHEN rate_limits."expiresAt" <= $3 THEN NULL ELSE rate_limits."blockedUntil" END
      RETURNING hits,"expiresAt","blockedUntil"`,[
        hashed,expiresAt,now,
      ]) as RateRow[];
    if(Number(row.hits)>limit && Number(row.blockedUntil || 0)<=now) {
      await this.db.query('UPDATE rate_limits SET "blockedUntil"=$2 WHERE key=$1',[hashed,blockedUntil]);
      row.blockedUntil=blockedUntil;
    }
    const blockUntil=Number(row.blockedUntil || 0);
    return {
      totalHits:Number(row.hits),
      timeToExpire:Math.max(0,Number(row.expiresAt)-now),
      isBlocked:blockUntil>now,
      timeToBlockExpire:Math.max(0,blockUntil-now),
    };
  }
}
