import { EstadoDeteccion } from '../../domain/detecciones/deteccion';

export interface DeteccionPorValidar {
  id: string;
  placaLeida: string;
  placaFinal: string | null;
  confianza: number;
  estado: EstadoDeteccion;
}

export interface DatosValidacion {
  deteccionId: string;
  usuarioId: string;
  placaFinal: string;
  estado: 'ACEPTADA' | 'CORREGIDA';
  motivo: string;
  /** Valores antes de validar: quedan en la auditoría. */
  anterior: DeteccionPorValidar;
}

export interface DeteccionValidada {
  id: string;
  placaLeida: string;
  placaFinal: string | null;
  confianza: number;
  estado: EstadoDeteccion;
  lecturaManual: boolean;
  corregidaPorId: string | null;
  motivoCorreccion: string | null;
}

export interface ValidacionDeteccionRepositorio {
  buscarDeteccion(id: string): Promise<DeteccionPorValidar | null>;
  /** Devuelve null si la lectura ya no estaba pendiente (otra validación se adelantó). */
  registrarValidacion(
    datos: DatosValidacion,
  ): Promise<DeteccionValidada | null>;
}

export const VALIDACION_DETECCION_REPOSITORIO = Symbol(
  'VALIDACION_DETECCION_REPOSITORIO',
);
