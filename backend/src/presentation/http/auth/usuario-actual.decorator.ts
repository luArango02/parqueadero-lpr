import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { SesionUsuario } from '../../../application/auth/emisor-token';
import { PeticionAutenticada } from './autenticacion.guard';

// Entrega la sesión que el guard dejó en la petición: @UsuarioActual() sesion
export const UsuarioActual = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): SesionUsuario =>
    contexto.switchToHttp().getRequest<PeticionAutenticada>().usuario,
);
