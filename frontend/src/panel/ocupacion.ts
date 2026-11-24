// Lógica del panel de ocupación, sin Vue ni red: así se puede probar sola.

export type TipoVehiculo = 'CARRO' | 'MOTO'

/** Un elemento de GET /api/cupos: sale de contar los espacios individuales en el backend. */
export interface Cupo {
  tipo: TipoVehiculo
  total: number
  disponibles: number
  ocupados: number
  fueraDeServicio: number
  /** LLENO: no queda ningún espacio disponible en la categoría. */
  lleno: boolean
}

export type TipoEvento =
  | 'INGRESO'
  | 'SALIDA'
  | 'INGRESO_DENEGADO'
  | 'SALIDA_DENEGADA'
  | 'PAGO'
  | 'ALERTA'

/** Un elemento de GET /api/eventos/recientes. */
export interface EventoReciente {
  id: string
  tipo: TipoEvento
  placa: string | null
  detalle: string
  ocurridoEn: string
}

export const ETIQUETAS_CATEGORIA: Record<TipoVehiculo, string> = {
  CARRO: 'Carros',
  MOTO: 'Motos',
}

// Cada tipo de evento se distingue por color (clase CSS) Y por texto.
export const EVENTOS_VISUALES: Record<TipoEvento, { etiqueta: string; clase: string }> = {
  INGRESO: { etiqueta: 'Ingreso', clase: 'ok' },
  SALIDA: { etiqueta: 'Salida', clase: 'ok' },
  INGRESO_DENEGADO: { etiqueta: 'Ingreso denegado', clase: 'denegado' },
  SALIDA_DENEGADA: { etiqueta: 'Salida denegada', clase: 'denegado' },
  PAGO: { etiqueta: 'Pago', clase: 'info' },
  ALERTA: { etiqueta: 'Alerta', clase: 'alerta' },
}

/**
 * Porcentaje de ocupación sobre los espacios en servicio (disponibles + ocupados).
 * Se redondea hacia abajo: 100 % significa de verdad LLENO, nunca 99,6 % redondeado.
 * Nunca es negativo ni pasa de 100, aunque lleguen datos inconsistentes.
 */
export function porcentajeOcupacion(cupo: Pick<Cupo, 'disponibles' | 'ocupados'>): number {
  const disponibles = Math.max(0, cupo.disponibles)
  const ocupados = Math.max(0, cupo.ocupados)
  const enServicio = disponibles + ocupados
  if (enServicio === 0) return 0
  return Math.min(100, Math.floor((ocupados / enServicio) * 100))
}