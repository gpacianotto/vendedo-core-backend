import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppException } from '../../common/errors/app.exception';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { Customer } from '../customers/entities/customer.entity';
import { GenerateWhatsAppLinkDto } from './dto/generate-whatsapp-link.dto';
import { MESSAGING_PROVIDER } from './messaging-provider';
import type { MessagingProvider } from './messaging-provider';

export interface WhatsAppLinkResult {
  url: string;
}

@Injectable()
export class MessagingService {
  constructor(
    @Inject(MESSAGING_PROVIDER)
    private readonly messagingProvider: MessagingProvider,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async generateWhatsAppLink(
    dto: GenerateWhatsAppLinkDto,
  ): Promise<WhatsAppLinkResult> {
    const phone = await this.resolvePhone(dto);
    const url = this.messagingProvider.generateContactLink(phone, dto.message);
    return { url };
  }

  private async resolvePhone(dto: GenerateWhatsAppLinkDto): Promise<string> {
    if (dto.customerId) {
      const tenantId = this.tenantContextService.getTenantId();
      const customer = await this.customersRepository.findOne({
        where: { id: dto.customerId, tenantId },
      });
      if (!customer) {
        throw new AppException({
          status: HttpStatus.NOT_FOUND,
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Cliente não encontrado neste estabelecimento.',
        });
      }
      return customer.phone;
    }

    if (dto.phone) {
      return dto.phone;
    }

    throw new AppException({
      status: HttpStatus.BAD_REQUEST,
      code: 'PHONE_OR_CUSTOMER_REQUIRED',
      message: 'Informe phone ou customerId.',
    });
  }
}
