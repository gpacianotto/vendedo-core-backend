import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { ManualWhatsAppProvider } from './manual-whatsapp.provider';
import { MessagingController } from './messaging.controller';
import { MESSAGING_PROVIDER } from './messaging-provider';
import { MessagingService } from './messaging.service';

@Module({
  imports: [CustomersModule],
  controllers: [MessagingController],
  providers: [
    MessagingService,
    { provide: MESSAGING_PROVIDER, useClass: ManualWhatsAppProvider },
  ],
})
export class MessagingModule {}
