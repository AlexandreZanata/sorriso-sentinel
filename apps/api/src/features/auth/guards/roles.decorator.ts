import { SetMetadata } from '@nestjs/common';
import type { AuthRole } from '@sorriso-sentinel/shared';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: AuthRole[]) => SetMetadata(ROLES_KEY, roles);
