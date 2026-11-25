import type { EventoReciente } from '../../domain/eventos/evento-reciente';

export const TIPOS_HISTORIAL = [
  'INGRESO',
  'SALIDA',
  'INGRESO_DENEGADO',
  'SALIDA_DENEGADA',
  'PAGO',
  'ALERTA',
] as const;

export const ESTADOS_HISTORIAL = [
  'AUTORIZADO',
  'DENEGADO',
  'PENDIENTE',
  'PAGADO',
  'ANULADO',
  'VENCIDO',
  'ABIERTA',
  'RESUELTA',
] as const;

export type TipoHistorial = (typeof TIPOS_HISTORIAL)[number];
export type EstadoHistorial = (typeof ESTADOS_HISTORIAL)[number];

export interface EventoHistorial extends EventoReciente {
  estado: EstadoHistorial;
}

export interface FiltrosHistorial {
  placa?: string;
  tipo?: TipoHistorial;
  estado?: EstadoHistorial;
  desde?: Date;
  hasta?: Date;
  pagina: number;
  limite: number;
}

export interface ResultadoHistorial {
  datos: EventoHistorial[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface HistorialEventosRepositorio {
  listar(filtros: FiltrosHistorial): Promise<ResultadoHistorial>;
}

export const HISTORIAL_EVENTOS_REPOSITORIO = Symbol(
  'HISTORIAL_EVENTOS_REPOSITORIO',
);
