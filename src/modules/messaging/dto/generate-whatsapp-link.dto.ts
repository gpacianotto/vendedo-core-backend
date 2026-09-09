import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

// Mesmo padrão usado em CreateCustomerDto — dígitos e separadores comuns.
const PHONE_REGEX = /^[0-9()+\-\s]+$/;

export class GenerateWhatsAppLinkDto {
  // Informe phone OU customerId (o service resolve o telefone a partir do
  // cliente, validando o tenant, quando customerId é usado).
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(PHONE_REGEX, {
    message:
      'phone deve conter apenas dígitos e separadores comuns de telefone.',
  })
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}
