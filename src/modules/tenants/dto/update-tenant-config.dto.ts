import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsHexColor,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class BrandingDto {
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;
}

class JoinPolicyDto {
  @IsOptional()
  @IsBoolean()
  allowSelfRegistration?: boolean;

  @IsOptional()
  @IsBoolean()
  inviteCodeRequired?: boolean;
}

// Deliberadamente sem `whatsappOfficialApi`: essa feature ainda não existe
// funcionalmente no MVP, então não é exposta como algo que o OWNER possa
// ligar/desligar por conta própria (seção "features permitidas ao tenant").
class FeaturesDto {
  @IsOptional()
  @IsBoolean()
  whatsappManualLink?: boolean;
}

export class UpdateTenantConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BrandingDto)
  branding?: BrandingDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => JoinPolicyDto)
  joinPolicy?: JoinPolicyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FeaturesDto)
  features?: FeaturesDto;
}
