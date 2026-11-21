import { OrigenLectura } from '../../domain/detecciones/deteccion';
import { TipoVehiculo } from '../../domain/vehiculos/placa';

/**
 * Lo que llega del carril cuando pasa un vehículo. Un lector real analizaría
 * una imagen; el simulador recibe los datos ya definidos.
 */
export interface CapturaCarril {
  carrilId: string;
  ocurridaEn: Date;
  placa: string;
  confianza: number;
  tipoVisual?: TipoVehiculo;
}

export interface LecturaPlaca {
  placa: string;
  confianza: number;
  tipoVisual: TipoVehiculo | null;
  ocurridaEn: Date;
  origen: OrigenLectura;
}

// Puerto: cualquier lector (simulador, OCR, digitación manual) se intercambia sin tocar el caso de uso.
export interface LectorPlacas {
  leer(captura: CapturaCarril): Promise<LecturaPlaca>;
}

export const LECTOR_PLACAS = Symbol('LECTOR_PLACAS');
