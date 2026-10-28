import {MigrationInterface,QueryRunner} from 'typeorm';

export class SharedRateLimits1793000000000 implements MigrationInterface {
  async up(q:QueryRunner) {
    await q.query(`CREATE TABLE rate_limits (
      key varchar(128) PRIMARY KEY,
      hits integer NOT NULL CHECK (hits > 0),
      "expiresAt" bigint NOT NULL,
      "blockedUntil" bigint
    )`);
    await q.query('CREATE INDEX rate_limits_expiry ON rate_limits ("expiresAt")');
  }
  async down(q:QueryRunner) {
    await q.query('DROP TABLE rate_limits');
  }
}
