import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    if (isNaN(smtpPort)) {
      throw new Error('SMTP_PORT environment variable is not a valid number');
    }
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendWelcomeEmail(to: string, name: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject: 'Welcome to Todo App!',
        html: `<h1>Welcome ${name}!</h1><p>Your account has been created successfully.</p>`,
      });
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject: 'Password Reset Request',
        html: `<h2>Password Reset</h2><a href="${resetUrl}">Click here to reset</a><p>Expires in 1 hour.</p>`,
      });
      this.logger.log(`Reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send reset email to ${to}`, error);
      throw error;
    }
  }
}