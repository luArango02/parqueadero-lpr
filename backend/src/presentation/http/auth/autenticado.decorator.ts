import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Rol } from '../../../domain/usuarios/rol';
import { ErrorHttpDto } from '../docs/respuestas/error-http.dto';
import { AutenticacionGuard, ROLES_PERMITIDOS } from './autenticacion.guard';

/**
 * Protege un controlador o endpoint.
 * Sin roles basta con estar autenticado.
 */
export function Autenticado(...roles: Rol[]) {
  const decoradores = [
    SetMetadata(ROLES_PERMITIDOS, roles),
    UseGuards(AutenticacionGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Falta el token de acceso o es inválido o vencido',
      type: ErrorHttpDto,
    }),
  ];

  if (roles.length > 0) {
    decoradores.push(
      ApiForbiddenResponse({
        description: `Operación permitida para los roles: ${roles.join(', ')}`,
        type: ErrorHttpDto,
      }),
    );
  }

  return applyDecorators(...decoradores);
}
