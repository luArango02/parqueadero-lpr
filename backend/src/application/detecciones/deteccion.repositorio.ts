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

/** Alerta que se guarda junto con la detección cuando el tipo por placa y el visual no coinciden. */
export interface DatosDiscrepancia {
  sedeId: string;
  placa: string;
  detalle: string;
}

export interface DeteccionGuardada extends DeteccionRegistrada {
  alertaId: string | null;
}

export interface DeteccionRepositorio {
  sedeDeLectura(): Promise<SedeDeLectura>;
  /** Con carrilId valida que exista en la sede; sin él usa el primer carril de entrada. */
  carrilDeLectura(sedeId: string, carrilId?: string): Promise<string>;
  tipoRegistrado(placa: string): Promise<TipoVehiculo | null>;
  /** Con discrepancia guarda la detección y su alerta juntas; la alerta apunta a la detección como evidencia. */
  guardar(
    datos: DatosDeteccion,
    discrepancia: DatosDiscrepancia | null,
  ): Promise<DeteccionGuardada>;
}

export const DETECCION_REPOSITORIO = Symbol('DETECCION_REPOSITORIO');
