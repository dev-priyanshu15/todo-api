import { Processor, Process, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { MailService } from '../../mail/mail.service';
import { QUEUE_NAMES, JOB_NAMES } from '../queue.constants';

@Processor(QUEUE_NAMES.EMAIL)
export class EmailConsumer {
  private readonly logger = new Logger(EmailConsumer.name);

  constructor(private mailService: MailService) {}

  @Process(JOB_NAMES.WELCOME_EMAIL)
  async handleWelcomeEmail(job: Job<{ to: string; name: string }>) {
    this.logger.log(`Processing welcome email for ${job.data.to}`);
    await this.mailService.sendWelcomeEmail(job.data.to, job.data.name);
  }

  @Process(JOB_NAMES.PASSWORD_RESET_EMAIL)
  async handlePasswordResetEmail(job: Job<{ to: string; token: string }>) {
    this.logger.log(`Processing reset email for ${job.data.to}`);
    await this.mailService.sendPasswordResetEmail(job.data.to, job.data.token);
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} (${job.name}) completed`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}