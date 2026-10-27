import { BadRequestException, ConflictException, Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { OAuth2Client, TokenPayload, CodeChallengeMethod } from 'google-auth-library';
import { DataSource, MoreThan } from 'typeorm';
import { createHash } from 'node:crypto';
import { AppConfig, CONFIG } from '../../config/config';
import { AuthToken, OAuthAttempt, Session } from './auth.entity';
import { digest, secret } from './auth.service';
import { User } from '../users/user.entity';

export class GoogleAuthError extends BadRequestException {
  constructor(public readonly reason:'google_session'|'google_code'|'google_configuration'|'google_unavailable'|'google_identity'|'google_link_mismatch',message:string) {super(message);}
}

export function requireGoogleIdentity(payload: TokenPayload | undefined, nonce: string) {
  if (!payload?.sub || !payload.email || payload.email_verified !== true ||
      (payload as TokenPayload & {nonce?:string}).nonce !== nonce) throw new BadRequestException('Identitas Google tidak dapat diverifikasi.');
  return payload;
}

@Injectable()
export class GoogleService {
  private readonly logger = new Logger(GoogleService.name);
  constructor(private db: DataSource,@Inject(CONFIG) private config: AppConfig) {}
  private client() {
    if (!this.config.googleClientId) throw new ServiceUnavailableException('Login Google belum tersedia.');
    return new OAuth2Client(this.config.googleClientId,this.config.googleClientSecret,`${this.config.api}/api/v1/auth/google/callback`);
  }
  async start(linkUserId?: string) {
    const client = this.client();
    const state = secret(), browser = secret(), verifier = secret(), nonce = secret();
    await this.db.transaction(async em => {
      const expiresAt = new Date(Date.now()+600000);
      await em.save(OAuthAttempt,{hash:digest(state),browserHash:digest(browser),verifier,nonce,expiresAt});
      if (linkUserId) await em.save(AuthToken,{hash:digest(state),userId:linkUserId,kind:'google-link',expiresAt});
    });
    const url = client.generateAuthUrl({scope:['openid','email','profile'],state,nonce,
      code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:CodeChallengeMethod.S256});
    return {url,browser,state};
  }
  async validateIdentity(code: string, verifier: string, nonce: string) {
    let stage = 'code_exchange';
    try {
      const client = this.client();
      const {tokens} = await client.getToken({code,codeVerifier:verifier});
      stage = 'id_token_validation';
      if (!tokens.id_token) throw new Error();
      const ticket = await client.verifyIdToken({idToken:tokens.id_token,audience:this.config.googleClientId});
      return requireGoogleIdentity(ticket.getPayload(),nonce);
    } catch (error) {
      const providerError = (error as {response?:{data?:{error?:unknown}}})?.response?.data?.error;
      const reason = stage !== 'code_exchange' ? 'google_identity'
        : ['invalid_client','unauthorized_client','redirect_uri_mismatch'].includes(String(providerError)) ? 'google_configuration'
        : providerError === 'invalid_grant' ? 'google_code' : 'google_unavailable';
      // Never log provider responses: they can contain authorization codes, tokens and secrets.
      this.logger.warn(`Google ${stage} rejected (${reason})`);
      throw new GoogleAuthError(reason,'Identitas Google tidak dapat diverifikasi.');
    }
  }
  async callback(state?: string, code?: string, browser?: string, sessionToken?: string) {
    if (typeof state !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(state) || typeof browser !== 'string' || !browser) throw new GoogleAuthError('google_session','Sesi Google tidak valid.');
    if (typeof code !== 'string' || !code || code.length > 4096) throw new GoogleAuthError('google_code','Kode Google tidak valid.');
    const attempt = await this.db.transaction(async em => {
      const row = await em.findOneBy(OAuthAttempt,{hash:digest(state),browserHash:digest(browser),expiresAt:MoreThan(new Date())});
      if (!row || !(await em.delete(OAuthAttempt,{hash:row.hash})).affected) throw new GoogleAuthError('google_session','Sesi Google kedaluwarsa atau tidak valid.');
      const link = await em.findOneBy(AuthToken,{hash:row.hash,kind:'google-link'});
      if (link) {
        const session = sessionToken && await em.findOneBy(Session,{hash:digest(sessionToken),userId:link.userId,expiresAt:MoreThan(new Date())});
        if (link.expiresAt <= new Date() || !session) throw new GoogleAuthError('google_session','Sesi penautan Google kedaluwarsa.');
        if (!(await em.delete(AuthToken,{hash:link.hash,kind:'google-link'})).affected) throw new GoogleAuthError('google_session','Sesi penautan sudah digunakan.');
      }
      return {...row,linkUserId:link?.userId};
    });
    const identity = await this.validateIdentity(code,attempt.verifier,attempt.nonce);
    return this.db.transaction(async em => {
      if (attempt.linkUserId) {
        const user = await em.findOne(User,{where:{id:attempt.linkUserId},lock:{mode:'pessimistic_write'}});
        if (!user || user.email !== identity.email!.trim().toLowerCase() || (user.googleSubject && user.googleSubject !== identity.sub))
          throw new GoogleAuthError('google_link_mismatch','Gunakan akun Google dengan email yang sama.');
        try { await em.update(User,user.id,{googleSubject:identity.sub,emailVerifiedAt:user.emailVerifiedAt || new Date()}); }
        catch (error) {
          if ((error as {code?:string}).code === '23505') throw new GoogleAuthError('google_link_mismatch','Akun Google sudah terhubung ke akun lain.');
          throw error;
        }
        const token = secret();
        await em.save(Session,{hash:digest(token),userId:user.id,expiresAt:new Date(Date.now()+604800000)});
        return {token,isNewUser:false,linked:true};
      }
      let user = await em.findOneBy(User,{googleSubject:identity.sub});
      const isNewUser = !user;
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
      return {token,isNewUser,linked:false};
    });
  }
}
