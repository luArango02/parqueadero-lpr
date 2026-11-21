import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Rol } from '../../domain/usuarios/rol';
import { CIFRADOR } from '../auth/cifrador';
import type { Cifrador } from '../auth/cifrador';
import { USUARIO_REPOSITORIO } from './usuario.repositorio';
import type {
  CambiosUsuario,
  Usuario,
  UsuarioRepositorio,
} from './usuario.repositorio';

export interface SolicitudNuevoUsuario {
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
}

export interface SolicitudCambioUsuario {
  nombre?: string;
  rol?: Rol;
  activo?: boolean;
  password?: string;
}

@Injectable()
export class GestionUsuariosService {
  constructor(
    @Inject(USUARIO_REPOSITORIO)
    private readonly usuarios: UsuarioRepositorio,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  listar(): Promise<Usuario[]> {
    return this.usuarios.listar();
  }

  async consultar(id: string): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async crear(
    solicitud: SolicitudNuevoUsuario,
    actorId: string,
  ): Promise<Usuario> {
    const email = solicitud.email.trim().toLowerCase();
    if (await this.usuarios.buscarPorEmail(email)) {
      throw new ConflictException('Ya existe un usuario con ese correo');
    }
    return this.usuarios.crear(
      {
        nombre: solicitud.nombre.trim(),
        email,
        rol: solicitud.rol,
        passwordHash: await this.cifrador.cifrar(solicitud.password),
      },
      actorId,
    );
  }

  async actualizar(
    id: string,
    solicitud: SolicitudCambioUsuario,
    actorId: string,
  ): Promise<Usuario> {
    await this.consultar(id);

    // Evita que el sistema se quede sin administrador por un error propio.
    const quitaSuAcceso =
      solicitud.activo === false ||
      (solicitud.rol !== undefined && solicitud.rol !== 'ADMINISTRADOR');
    if (id === actorId && quitaSuAcceso) {
      throw new BadRequestException(
        'Un administrador no puede desactivarse ni quitarse el rol a sí mismo',
      );
    }

    const cambios: CambiosUsuario = {
      nombre: solicitud.nombre?.trim(),
      rol: solicitud.rol,
      activo: solicitud.activo,
    };
    if (solicitud.password) {
      cambios.passwordHash = await this.cifrador.cifrar(solicitud.password);
    }
    return this.usuarios.actualizar(id, cambios, actorId);
  }
}
