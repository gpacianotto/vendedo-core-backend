import { Injectable } from '@nestjs/common';
import { MessagingProvider } from './messaging-provider';
import { normalizePhoneForWhatsApp } from './normalize-phone-for-whatsapp';

@Injectable()
export class ManualWhatsAppProvider implements MessagingProvider {
  generateContactLink(phone: string, message: string): string {
    const normalizedPhone = normalizePhoneForWhatsApp(phone);
    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  }
}
