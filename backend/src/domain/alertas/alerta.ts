import { TipoVehiculo } from '../vehiculos/placa';

export type TipoAlerta =
  'ANTI_PASSBACK' | 'DISCREPANCIA_TIPO' | 'BAJA_CONFIANZA' | 'FALLA_CAMARA';

export const TIPOS_ALERTA: readonly TipoAlerta[] = [
  'ANTI_PASSBACK',
  'DISCREPANCIA_TIPO',
  'BAJA_CONFIANZA',
  'FALLA_CAMARA',
];

export type EstadoAlerta = 'ABIERTA' | 'RESUELTA';

export const ESTADOS_ALERTA: readonly EstadoAlerta[] = ['ABIERTA', 'RESUELTA'];

/** RN-13: hay discrepancia cuando el tipo deducido por la placa y el visual son distintos. Sin uno de los dos no se puede comparar. */
export function hayDiscrepancia(
  tipoPorPlaca: TipoVehiculo | null,
  tipoVisual: TipoVehiculo | null,
): boolean {
  return (
    tipoPorPlaca !== null && tipoVisual !== null && tipoPorPlaca !== tipoVisual
  );
}

export function detalleDiscrepancia(
  placa: string,
  tipoPorPlaca: TipoVehiculo,
  tipoVisual: TipoVehiculo,
  confianza: number,
): string {
  return `La placa ${placa} está clasificada como ${tipoPorPlaca} (por registro o formato), pero la clasificación visual indica ${tipoVisual} (confianza ${confianza})`;
}
