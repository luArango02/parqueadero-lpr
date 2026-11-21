import type {
  CobroStrategy,
  DatosCalculoCobro,
  ResultadoCalculoCobro,
} from '../cobro-strategy.interface';

export class CobroCarroStrategy implements CobroStrategy {
  calcular(datos: DatosCalculoCobro): ResultadoCalculoCobro {
    if (datos.tipoVehiculo !== 'CARRO') {
      throw new Error('La estrategia de carros requiere un CARRO.');
    }

    if (!datos.tarifaId || datos.tarifaVersion === null) {
      throw new Error('El carro requiere una tarifa vigente.');
    }

    return {
      tipoVehiculo: datos.tipoVehiculo,
      franja: datos.franja,
      diaOperativo: datos.diaOperativo,
      tarifaId: datos.tarifaId,
      tarifaVersion: datos.tarifaVersion,
      valor: datos.valorTarifa,
      exento: false,
    };
  }
}
