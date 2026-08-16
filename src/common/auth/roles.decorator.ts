import { SetMetadata } from '@nestjs/common';
import { Role } from '../tenant-context/tenant-context';

export const ROLES_KEY = 'roles';

/** Restringe uma rota às roles informadas. Sem uso = qualquer role autenticada pode acessar. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
