import type { BarreraActualizada, Carril, EstadoBarrera } from './eventos'

/** Lo último que se sabe de la barrera de un carril. */
export interface EstadoCarril {
  estado: EstadoBarrera | null
  placa: string | null
  motivo: string | null
  ocurridoEn: string | null
}

export const CARRIL_SIN_LECTURAS: EstadoCarril = {
  estado: null,
  placa: null,
  motivo: null,
  ocurridoEn: null,
}

/** Aplica un evento `barrera:actualizada` al carril indicado; los eventos de otro carril se ignoran. */
export function aplicarBarrera(
  actual: EstadoCarril,
  evento: BarreraActualizada,
  carril: Carril,
): EstadoCarril {
  if (evento.carril !== carril) return actual
  return {
    estado: evento.estado,
    placa: evento.placa,
    motivo: evento.motivo,
    ocurridoEn: evento.ocurridoEn,
  }
}