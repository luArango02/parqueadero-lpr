import { EstadoVehiculo } from '../../domain/vehiculos/estado-vehiculo';
import { TipoVehiculo } from '../../domain/vehiculos/placa';

export interface PermanenciaActiva {
  id: string;
  espacio: string;
  ingresoEn: Date;
}

export interface VehiculoConsultado {
  id: string;
  placa: string;
  tipo: TipoVehiculo;
  creadoEn: Date;
  estado: EstadoVehiculo;
  permanenciaActiva: PermanenciaActiva | null;
}

export interface FiltroVehiculos {
  placa?: string;
  tipo?: TipoVehiculo;
  estado?: EstadoVehiculo;
  limite: number;
}

export interface VehiculoRepositorio {
  buscarPorPlaca(placa: string): Promise<VehiculoConsultado | null>;
  listar(filtro: FiltroVehiculos): Promise<VehiculoConsultado[]>;
  /** Devuelve null si la placa ya existe. */
  crear(placa: string, tipo: TipoVehiculo): Promise<VehiculoConsultado | null>;
}

export const VEHICULO_REPOSITORIO = Symbol('VEHICULO_REPOSITORIO');
