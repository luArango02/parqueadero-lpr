import type { TipoVehiculoTarifa } from './tarifa.rules';
export type FranjaTarifa = 'DIURNA' | 'NOCTURNA';

export interface TarifaRegistrada {
  id: string;
  sedeId: string;
  tipoVehiculo: TipoVehiculoTarifa;
  franja: FranjaTarifa;
  valor: string;
  version: number;
  vigenteDesde: Date;
  vigenteHasta: Date | null;
}

export interface NuevaVersionTarifa {
  sedeId: string;
  tipoVehiculo: TipoVehiculoTarifa;
  valorDiurno: string;
  valorNocturno: string;
}

export interface ResultadoVersionTarifa {
  diurna: TarifaRegistrada;
  nocturna: TarifaRegistrada;
}

export const TARIFA_REPOSITORY = Symbol('TARIFA_REPOSITORY');

export interface TarifaRepository {
  listar(sedeId: string): Promise<TarifaRegistrada[]>;

  buscarPorId(id: string): Promise<TarifaRegistrada | null>;

  listarVigentes(sedeId: string, fecha: Date): Promise<TarifaRegistrada[]>;

  crearVersion(datos: NuevaVersionTarifa): Promise<ResultadoVersionTarifa>;
}
