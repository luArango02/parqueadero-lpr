import { TipoVehiculo } from '../../domain/vehiculos/placa';
import { CobroDelDia, SedeOperativa } from './ingreso.repositorio';

export interface PermanenciaActiva {
  id: string;
  vehiculoId: string;
  tipo: TipoVehiculo;
  espacioId: string;
  espacioCodigo: string;
  ingresoEn: Date;
}

export interface DatosSalida {
  sedeId: string;
  carrilId: string;
  placa: string;
  permanencia: PermanenciaActiva;
  ocurridoEn: Date;
}

export interface DatosSalidaDenegada {
  sedeId: string;
  carrilId: string;
  placa: string;
  motivo: string;
  ocurridoEn: Date;
}

export interface DatosVerificacionCobros {
  sedeId: string;
  placa: string;
  vehiculoId: string;
  tipo: TipoVehiculo;
  ingresoEn: Date;
  verificadoEn: Date;
  zonaHoraria: string;
  inicioDiaOperativo: string;
  inicioFranjaDiurna: string;
  inicioFranjaNocturna: string;
}

export interface SalidaRepositorio {
  sedeOperativa(): Promise<SedeOperativa>;
  carrilDeSalida(sedeId: string, carrilId?: string): Promise<string>;
  permanenciaActiva(placa: string): Promise<PermanenciaActiva | null>;
  garantizarCobrosPorCambioDeDia(datos: DatosVerificacionCobros): Promise<void>;
  cobrosPendientes(placa: string, sedeId: string): Promise<CobroDelDia[]>;
  /** Devuelve false si la permanencia ya se había cerrado (doble lectura en la salida). */
  registrarSalida(datos: DatosSalida): Promise<boolean>;
  registrarSalidaDenegada(datos: DatosSalidaDenegada): Promise<void>;
}

export const SALIDA_REPOSITORIO = Symbol('SALIDA_REPOSITORIO');
