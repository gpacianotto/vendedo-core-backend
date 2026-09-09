import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { FOLLOW_UP_STATUSES } from '../follow-up-status';
import type { FollowUpStatus } from '../follow-up-status';

// "true"/"false" de query string via Boolean() nativo converteria "false" em
// true (string não-vazia) — por isso o Transform explícito abaixo.
const parseBooleanQueryParam = ({ value }: { value: unknown }) =>
  value === true || value === 'true';

export class ListFollowUpsQueryDto {
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @IsOptional()
  @IsIn(FOLLOW_UP_STATUSES)
  status?: FollowUpStatus;

  // scheduledAt < agora e status = PENDING (BE-FU-001 / seção 9 doc frontend).
  @IsOptional()
  @Transform(parseBooleanQueryParam)
  @IsBoolean()
  overdue?: boolean;

  // scheduledAt dentro do dia corrente e status = PENDING.
  @IsOptional()
  @Transform(parseBooleanQueryParam)
  @IsBoolean()
  today?: boolean;

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
