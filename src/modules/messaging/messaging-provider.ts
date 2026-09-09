// Interface desacoplada (seção 14 do doc de backend): MVP usa ManualWhatsAppProvider
// (deep-link wa.me); um futuro MetaWhatsAppProvider (API oficial) implementa a
// mesma interface sem exigir mudanças no MessagingService/controller.
export interface MessagingProvider {
  generateContactLink(phone: string, message: string): string;
}

export const MESSAGING_PROVIDER = Symbol('MESSAGING_PROVIDER');
