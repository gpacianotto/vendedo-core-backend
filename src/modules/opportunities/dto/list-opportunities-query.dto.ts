import { Type } from 'class-transformer';
import {
  IsIn,
  IsISO8601,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { OPPORTUNITY_STAGES } from '../opportunity-stage';
import type { OpportunityStage } from '../opportunity-stage';

export class ListOpportunitiesQueryDto {
  // Filtro "meu responsável": o client passa o próprio userId (de GET /me).
  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @IsOptional()
  @IsIn(OPPORTUNITY_STAGES)
  stage?: OpportunityStage;

  // Oportunidades com prazo até essa data (vencidas/vencendo).
  @IsOptional()
  @IsISO8601()
  dueBefore?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
