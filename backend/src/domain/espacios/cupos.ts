import { TipoVehiculo } from '../vehiculos/placa';
import { EstadoEspacio, TIPOS_COMPATIBLES } from './espacio';

/** Cuántos espacios de una zona y tipo están en un estado. Sale de contar los espacios, no de un contador. */
export interface ConteoPorEstado {
  zona: string;
  tipo: TipoVehiculo;
  estado: EstadoEspacio;
  cantidad: number;
}

export interface Cupo {
  total: number;
  disponibles: number;
  ocupados: number;
  fueraDeServicio: number;
  /** LLENO: no queda ningún espacio disponible en esta categoría. */
  lleno: boolean;
}

export interface CupoPorTipo extends Cupo {
  tipo: TipoVehiculo;
}

export interface CupoPorZona extends Cupo {
  zona: string;
  tipo: TipoVehiculo;
}

function resumir(conteos: ConteoPorEstado[]): Cupo {
  // Math.max: la disponibilidad nunca es negativa, ni siquiera con datos inconsistentes.
  const sumar = (estado: EstadoEspacio): number =>
    conteos
      .filter((c) => c.estado === estado)
      .reduce((suma, c) => suma + Math.max(0, c.cantidad), 0);

  const disponibles = sumar('DISPONIBLE');
  const ocupados = sumar('OCUPADO');
  const fueraDeServicio = sumar('FUERA_DE_SERVICIO');
  return {
    total: disponibles + ocupados + fueraDeServicio,
    disponibles,
    ocupados,
    fueraDeServicio,
    lleno: disponibles === 0,
  };
}

/** Un elemento por tipo de vehículo, aunque no tenga espacios. LLENO solo en el tipo sin disponibles. */
export function cuposPorTipo(conteos: ConteoPorEstado[]): CupoPorTipo[] {
  return TIPOS_COMPATIBLES.map((tipo) => ({
    tipo,
    ...resumir(conteos.filter((c) => c.tipo === tipo)),
  }));
}

/** Un elemento por zona y tipo, ordenado por zona. */
export function disponibilidadPorZona(
  conteos: ConteoPorEstado[],
): CupoPorZona[] {
  const grupos = new Map<string, { zona: string; tipo: TipoVehiculo }>();
  for (const c of conteos) {
    grupos.set(`${c.zona}|${c.tipo}`, { zona: c.zona, tipo: c.tipo });
  }
  return [...grupos.values()]
    .sort(
      (a, b) => a.zona.localeCompare(b.zona) || a.tipo.localeCompare(b.tipo),
    )
    .map(({ zona, tipo }) => ({
      zona,
      tipo,
      ...resumir(conteos.filter((c) => c.zona === zona && c.tipo === tipo)),
    }));
}
