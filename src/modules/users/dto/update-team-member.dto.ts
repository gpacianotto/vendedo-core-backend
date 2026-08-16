import { IsIn, IsOptional } from 'class-validator';
import type { Role } from '../../../common/tenant-context/tenant-context';
import type { UserStatus } from '../user-status';

// PLATFORM_ADMIN não é atribuível por um OWNER (role global, fora do escopo de tenant).
const ASSIGNABLE_ROLES: Role[] = ['OWNER', 'SELLER'];
// UNLINKED não é atribuível aqui: tem semântica própria (POST /tenant/users/unlink),
// que também limpa tenantId e revoga sessões — não duplicar aqui.
const ASSIGNABLE_STATUSES: UserStatus[] = ['ACTIVE', 'INACTIVE'];

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsIn(ASSIGNABLE_ROLES)
  role?: Role;

  @IsOptional()
  @IsIn(ASSIGNABLE_STATUSES)
  status?: UserStatus;
}
