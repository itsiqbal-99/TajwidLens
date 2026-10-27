import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { CONFIG, AppConfig } from '../../config/config';

@Injectable()
export class Mailer {
  constructor(@Inject(CONFIG) private config: AppConfig) {}
  assertAvailable() {
    if (!this.config.smtpHost) throw new ServiceUnavailableException('Layanan email belum tersedia. Silakan coba lagi nanti.');
  }
  async send(email: string, kind: 'verify' | 'reset', token: string) {
    this.assertAvailable();
    const c = this.config;
    const link = `${c.frontend}/${kind === 'verify' ? 'verify-email' : 'reset-password'}/#token=${token}`;
    try {
      await nodemailer.createTransport({host:c.smtpHost, port:c.smtpPort, secure:c.smtpPort === 465,
        requireTLS:true, auth:{user:c.smtpUser,pass:c.smtpPassword},
        connectionTimeout:10000, socketTimeout:10000, tls:{rejectUnauthorized:true}}).sendMail({
        from:c.smtpFrom, to:email, subject:kind === 'verify' ? 'Verifikasi email TajwidLens' : 'Atur ulang kata sandi TajwidLens',
        text:`Buka tautan berikut untuk ${kind === 'verify' ? 'memverifikasi email (berlaku 24 jam)' : 'mengatur ulang kata sandi (berlaku 30 menit)'}:\n${link}\nAbaikan jika Anda tidak meminta ini.`,
      });
    } catch { throw new ServiceUnavailableException('Layanan email sedang tidak tersedia. Silakan coba lagi nanti.'); }
  }
}
