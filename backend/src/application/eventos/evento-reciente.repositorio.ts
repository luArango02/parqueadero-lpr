import { EventoReciente } from '../../domain/eventos/evento-reciente';

/** Cada método devuelve los `limite` más recientes de su fuente, ya convertidos a EventoReciente. */
export interface EventoRecienteRepositorio {
  /** Ingresos, salidas e intentos denegados. */
  accesos(limite: number): Promise<EventoReciente[]>;
  pagos(limite: number): Promise<EventoReciente[]>;
  alertas(limite: number): Promise<EventoReciente[]>;
}

export const EVENTO_RECIENTE_REPOSITORIO = Symbol(
  'EVENTO_RECIENTE_REPOSITORIO',
);
