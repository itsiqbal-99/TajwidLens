import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AppConfig, CONFIG } from '../../config/config';
import { DataSource, MoreThan } from 'typeorm';
import { randomBytes, createHash } from 'node:crypto';
import * as argon2 from 'argon2';
import { User } from '../users/user.entity';
import { AuthToken, Session } from './auth.entity';
import { RegisterDto } from './auth.dto';
import { Mailer } from './mailer.service';

export const secret = () => randomBytes(32).toString('base64url');
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const genericMessage = { message:'Jika alamat dapat digunakan, tautan akan dikirim ke email tersebut.' };
export const passwordOptions = { type:argon2.argon2id, memoryCost:19456, timeCost:2, parallelism:1 };
export function publicUser(u: User) {
  return {id:u.id,email:u.email,nickname:u.nickname,fullName:u.fullName,learningGoal:u.learningGoal,level:u.level,
    picture:u.picture,emailVerified:!!u.emailVerifiedAt,loginMethods:[...(u.passwordHash ? ['password'] : []),...(u.googleSubject ? ['google'] : [])]};
}

@Injectable()
export class AuthService {
  private dummyHash = argon2.hash(secret(), passwordOptions);
  constructor(private db: DataSource, private mailer: Mailer, @Inject(CONFIG) private config: AppConfig) {}
  async register(input: RegisterDto) {
    if (!this.config.allowUnverifiedEmail) this.mailer.assertAvailable();
    const passwordHash = await argon2.hash(input.password, passwordOptions);
    try {
      await this.db.transaction(async em => {
        if (await em.existsBy(User,{email:input.email})) return;
        const user = await em.save(User, em.create(User,{email:input.email,passwordHash,nickname:input.nickname,
          fullName:input.fullName,learningGoal:input.learningGoal,level:input.level}));
        if (this.config.allowUnverifiedEmail) return;
        const token = secret();
        await em.save(AuthToken,{hash:digest(token),userId:user.id,kind:'verify',expiresAt:new Date(Date.now()+86400000)});
        await this.mailer.send(user.email,'verify',token);
      });
    } catch (error) {
      if ((error as {code?:string}).code !== '23505') throw error;
    }
    return this.config.allowUnverifiedEmail
      ? {message:'Jika alamat dapat digunakan, akun siap untuk pengujian. Silakan masuk. Email belum diverifikasi.'}
      : genericMessage;
  }
  async login(email: string, password: string) {
    return this.db.transaction(async em => {
      const user = await em.getRepository(User).createQueryBuilder('u').addSelect('u.passwordHash')
        .where('u.email = :email',{email}).setLock('pessimistic_write').getOne();
      const valid = await argon2.verify(user?.passwordHash || await this.dummyHash,password);
      if (!user?.passwordHash || !valid) throw new UnauthorizedException('Email atau kata sandi tidak sesuai.');
      if (!user.emailVerifiedAt && !this.config.allowUnverifiedEmail)
        throw new UnauthorizedException('Verifikasi email Anda sebelum masuk.');
      const token = secret();
      await em.save(Session,{hash:digest(token),userId:user.id,expiresAt:new Date(Date.now()+604800000)});
      return {token,user:publicUser(user)};
    });
  }
  async authenticate(token?: string) {
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new UnauthorizedException();
    const user = await this.db.getRepository(User).createQueryBuilder('u').addSelect('u.passwordHash')
      .innerJoin(Session,'s','s.userId = u.id')
      .where('s.hash = :hash AND s.expiresAt > :now',{hash:digest(token),now:new Date()}).getOne();
    if (!user || (!user.emailVerifiedAt && !this.config.allowUnverifiedEmail)) throw new UnauthorizedException();
    return user;
  }
  async confirmPassword(userId: string, password: string) {
    const user = await this.db.getRepository(User).createQueryBuilder('u').addSelect('u.passwordHash')
      .where('u.id = :id', {id:userId}).getOne();
    const valid = await argon2.verify(user?.passwordHash || await this.dummyHash, password);
    if (!user?.passwordHash || !valid) throw new UnauthorizedException('Kata sandi tidak sesuai.');
  }
  async logout(token?: string) { if (token) await this.db.getRepository(Session).delete({hash:digest(token)}); }
  async requestToken(email: string, kind: 'reset' | 'verify') {
    this.mailer.assertAvailable();
    await this.db.transaction(async em => {
      const user = await em.getRepository(User).createQueryBuilder('u').addSelect('u.passwordHash')
        .where('u.email = :email',{email}).setLock('pessimistic_write').getOne();
      if (!user || (kind === 'reset' && !user.passwordHash) || (kind === 'verify' && user.emailVerifiedAt)) return;
      await em.delete(AuthToken,{userId:user.id,kind});
      const token = secret();
      await em.save(AuthToken,{hash:digest(token),userId:user.id,kind,expiresAt:new Date(Date.now()+(kind === 'reset' ? 1800000 : 86400000))});
      await this.mailer.send(user.email,kind,token);
    });
    return genericMessage;
  }
  async consumeToken(token: string, kind: 'verify' | 'reset', password?: string) {
    const passwordHash = password ? await argon2.hash(password,passwordOptions) : undefined;
    await this.db.transaction(async em => {
      const record = await em.findOneBy(AuthToken,{hash:digest(token),kind});
      if (!record) throw new BadRequestException('Tautan tidak berlaku atau sudah digunakan.');
      await em.findOne(User,{where:{id:record.userId},lock:{mode:'pessimistic_write'}});
      const consumed = await em.delete(AuthToken,{hash:record.hash,kind,expiresAt:MoreThan(new Date())});
      if (!consumed.affected) throw new BadRequestException('Tautan tidak berlaku atau sudah digunakan.');
      if (kind === 'verify') await em.update(User,record.userId,{emailVerifiedAt:new Date()});
      else {
        await em.update(User,record.userId,{passwordHash});
        await em.delete(Session,{userId:record.userId});
        await em.delete(AuthToken,{userId:record.userId,kind:'reset'});
      }
    });
    return {message:kind === 'verify' ? 'Email berhasil diverifikasi.' : 'Kata sandi diperbarui. Silakan masuk kembali.'};
  }
}
