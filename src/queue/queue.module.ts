import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QUEUE_NAMES } from './queue.constants';
import { EmailProducer } from './producers/email.producer';
import { EmailConsumer } from './consumers/email.consumer';
import { MailService } from '../mail/mail.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_NAMES.EMAIL,
    }),
  ],
  providers: [EmailProducer, EmailConsumer, MailService],
  exports: [EmailProducer],
})
export class QueueModule {}