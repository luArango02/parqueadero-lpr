import {
  EstadoDeteccion,
  OrigenLectura,
} from '../../domain/detecciones/deteccion';
import { TipoVehiculo } from '../../domain/vehiculos/placa';

export interface SedeDeLectura {
  id: string;
  umbralConfianza: number;
}

export interface DatosDeteccion {
  carrilId: string;
  placaLeida: string;
  confianza: number;
  tipoVisual: TipoVehiculo | null;
  origen: OrigenLectura;
  estado: EstadoDeteccion;
  ocurridaEn: Date;
}

export interface DeteccionRegistrada extends DatosDeteccion {
  id: string;
}

export interface DeteccionRepositorio {
  sedeDeLectura(): Promise<SedeDeLectura>;
  /** Con carrilId valida que exista en la sede; sin él usa el primer carril de entrada. */
  carrilDeLectura(sedeId: string, carrilId?: string): Promise<string>;
  guardar(datos: DatosDeteccion): Promise<DeteccionRegistrada>;
}

export const DETECCION_REPOSITORIO = Symbol('DETECCION_REPOSITORIO');
