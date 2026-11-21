import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { SesionUsuario } from '../../../application/auth/emisor-token';
import { Rol } from '../../../domain/usuarios/rol';

export const ROLES_PERMITIDOS = 'roles-permitidos';

export interface PeticionAutenticada extends Request {
  usuario: SesionUsuario;
}

// 401 si falta el token o no es válido; 403 si el token es válido pero el rol no alcanza.
@Injectable()
export class AutenticacionGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const peticion = contexto.switchToHttp().getRequest<PeticionAutenticada>();
    const [tipo, token] = peticion.headers.authorization?.split(' ') ?? [];
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Falta el token de acceso');
    }

    try {
      peticion.usuario = await this.jwt.verifyAsync<SesionUsuario>(token);
    } catch {
      throw new UnauthorizedException('Token inválido o vencido');
    }

    const roles = this.reflector.getAllAndOverride<Rol[] | undefined>(
      ROLES_PERMITIDOS,
      [contexto.getHandler(), contexto.getClass()],
    );
    if (roles?.length && !roles.includes(peticion.usuario.rol)) {
      throw new ForbiddenException('No tiene permisos para esta operación');
    }
    return true;
  }
}
