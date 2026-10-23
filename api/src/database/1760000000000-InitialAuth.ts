import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialAuth1760000000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(`CREATE TABLE users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email varchar NOT NULL UNIQUE,
      "passwordHash" text, "googleSubject" text UNIQUE, nickname varchar NOT NULL,
      "fullName" text, "learningGoal" text, level text, picture text,
      "emailVerifiedAt" timestamptz, "createdAt" timestamptz NOT NULL DEFAULT now()
    )`);
    await q.query(`CREATE TABLE sessions (hash varchar PRIMARY KEY, "userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, "expiresAt" timestamptz NOT NULL)`);
    await q.query(`CREATE INDEX sessions_user ON sessions ("userId")`);
    await q.query(`CREATE INDEX sessions_expiry ON sessions ("expiresAt")`);
    await q.query(`CREATE TABLE auth_tokens (hash varchar PRIMARY KEY, "userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, kind varchar NOT NULL, "expiresAt" timestamptz NOT NULL)`);
    await q.query(`CREATE INDEX tokens_user ON auth_tokens ("userId")`);
    await q.query(`CREATE INDEX tokens_expiry ON auth_tokens ("expiresAt")`);
    await q.query(`CREATE TABLE oauth_attempts (hash varchar PRIMARY KEY, "browserHash" varchar NOT NULL, verifier varchar NOT NULL, nonce varchar NOT NULL, "expiresAt" timestamptz NOT NULL)`);
    await q.query(`CREATE INDEX oauth_expiry ON oauth_attempts ("expiresAt")`);
  }
  async down() { throw new Error('Destructive rollback disabled; use a reviewed forward migration'); }
}
