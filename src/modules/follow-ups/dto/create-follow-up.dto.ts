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

export class CreateFollowUpDto {
  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  // Se omitido, o follow-up é atribuído ao próprio usuário autenticado
  // (mesmo raciocínio de sellerId em 06-opportunities.md).
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  type: string;

  @IsISO8601()
  scheduledAt: string;

  // Se omitido, assume NORMAL.
  @IsOptional()
  @IsIn(FOLLOW_UP_PRIORITIES)
  priority?: FollowUpPriority;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
