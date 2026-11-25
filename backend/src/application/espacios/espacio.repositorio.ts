import { EstadoAsignable, EstadoEspacio } from '../../domain/espacios/espacio';
import { TipoVehiculo } from '../../domain/vehiculos/placa';

export interface CarrilDeSede {
  id: string;
  nombre: string;
  sentido: 'ENTRADA' | 'SALIDA';
}

export interface ResumenEspacios {
  total: number;
  disponibles: number;
  ocupados: number;
  fueraDeServicio: number;
}

export interface SedeActual {
  id: string;
  nombre: string;
  zonaHoraria: string;
  inicioDiaOperativo: string;
  inicioFranjaDiurna: string;
  inicioFranjaNocturna: string;
  umbralConfianza: number;
  carriles: CarrilDeSede[];
  resumenEspacios: ResumenEspacios;
}

export interface EspacioRegistrado {
  id: string;
  codigo: string;
  zona: string;
  tipoCompatible: TipoVehiculo;
  estado: EstadoEspacio;
}

export interface EspacioRegistrado {
  id: string;
  codigo: string;
  zona: string;
  tipoCompatible: TipoVehiculo;
  estado: EstadoEspacio;
}

/** Lo que muestra el mapa: el espacio y, si está ocupado, la placa del vehículo que tiene adentro. */
export interface EspacioConPlaca extends EspacioRegistrado {
  placa: string | null;
}

export interface FiltroEspacios {
  zona?: string;
  tipo?: TipoVehiculo;
  estado?: EstadoEspacio;
}

export interface DatosEspacio {
  codigo: string;
  zona: string;
  tipoCompatible: TipoVehiculo;
}

export interface CambiosEspacio {
  estado?: EstadoAsignable;
  tipoCompatible?: TipoVehiculo;
}

export interface EspacioRepositorio {
  sedeActual(): Promise<SedeActual | null>;
  idSedeActual(): Promise<string | null>;
  listar(sedeId: string, filtro: FiltroEspacios): Promise<EspacioConPlaca[]>;
  /** Devuelve null si el código ya existe en la sede. */
  crear(
    sedeId: string,
    datos: DatosEspacio,
    usuarioId?: string,
  ): Promise<EspacioRegistrado | null>;
  buscar(id: string): Promise<EspacioRegistrado | null>;
  /** Devuelve null si el espacio está ocupado: no se modifica con un vehículo dentro. */
  actualizar(
    id: string,
    cambios: CambiosEspacio,
    usuarioId?: string,
  ): Promise<EspacioRegistrado | null>;
}

export const ESPACIO_REPOSITORIO = Symbol('ESPACIO_REPOSITORIO');
