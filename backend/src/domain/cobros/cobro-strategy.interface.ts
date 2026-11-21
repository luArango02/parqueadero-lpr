import type { Franja } from '../tiempo/reglas-horario';

export type TipoVehiculoCobro = 'CARRO' | 'MOTO';

export interface DatosCalculoCobro {
  tipoVehiculo: TipoVehiculoCobro;
  franja: Franja;
  diaOperativo: string;
  tarifaId: string | null;
  tarifaVersion: number | null;
  valorTarifa: string;
}

export interface ResultadoCalculoCobro {
  tipoVehiculo: TipoVehiculoCobro;
  franja: Franja;
  diaOperativo: string;
  tarifaId: string | null;
  tarifaVersion: number | null;
  valor: string;
  exento: boolean;
}

export interface CobroStrategy {
  calcular(datos: DatosCalculoCobro): ResultadoCalculoCobro;
}
