import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Rol } from '../../../domain/usuarios/rol';
import { AutenticacionGuard, ROLES_PERMITIDOS } from './autenticacion.guard';

/**
 * Protege un controlador o un endpoint. Sin roles basta con estar autenticado.
 * Ejemplo: @Autenticado('ADMINISTRADOR')
 */
export function Autenticado(...roles: Rol[]) {
  return applyDecorators(
    SetMetadata(ROLES_PERMITIDOS, roles),
    UseGuards(AutenticacionGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Falta el token o no es válido' }),
    ApiForbiddenResponse({ description: 'El rol no tiene permiso' }),
  );
}
