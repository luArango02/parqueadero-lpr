import type {
  CobroStrategy,
  DatosCalculoCobro,
  ResultadoCalculoCobro,
} from '../cobro-strategy.interface';

export class CobroMotoStrategy implements CobroStrategy {
  calcular(datos: DatosCalculoCobro): ResultadoCalculoCobro {
    if (datos.tipoVehiculo !== 'MOTO') {
      throw new Error('La estrategia de motocicletas requiere una MOTO.');
    }

    return {
      tipoVehiculo: datos.tipoVehiculo,
      franja: datos.franja,
      diaOperativo: datos.diaOperativo,
      tarifaId: null,
      tarifaVersion: null,
      valor: '0.00',
      exento: true,
    };
  }
}
