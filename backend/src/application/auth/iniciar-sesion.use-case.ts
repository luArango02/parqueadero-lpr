import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USUARIO_REPOSITORIO } from '../usuarios/usuario.repositorio';
import type {
  Usuario,
  UsuarioRepositorio,
} from '../usuarios/usuario.repositorio';
import { CIFRADOR } from './cifrador';
import type { Cifrador } from './cifrador';
import { EMISOR_TOKEN } from './emisor-token';
import type { EmisorToken } from './emisor-token';

export interface ResultadoSesion {
  accessToken: string;
  usuario: Usuario;
}

@Injectable()
export class IniciarSesionUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORIO)
    private readonly usuarios: UsuarioRepositorio,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
    @Inject(EMISOR_TOKEN) private readonly emisor: EmisorToken,
  ) {}

  async ejecutar(email: string, password: string): Promise<ResultadoSesion> {
    const usuario = await this.usuarios.buscarPorEmail(
      email.trim().toLowerCase(),
    );
    const claveValida =
      usuario !== null &&
      (await this.cifrador.comparar(password, usuario.passwordHash));

    // Mismo mensaje para correo inexistente, clave errada o usuario inactivo:
    // así no se puede averiguar qué correos están registrados.
    if (!usuario || !claveValida || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const accessToken = await this.emisor.emitir({
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });
    return {
      accessToken,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo,
        creadoEn: usuario.creadoEn,
      },
    };
  }
}
