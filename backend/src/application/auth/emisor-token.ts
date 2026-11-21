import { Rol } from '../../domain/usuarios/rol';

// Lo que viaja dentro del token y queda disponible en cada petición autenticada.
export interface SesionUsuario {
  sub: string;
  email: string;
  rol: Rol;
}

export interface EmisorToken {
  emitir(sesion: SesionUsuario): Promise<string>;
}

export const EMISOR_TOKEN = Symbol('EMISOR_TOKEN');
