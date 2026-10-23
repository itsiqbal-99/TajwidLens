import { BadRequestException, ConflictException, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { OAuth2Client, TokenPayload, CodeChallengeMethod } from 'google-auth-library';
import { DataSource, MoreThan } from 'typeorm';
import { createHash } from 'node:crypto';
import { AppConfig, CONFIG } from '../../config/config';
import { OAuthAttempt, Session } from './auth.entity';
import { digest, secret } from './auth.service';
import { User } from '../users/user.entity';

export function requireGoogleIdentity(payload: TokenPayload | undefined, nonce: string) {
  if (!payload?.sub || !payload.email || payload.email_verified !== true ||
      (payload as TokenPayload & {nonce?:string}).nonce !== nonce) throw new BadRequestException('Identitas Google tidak dapat diverifikasi.');
  return payload;
}

@Injectable()
export class GoogleService {
  constructor(private db: DataSource,@Inject(CONFIG) private config: AppConfig) {}
  private client() {
    if (!this.config.googleClientId) throw new ServiceUnavailableException('Login Google belum tersedia.');
    return new OAuth2Client(this.config.googleClientId,this.config.googleClientSecret,`${this.config.api}/api/v1/auth/google/callback`);
  }
  async start() {
    const client = this.client();
    const state = secret(), browser = secret(), verifier = secret(), nonce = secret();
    await this.db.getRepository(OAuthAttempt).save({hash:digest(state),browserHash:digest(browser),verifier,nonce,expiresAt:new Date(Date.now()+600000)});
    const url = client.generateAuthUrl({scope:['openid','email','profile'],state,nonce,
      code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:CodeChallengeMethod.S256});
    return {url,browser};
  }
  async validateIdentity(code: string, verifier: string, nonce: string) {
    try {
      const client = this.client();
      const {tokens} = await client.getToken({code,codeVerifier:verifier});
      if (!tokens.id_token) throw new Error();
      const ticket = await client.verifyIdToken({idToken:tokens.id_token,audience:this.config.googleClientId});
      return requireGoogleIdentity(ticket.getPayload(),nonce);
    } catch { throw new BadRequestException('Identitas Google tidak dapat diverifikasi.'); }
  }
  async callback(state?: string, code?: string, browser?: string) {
    if (!state || !code || !browser || state.length > 128 || code.length > 4096) throw new BadRequestException('Callback Google tidak valid.');
    const attempt = await this.db.transaction(async em => {
      const row = await em.findOneBy(OAuthAttempt,{hash:digest(state),browserHash:digest(browser),expiresAt:MoreThan(new Date())});
      if (!row || !(await em.delete(OAuthAttempt,{hash:row.hash})).affected) throw new BadRequestException('Sesi Google kedaluwarsa atau tidak valid.');
      return row;
    });
    const identity = await this.validateIdentity(code,attempt.verifier,attempt.nonce);
    return this.db.transaction(async em => {
      let user = await em.findOneBy(User,{googleSubject:identity.sub});
      if (!user) {
        const email = identity.email!.trim().toLowerCase();
        if (await em.existsBy(User,{email})) throw new ConflictException('Gunakan metode masuk akun yang sudah ada. Akun tidak ditautkan otomatis.');
        try {
          user = await em.save(User,em.create(User,{email,googleSubject:identity.sub,nickname:(identity.given_name || identity.name || 'Pelajar').slice(0,60),
            fullName:identity.name?.slice(0,120),picture:identity.picture,emailVerifiedAt:new Date()}));
        } catch (error) {
          if ((error as {code?:string}).code === '23505') throw new ConflictException('Akun sudah tersedia. Silakan masuk kembali.');
          throw error;
        }
      }
      const token = secret();
      await em.save(Session,{hash:digest(token),userId:user.id,expiresAt:new Date(Date.now()+604800000)});
      return token;
    });
  }
}
