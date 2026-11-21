import { Rol } from '../../domain/usuarios/rol';

// Nunca incluye el hash: es lo que sale hacia la API.
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  creadoEn: Date;
}

export interface UsuarioConClave extends Usuario {
  passwordHash: string;
}

export interface DatosNuevoUsuario {
  nombre: string;
  email: string;
  passwordHash: string;
  rol: Rol;
}

export interface CambiosUsuario {
  nombre?: string;
  rol?: Rol;
  activo?: boolean;
  passwordHash?: string;
}

export interface UsuarioRepositorio {
  buscarPorEmail(email: string): Promise<UsuarioConClave | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
  listar(): Promise<Usuario[]>;
  /** Guarda el usuario y su registro de auditoría en la misma transacción. */
  crear(datos: DatosNuevoUsuario, actorId: string): Promise<Usuario>;
  /** Igual que crear: el cambio y la auditoría van juntos. */
  actualizar(
    id: string,
    cambios: CambiosUsuario,
    actorId: string,
  ): Promise<Usuario>;
}

export const USUARIO_REPOSITORIO = Symbol('USUARIO_REPOSITORIO');
