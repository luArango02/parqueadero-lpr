// Lógica del mapa de espacios, sin Vue ni red: así se puede probar sola.

export type EstadoEspacio = 'DISPONIBLE' | 'OCUPADO' | 'FUERA_DE_SERVICIO'
export type TipoVehiculo = 'CARRO' | 'MOTO'

export interface Espacio {
  id: string
  codigo: string
  zona: string
  tipoCompatible: TipoVehiculo
  estado: EstadoEspacio
  /** Placa del vehículo estacionado; null si el espacio no está ocupado. */
  placa: string | null
}

export interface ZonaMapa {
  zona: string
  tipos: TipoVehiculo[]
  espacios: Espacio[]
  libres: number
  ocupados: number
  fueraDeServicio: number
}

// Cada estado se distingue por color (clase CSS) Y por texto: el color nunca es lo único que informa.
export const ESTADOS_VISUALES: Record<EstadoEspacio, { etiqueta: string; clase: string }> = {
  DISPONIBLE: { etiqueta: 'LIBRE', clase: 'libre' },
  OCUPADO: { etiqueta: 'OCUPADO', clase: 'ocupado' },
  FUERA_DE_SERVICIO: { etiqueta: 'FUERA DE SERVICIO', clase: 'fuera' },
}

// Orden fijo para la leyenda.
export const ESTADOS_LEYENDA: EstadoEspacio[] = ['DISPONIBLE', 'OCUPADO', 'FUERA_DE_SERVICIO']

/** Agrupa los espacios por zona (A, M, ...) con sus conteos. Zonas y espacios salen ordenados. */
export function agruparPorZona(espacios: Espacio[]): ZonaMapa[] {
  const porZona = new Map<string, Espacio[]>()
  for (const espacio of espacios) {
    porZona.set(espacio.zona, [...(porZona.get(espacio.zona) ?? []), espacio])
  }
  return [...porZona.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([zona, lista]) => {
      const ordenados = [...lista].sort((a, b) => a.codigo.localeCompare(b.codigo))
      const cuantos = (estado: EstadoEspacio) => ordenados.filter((e) => e.estado === estado).length
      return {
        zona,
        tipos: [...new Set(ordenados.map((e) => e.tipoCompatible))],
        espacios: ordenados,
        libres: cuantos('DISPONIBLE'),
        ocupados: cuantos('OCUPADO'),
        fueraDeServicio: cuantos('FUERA_DE_SERVICIO'),
      }
    })
}

/** Evento 'acceso:ingreso' del backend: `espacio` es el código del espacio asignado. */
export function aplicarIngreso(
  espacios: Espacio[],
  evento: { espacio: string | null; placa: string },
): Espacio[] {
  if (!evento.espacio) return espacios
  return espacios.map((e) =>
    e.codigo === evento.espacio ? { ...e, estado: 'OCUPADO', placa: evento.placa } : e,
  )
}

/** Evento 'acceso:salida' del backend: `espacioLiberado` es el código del espacio que queda libre. */
export function aplicarSalida(
  espacios: Espacio[],
  evento: { espacioLiberado: string | null },
): Espacio[] {
  if (!evento.espacioLiberado) return espacios
  return espacios.map((e) =>
    e.codigo === evento.espacioLiberado ? { ...e, estado: 'DISPONIBLE', placa: null } : e,
  )
}