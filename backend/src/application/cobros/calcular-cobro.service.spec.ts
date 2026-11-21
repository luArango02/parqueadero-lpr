import { NotFoundException } from '@nestjs/common';
import { CalcularCobroService } from './calcular-cobro.service';
import type { CobroConsultasRepository } from './cobro-consultas.repository';

describe('CalcularCobroService', () => {
  let service: CalcularCobroService;
  let consultas: jest.Mocked<CobroConsultasRepository>;

  const sede = {
    id: 'sede-1',
    horario: {
      zonaHoraria: 'America/Bogota',
      inicioDiaOperativo: '06:00',
      inicioFranjaDiurna: '06:00',
      inicioFranjaNocturna: '18:00',
    },
  };

  const vehiculo = {
    id: 'vehiculo-1',
    placa: 'ABC123',
    tipo: 'CARRO' as const,
  };

  const fechaLocal = (fecha: string) => new Date(`${fecha}:00-05:00`);
  it('conserva la versión histórica de la tarifa consultada', async () => {
    consultas.buscarTarifaVigente.mockResolvedValue({
      id: 'tarifa-historica',
      tipoVehiculo: 'CARRO',
      franja: 'DIURNA',
      valor: '8000.00',
      version: 1,
    });

    const fechaIngreso = fechaLocal('2026-11-18T10:00');

    const resultado = await service.ejecutar({
      sedeId: sede.id,
      vehiculoId: vehiculo.id,
      fechaIngreso,
    });

    expect(resultado.tarifaId).toBe('tarifa-historica');
    expect(resultado.tarifaVersion).toBe(1);
    expect(resultado.valor).toBe('8000.00');

    expect(consultas.buscarTarifaVigente).toHaveBeenCalledWith(
      sede.id,
      'CARRO',
      'DIURNA',
      fechaIngreso,
    );
  });

  beforeEach(() => {
    consultas = {
      buscarSede: jest.fn(),
      buscarVehiculo: jest.fn(),
      buscarTarifaVigente: jest.fn(),
    };

    service = new CalcularCobroService(consultas);

    consultas.buscarSede.mockResolvedValue(sede);
    consultas.buscarVehiculo.mockResolvedValue(vehiculo);
  });

  it('calcula un cobro diurno para un carro', async () => {
    consultas.buscarTarifaVigente.mockResolvedValue({
      id: 'tarifa-1',
      tipoVehiculo: 'CARRO',
      franja: 'DIURNA',
      valor: '9000.00',
      version: 2,
    });

    const fechaIngreso = fechaLocal('2026-11-20T10:00');

    const resultado = await service.ejecutar({
      sedeId: sede.id,
      vehiculoId: vehiculo.id,
      fechaIngreso,
    });

    expect(resultado).toMatchObject({
      tipoVehiculo: 'CARRO',
      franja: 'DIURNA',
      diaOperativo: '2026-11-20',
      valor: '9000.00',
      tarifaId: 'tarifa-1',
      tarifaVersion: 2,
      exento: false,
    });

    expect(consultas.buscarTarifaVigente).toHaveBeenCalledWith(
      sede.id,
      'CARRO',
      'DIURNA',
      fechaIngreso,
    );
  });

  it('calcula un cobro nocturno para un carro', async () => {
    consultas.buscarTarifaVigente.mockResolvedValue({
      id: 'tarifa-2',
      tipoVehiculo: 'CARRO',
      franja: 'NOCTURNA',
      valor: '5000.00',
      version: 1,
    });

    const resultado = await service.ejecutar({
      sedeId: sede.id,
      vehiculoId: vehiculo.id,
      fechaIngreso: fechaLocal('2026-11-20T19:00'),
    });

    expect(resultado.franja).toBe('NOCTURNA');
    expect(resultado.valor).toBe('5000.00');
  });

  it('aplica exención a motocicletas sin consultar tarifas', async () => {
    consultas.buscarVehiculo.mockResolvedValue({
      ...vehiculo,
      tipo: 'MOTO',
    });

    const resultado = await service.ejecutar({
      sedeId: sede.id,
      vehiculoId: vehiculo.id,
      fechaIngreso: fechaLocal('2026-11-20T20:00'),
    });

    expect(resultado.valor).toBe('0.00');
    expect(resultado.exento).toBe(true);
    expect(consultas.buscarTarifaVigente).not.toHaveBeenCalled();
  });

  it('identifica correctamente el día operativo antes de las 06:00', async () => {
    consultas.buscarTarifaVigente.mockResolvedValue({
      id: 'tarifa-2',
      tipoVehiculo: 'CARRO',
      franja: 'NOCTURNA',
      valor: '5000.00',
      version: 1,
    });

    const resultado = await service.ejecutar({
      sedeId: sede.id,
      vehiculoId: vehiculo.id,
      fechaIngreso: fechaLocal('2026-11-21T05:30'),
    });

    expect(resultado.diaOperativo).toBe('2026-11-20');
    expect(resultado.franja).toBe('NOCTURNA');
  });

  it('rechaza una sede inexistente', async () => {
    consultas.buscarSede.mockResolvedValue(null);

    await expect(
      service.ejecutar({
        sedeId: 'sede-inexistente',
        vehiculoId: vehiculo.id,
        fechaIngreso: new Date(),
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rechaza un vehículo inexistente', async () => {
    consultas.buscarVehiculo.mockResolvedValue(null);

    await expect(
      service.ejecutar({
        sedeId: sede.id,
        vehiculoId: 'vehiculo-inexistente',
        fechaIngreso: new Date(),
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rechaza el cálculo si no hay tarifa vigente', async () => {
    consultas.buscarTarifaVigente.mockResolvedValue(null);

    await expect(
      service.ejecutar({
        sedeId: sede.id,
        vehiculoId: vehiculo.id,
        fechaIngreso: fechaLocal('2026-11-20T10:00'),
      }),
    ).rejects.toThrow(NotFoundException);
  });
  describe('Horarios límite del cálculo', () => {
    const casos = [
      {
        hora: '2026-11-21T05:59',
        franja: 'NOCTURNA',
        diaOperativo: '2026-11-20',
      },
      {
        hora: '2026-11-21T06:00',
        franja: 'DIURNA',
        diaOperativo: '2026-11-21',
      },
      {
        hora: '2026-11-21T17:59',
        franja: 'DIURNA',
        diaOperativo: '2026-11-21',
      },
      {
        hora: '2026-11-21T18:00',
        franja: 'NOCTURNA',
        diaOperativo: '2026-11-21',
      },
    ] as const;

    it.each(casos)(
      'calcula correctamente $hora',
      async ({ hora, franja, diaOperativo }) => {
        consultas.buscarTarifaVigente.mockResolvedValue({
          id: 'tarifa-prueba',
          tipoVehiculo: 'CARRO',
          franja,
          valor: franja === 'DIURNA' ? '9000.00' : '6000.00',
          version: 2,
        });

        const resultado = await service.ejecutar({
          sedeId: sede.id,
          vehiculoId: vehiculo.id,
          fechaIngreso: fechaLocal(hora),
        });

        expect(resultado.franja).toBe(franja);
        expect(resultado.diaOperativo).toBe(diaOperativo);
      },
    );
  });
});
