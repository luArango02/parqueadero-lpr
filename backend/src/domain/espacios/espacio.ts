import { TipoVehiculo } from '../vehiculos/placa';

export type EstadoEspacio = 'DISPONIBLE' | 'OCUPADO' | 'FUERA_DE_SERVICIO';

export const ESTADOS_ESPACIO: readonly EstadoEspacio[] = [
  'DISPONIBLE',
  'OCUPADO',
  'FUERA_DE_SERVICIO',
];

// OCUPADO no se fija a mano: lo decide el sistema al registrar ingresos y salidas.
export const ESTADOS_ASIGNABLES = ['DISPONIBLE', 'FUERA_DE_SERVICIO'] as const;
export type EstadoAsignable = (typeof ESTADOS_ASIGNABLES)[number];

export const TIPOS_COMPATIBLES: readonly TipoVehiculo[] = ['CARRO', 'MOTO'];

export function normalizarZona(zona: string): string {
  return zona.trim().toUpperCase();
}

/** Una zona es una sola letra (A, M, ...). */
export function esZonaValida(zona: string): boolean {
  return /^[A-Z]$/.test(zona);
}

/** Código del espacio dentro de su zona: zona A, número 1 -> A-01. */
export function codigoDeEspacio(zona: string, numero: number): string {
  return `${zona}-${String(numero).padStart(2, '0')}`;
}
