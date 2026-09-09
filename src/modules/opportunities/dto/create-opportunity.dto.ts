import { Type } from 'class-transformer';
import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { OPPORTUNITY_STAGES } from '../opportunity-stage';
import type { OpportunityStage } from '../opportunity-stage';

export class CreateOpportunityDto {
  @IsUUID()
  customerId: string;

  // Se omitido, a oportunidade é atribuída ao próprio usuário autenticado
  // (fluxo padrão: o vendedor registra a oportunidade que ele mesmo identificou).
  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  // Se omitido, começa em NOVA.
  @IsOptional()
  @IsIn(OPPORTUNITY_STAGES)
  stage?: OpportunityStage;

  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
