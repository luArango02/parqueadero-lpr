export type TipoVehiculo = 'CARRO' | 'MOTO'
export type EstadoBarrera = 'ABIERTA' | 'CERRADA'
export type Carril = 'ENTRADA' | 'SALIDA'

export interface BarreraActualizada {
  carril: Carril
  estado: EstadoBarrera
  motivo: string
  placa: string
  ocurridoEn: string
}

export interface AccesoIngreso {
  placa: string
  tipoVehiculo: TipoVehiculo | null
  /** Código del espacio asignado (A-01, M-02...). */
  espacio: string | null
  cobro: { id: string; valor: number; franja: string; estado: string; diaOperativo: string } | null
  reingreso: boolean
  ocurridoEn: string
}

export interface AccesoSalida {
  placa: string
  tipoVehiculo: TipoVehiculo | null
  /** Código del espacio que queda libre. */
  espacioLiberado: string | null
  minutosDentro: number | null
  ocurridoEn: string
}

export interface ConteoEspacios {
  total: number
  disponibles: number
  ocupados: number
  fueraDeServicio: number
}

export interface OcupacionActualizada extends ConteoEspacios {
  porTipo: Record<TipoVehiculo, ConteoEspacios>
  actualizadoEn: string
}

/** Nombre del evento -> datos que trae. Es la única lista de eventos que usa el frontend. */
export interface EventosServidor {
  'barrera:actualizada': BarreraActualizada
  'acceso:ingreso': AccesoIngreso
  'acceso:salida': AccesoSalida
  'ocupacion:actualizada': OcupacionActualizada
}

export type NombreEvento = keyof EventosServidor

/**
 * Socket.IO reconecta solo cuando la conexión se cae por la red.
 * Si es el servidor quien cierra la conexión, el cliente no reintenta: hay que llamar connect() a mano.
 */
export function debeReconectarManualmente(motivo: string): boolean {
  return motivo === 'io server disconnect'
}