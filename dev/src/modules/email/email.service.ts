// email.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.transporter = createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });
  }

  private async incrementEmailCount(): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const key = `emailCount:${today}`;
    const count = await this.cacheManager.get<number>(key);

    if (count === undefined) {
      await this.cacheManager.set(key, 1, 0);
    } else {
      await this.cacheManager.set(key, count + 1, 0);
    }
  }

  private async getEmailCount(): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    const key = `emailCount:${today}`;
    return (await this.cacheManager.get<number>(key)) || 0;
  }

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    const count = await this.getEmailCount();

    if (count >= 6) {
      throw new Error('Número de emails máximo atingido');
    }

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject,
      text,
    };

    await this.transporter.sendMail(mailOptions);
    await this.incrementEmailCount();
  }
}
