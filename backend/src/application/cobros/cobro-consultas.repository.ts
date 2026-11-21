import type { ConfigHorario, Franja } from '../../domain/tiempo/reglas-horario';
import type { TipoVehiculoCobro } from '../../domain/cobros/cobro-strategy.interface';

export const COBRO_CONSULTAS_REPOSITORY = Symbol('COBRO_CONSULTAS_REPOSITORY');

export interface SedeParaCobro {
  id: string;
  horario: ConfigHorario;
}

export interface VehiculoParaCobro {
  id: string;
  placa: string;
  tipo: TipoVehiculoCobro;
}

export interface TarifaParaCobro {
  id: string;
  tipoVehiculo: TipoVehiculoCobro;
  franja: Franja;
  valor: string;
  version: number;
}

export interface CobroConsultasRepository {
  buscarSede(sedeId: string): Promise<SedeParaCobro | null>;

  buscarVehiculo(vehiculoId: string): Promise<VehiculoParaCobro | null>;

  buscarTarifaVigente(
    sedeId: string,
    tipoVehiculo: TipoVehiculoCobro,
    franja: Franja,
    fecha: Date,
  ): Promise<TarifaParaCobro | null>;
}
