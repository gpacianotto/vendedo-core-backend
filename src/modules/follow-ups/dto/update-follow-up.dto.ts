import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { FOLLOW_UP_PRIORITIES } from '../follow-up-priority';
import type { FollowUpPriority } from '../follow-up-priority';

export class UpdateFollowUpDto {
  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  type?: string;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @IsOptional()
  @IsIn(FOLLOW_UP_PRIORITIES)
  priority?: FollowUpPriority;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  // Única transição permitida por este endpoint: PENDING -> COMPLETED|CANCELED
  // (completedAt é derivado no service, nunca aceito do cliente). Reabertura
  // não é suportada aqui — ver OpportunitiesService/regra de negócio do módulo.
  @IsOptional()
  @IsIn(['COMPLETED', 'CANCELED'])
  status?: 'COMPLETED' | 'CANCELED';
}
