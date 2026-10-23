import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('sessions')
export class Session {
  @PrimaryColumn() hash!: string;
  @Column('uuid') @Index() userId!: string;
  @Column('timestamptz') expiresAt!: Date;
}

@Entity('auth_tokens')
export class AuthToken {
  @PrimaryColumn() hash!: string;
  @Column('uuid') @Index() userId!: string;
  @Column() kind!: string;
  @Column('timestamptz') expiresAt!: Date;
}

@Entity('oauth_attempts')
export class OAuthAttempt {
  @PrimaryColumn() hash!: string;
  @Column() browserHash!: string;
  @Column() verifier!: string;
  @Column() nonce!: string;
  @Column('timestamptz') expiresAt!: Date;
}
