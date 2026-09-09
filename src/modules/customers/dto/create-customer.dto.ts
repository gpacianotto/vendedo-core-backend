import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

// Aceita dígitos, espaços e os separadores comuns de telefone (+55 (11) 91234-5678).
const PHONE_REGEX = /^[0-9()+\-\s]+$/;

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @Matches(PHONE_REGEX, {
    message:
      'phone deve conter apenas dígitos e separadores comuns de telefone.',
  })
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
