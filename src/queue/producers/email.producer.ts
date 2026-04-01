import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { QUEUE_NAMES, JOB_NAMES } from '../queue.constants';

@Injectable()
export class EmailProducer {
  private readonly logger = new Logger(EmailProducer.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL) private emailQueue: Queue,
  ) {}

  async sendWelcomeEmail(data: { to: string; name: string }) {
    const job = await this.emailQueue.add(
      JOB_NAMES.WELCOME_EMAIL,
      data,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    this.logger.log(`Welcome email job added: ${job.id}`);
    return job;
  }

  async sendPasswordResetEmail(data: { to: string; token: string }) {
    const job = await this.emailQueue.add(
      JOB_NAMES.PASSWORD_RESET_EMAIL,
      data,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    this.logger.log(`Password reset email job added: ${job.id}`);
    return job;
  }
}