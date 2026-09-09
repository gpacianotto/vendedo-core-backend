import { Body, Controller, Post } from '@nestjs/common';
import { GenerateWhatsAppLinkDto } from './dto/generate-whatsapp-link.dto';
import { MessagingService, WhatsAppLinkResult } from './messaging.service';

@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('whatsapp-link')
  generateWhatsAppLink(
    @Body() dto: GenerateWhatsAppLinkDto,
  ): Promise<WhatsAppLinkResult> {
    return this.messagingService.generateWhatsAppLink(dto);
  }
}
