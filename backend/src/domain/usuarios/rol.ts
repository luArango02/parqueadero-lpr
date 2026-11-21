export const ROLES = ['ADMINISTRADOR', 'OPERADOR'] as const;
export type Rol = (typeof ROLES)[number];
