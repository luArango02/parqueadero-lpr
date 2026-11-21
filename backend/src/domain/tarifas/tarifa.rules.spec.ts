import {
  TarifaInvalidaError,
  validarRelacionTarifas,
  validarValorTarifa,
} from './tarifa.rules';

describe('Reglas de negocio de tarifas - PARQ-21', () => {
  describe('Validación de valores', () => {
    it('acepta valores positivos', () => {
      expect(() => validarValorTarifa(5000)).not.toThrow();
    });

    it('acepta tarifa gratuita', () => {
      expect(() => validarValorTarifa(0)).not.toThrow();
    });

    it('rechaza valores negativos', () => {
      expect(() => validarValorTarifa(-100)).toThrow(TarifaInvalidaError);
    });

    it('rechaza valores no numéricos', () => {
      expect(() => validarValorTarifa(Number.NaN)).toThrow(TarifaInvalidaError);
    });

    it('acepta valores con dos decimales', () => {
      expect(() => validarValorTarifa(8500.25)).not.toThrow();
    });

    it('rechaza valores con más de dos decimales', () => {
      expect(() => validarValorTarifa(8500.257)).toThrow(TarifaInvalidaError);
    });

    it('rechaza valores infinitos', () => {
      expect(() => validarValorTarifa(Infinity)).toThrow(TarifaInvalidaError);

      expect(() => validarValorTarifa(-Infinity)).toThrow(TarifaInvalidaError);
    });

    it('rechaza valores que superan el límite de Decimal(12,2)', () => {
      expect(() => validarValorTarifa(10000000000)).toThrow(
        TarifaInvalidaError,
      );
    });

    it('acepta el valor máximo de Decimal(12,2)', () => {
      expect(() => validarValorTarifa(9999999999.99)).not.toThrow();
    });

    it('rechaza valores superiores al máximo permitido', () => {
      expect(() => validarValorTarifa(9999999999.999)).toThrow(
        TarifaInvalidaError,
      );
    });
  });

  describe('RN-01 y RN-02', () => {
    it('acepta una tarifa nocturna menor que la diurna', () => {
      expect(() =>
        validarRelacionTarifas({
          tipoVehiculo: 'CARRO',
          valorDiurno: 6000,
          valorNocturno: 4000,
        }),
      ).not.toThrow();
    });

    it('rechaza tarifas diurna y nocturna iguales para carros', () => {
      expect(() =>
        validarRelacionTarifas({
          tipoVehiculo: 'CARRO',
          valorDiurno: 5000,
          valorNocturno: 5000,
        }),
      ).toThrow(TarifaInvalidaError);
    });

    it('rechaza una tarifa nocturna superior a la diurna', () => {
      expect(() =>
        validarRelacionTarifas({
          tipoVehiculo: 'CARRO',
          valorDiurno: 4000,
          valorNocturno: 6000,
        }),
      ).toThrow(TarifaInvalidaError);
    });

    it('permite motocicletas gratuitas en ambas franjas', () => {
      expect(() =>
        validarRelacionTarifas({
          tipoVehiculo: 'MOTO',
          valorDiurno: 0,
          valorNocturno: 0,
        }),
      ).not.toThrow();
    });

    it('rechaza tarifas gratuitas en ambas franjas para carros', () => {
      expect(() =>
        validarRelacionTarifas({
          tipoVehiculo: 'CARRO',
          valorDiurno: 0,
          valorNocturno: 0,
        }),
      ).toThrow(TarifaInvalidaError);
    });
  });
});
