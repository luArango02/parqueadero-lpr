import { CobroCarroStrategy } from './cobro-carro.strategy';
import { CobroMotoStrategy } from './cobro-moto.strategy';

describe('Estrategias de cálculo de cobros', () => {
  const datosBase = {
    franja: 'DIURNA' as const,
    diaOperativo: '2026-11-20',
    tarifaId: 'tarifa-001',
    tarifaVersion: 2,
    valorTarifa: '9000.00',
  };

  describe('CobroCarroStrategy', () => {
    const estrategia = new CobroCarroStrategy();

    it('calcula el valor de un carro con tarifa diurna', () => {
      const resultado = estrategia.calcular({
        ...datosBase,
        tipoVehiculo: 'CARRO',
      });

      expect(resultado.valor).toBe('9000.00');
      expect(resultado.franja).toBe('DIURNA');
      expect(resultado.tarifaVersion).toBe(2);
      expect(resultado.exento).toBe(false);
    });

    it('conserva el valor de una tarifa nocturna', () => {
      const resultado = estrategia.calcular({
        ...datosBase,
        tipoVehiculo: 'CARRO',
        franja: 'NOCTURNA',
        valorTarifa: '5000.00',
      });

      expect(resultado.valor).toBe('5000.00');
      expect(resultado.franja).toBe('NOCTURNA');
    });

    it('rechaza el cálculo sin tarifa', () => {
      expect(() =>
        estrategia.calcular({
          ...datosBase,
          tipoVehiculo: 'CARRO',
          tarifaId: null,
          tarifaVersion: null,
        }),
      ).toThrow('El carro requiere una tarifa vigente.');
    });
  });

  describe('CobroMotoStrategy', () => {
    const estrategia = new CobroMotoStrategy();

    it('aplica la exención a motocicletas', () => {
      const resultado = estrategia.calcular({
        ...datosBase,
        tipoVehiculo: 'MOTO',
      });

      expect(resultado.valor).toBe('0.00');
      expect(resultado.exento).toBe(true);
      expect(resultado.tarifaId).toBeNull();
    });

    it('mantiene la exención en horario nocturno', () => {
      const resultado = estrategia.calcular({
        ...datosBase,
        tipoVehiculo: 'MOTO',
        franja: 'NOCTURNA',
      });

      expect(resultado.valor).toBe('0.00');
      expect(resultado.exento).toBe(true);
    });
  });
});
