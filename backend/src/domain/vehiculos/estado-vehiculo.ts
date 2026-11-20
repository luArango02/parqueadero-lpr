export const ESTADOS_VEHICULO = ['DENTRO', 'FUERA'] as const;
export type EstadoVehiculo = (typeof ESTADOS_VEHICULO)[number];

/** Un vehículo está DENTRO mientras tenga una permanencia sin cerrar. */
export function estadoDe(tienePermanenciaActiva: boolean): EstadoVehiculo {
  return tienePermanenciaActiva ? 'DENTRO' : 'FUERA';
}
