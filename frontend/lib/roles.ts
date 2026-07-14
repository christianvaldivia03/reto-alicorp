// RBAC de presentación: home por rol y qué rol ve cada ruta.
// La seguridad real la impone el backend (401/403); esto es solo UX.
import { Role } from './types';

// Ruta a la que se redirige tras login y desde "/": el dashboard por rol,
// que da contexto en vez de aterrizar en un formulario suelto (G2).
export function homeForRole(_rol: Role): string {
  return '/dashboard';
}

// Roles permitidos por ruta (para el guard de presentación y la navegación).
export const ROUTE_ROLES: Record<string, Role[]> = {
  '/studio/brand': [Role.CREADOR],
  '/studio/brands': [Role.CREADOR],
  '/studio/content': [Role.CREADOR],
  '/studio/history': [Role.CREADOR],
  '/studio/approvals': [Role.APROBADOR_A],
  '/studio/audit': [Role.APROBADOR_B],
  '/admin/users': [Role.SUPERADMIN],
};

export function canAccess(rol: Role, path: string): boolean {
  const allowed = ROUTE_ROLES[path];
  return !allowed || allowed.includes(rol);
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.SUPERADMIN]: 'Superadmin',
  [Role.CREADOR]: 'Creador',
  [Role.APROBADOR_A]: 'Aprobador A',
  [Role.APROBADOR_B]: 'Aprobador B',
};
