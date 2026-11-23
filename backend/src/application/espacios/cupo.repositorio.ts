import { ConteoPorEstado } from '../../domain/espacios/cupos';

export interface CupoRepositorio {
  /** Cuenta los espacios de la sede actual por zona, tipo y estado. Devuelve null si no hay sede. */
  contarEspacios(): Promise<ConteoPorEstado[] | null>;
}

export const CUPO_REPOSITORIO = Symbol('CUPO_REPOSITORIO');
