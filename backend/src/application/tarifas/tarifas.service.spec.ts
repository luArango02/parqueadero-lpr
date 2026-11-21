/* eslint-disable @typescript-eslint/unbound-method -- los mocks de jest se verifican con expect(mock.metodo) */
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TarifasService } from './tarifas.service';

import type {
  TarifaRepository,
  TarifaRegistrada,
} from '../../domain/tarifas/tarifa.repository';

describe('TarifasService - PARQ-21', () => {
  let service: TarifasService;
  let repositorio: jest.Mocked<TarifaRepository>;

  const tarifaEjemplo: TarifaRegistrada = {
    id: 'tarifa-1',
    sedeId: 'sede-1',
    tipoVehiculo: 'CARRO',
    franja: 'DIURNA',
    valor: '8000.00',
    version: 1,
    vigenteDesde: new Date('2026-01-01T05:00:00Z'),
    vigenteHasta: null,
  };

  beforeEach(() => {
    repositorio = {
      listar: jest.fn(),
      buscarPorId: jest.fn(),
      listarVigentes: jest.fn(),
      crearVersion: jest.fn(),
    };

    service = new TarifasService(repositorio);
  });

  it('lista las tarifas de una sede', async () => {
    repositorio.listar.mockResolvedValue([tarifaEjemplo]);

    const resultado = await service.listar('sede-1');

    expect(resultado).toEqual([tarifaEjemplo]);
    expect(repositorio.listar).toHaveBeenCalledWith('sede-1');
  });

  it('rechaza una sede vacía', async () => {
    await expect(service.listar('')).rejects.toThrow(BadRequestException);
  });

  it('consulta una tarifa existente', async () => {
    repositorio.buscarPorId.mockResolvedValue(tarifaEjemplo);

    const resultado = await service.buscarPorId('tarifa-1');

    expect(resultado).toEqual(tarifaEjemplo);
  });

  it('devuelve 404 cuando la tarifa no existe', async () => {
    repositorio.buscarPorId.mockResolvedValue(null);

    await expect(service.buscarPorId('inexistente')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('consulta tarifas vigentes', async () => {
    repositorio.listarVigentes.mockResolvedValue([tarifaEjemplo]);

    const fecha = new Date('2026-11-18T12:00:00Z');
    const resultado = await service.listarVigentes('sede-1', fecha);

    expect(resultado).toEqual([tarifaEjemplo]);
    expect(repositorio.listarVigentes).toHaveBeenCalledWith('sede-1', fecha);
  });

  it('rechaza una fecha inválida', async () => {
    await expect(
      service.listarVigentes('sede-1', new Date('invalida')),
    ).rejects.toThrow(BadRequestException);
  });

  it('crea una versión con valores válidos', async () => {
    const nuevaDiurna = {
      ...tarifaEjemplo,
      id: 'tarifa-2',
      valor: '9000.00',
      version: 2,
    };

    const nuevaNocturna = {
      ...tarifaEjemplo,
      id: 'tarifa-3',
      franja: 'NOCTURNA' as const,
      valor: '6000.00',
      version: 2,
    };

    repositorio.crearVersion.mockResolvedValue({
      diurna: nuevaDiurna,
      nocturna: nuevaNocturna,
    });

    const resultado = await service.actualizarTarifas({
      sedeId: 'sede-1',
      tipoVehiculo: 'CARRO',
      valorDiurno: 9000,
      valorNocturno: 6000,
    });

    expect(resultado.diurna.version).toBe(2);

    expect(repositorio.crearVersion).toHaveBeenCalledWith({
      sedeId: 'sede-1',
      tipoVehiculo: 'CARRO',
      valorDiurno: '9000.00',
      valorNocturno: '6000.00',
    });
  });

  it('rechaza una tarifa nocturna mayor que la diurna', async () => {
    await expect(
      service.actualizarTarifas({
        sedeId: 'sede-1',
        tipoVehiculo: 'CARRO',
        valorDiurno: 4000,
        valorNocturno: 6000,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(repositorio.crearVersion).not.toHaveBeenCalled();
  });

  it('acepta motocicletas gratuitas', async () => {
    repositorio.crearVersion.mockResolvedValue({
      diurna: {
        ...tarifaEjemplo,
        tipoVehiculo: 'MOTO',
        valor: '0.00',
      },
      nocturna: {
        ...tarifaEjemplo,
        tipoVehiculo: 'MOTO',
        franja: 'NOCTURNA',
        valor: '0.00',
      },
    });

    await service.actualizarTarifas({
      sedeId: 'sede-1',
      tipoVehiculo: 'MOTO',
      valorDiurno: 0,
      valorNocturno: 0,
    });

    expect(repositorio.crearVersion).toHaveBeenCalled();
  });

  describe('PATCH /tarifas/:id', () => {
    const nocturna: TarifaRegistrada = {
      ...tarifaEjemplo,
      id: 'tarifa-nocturna-1',
      franja: 'NOCTURNA',
      valor: '5000.00',
    };

    it('modifica la tarifa diurna conservando la nocturna', async () => {
      repositorio.buscarPorId.mockResolvedValue(tarifaEjemplo);
      repositorio.listarVigentes.mockResolvedValue([tarifaEjemplo, nocturna]);

      repositorio.crearVersion.mockResolvedValue({
        diurna: {
          ...tarifaEjemplo,
          id: 'tarifa-diurna-2',
          valor: '9000.00',
          version: 2,
        },
        nocturna: {
          ...nocturna,
          id: 'tarifa-nocturna-2',
          version: 2,
        },
      });

      const resultado = await service.modificarTarifa('tarifa-1', {
        valor: 9000,
      });

      expect(resultado.diurna.version).toBe(2);

      expect(repositorio.crearVersion).toHaveBeenCalledWith({
        sedeId: 'sede-1',
        tipoVehiculo: 'CARRO',
        valorDiurno: '9000.00',
        valorNocturno: '5000.00',
        tarifaEsperadaId: 'tarifa-1',
      });
    });

    it('modifica la nocturna conservando la diurna', async () => {
      repositorio.buscarPorId.mockResolvedValue(nocturna);
      repositorio.listarVigentes.mockResolvedValue([tarifaEjemplo, nocturna]);

      repositorio.crearVersion.mockResolvedValue({
        diurna: tarifaEjemplo,
        nocturna: {
          ...nocturna,
          valor: '4000.00',
          version: 2,
        },
      });

      await service.modificarTarifa('tarifa-nocturna-1', {
        valor: 4000,
      });

      expect(repositorio.crearVersion).toHaveBeenCalledWith(
        expect.objectContaining({
          valorDiurno: '8000.00',
          valorNocturno: '4000.00',
          tarifaEsperadaId: 'tarifa-nocturna-1',
        }),
      );
    });

    it('rechaza una tarifa nocturna igual a la diurna', async () => {
      repositorio.buscarPorId.mockResolvedValue(nocturna);
      repositorio.listarVigentes.mockResolvedValue([tarifaEjemplo, nocturna]);

      await expect(
        service.modificarTarifa('tarifa-nocturna-1', {
          valor: 8000,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(repositorio.crearVersion).not.toHaveBeenCalled();
    });

    it('rechaza la modificación de una tarifa histórica', async () => {
      repositorio.buscarPorId.mockResolvedValue({
        ...tarifaEjemplo,
        vigenteHasta: new Date('2026-11-18T12:00:00Z'),
      });

      repositorio.listarVigentes.mockResolvedValue([
        { ...tarifaEjemplo, id: 'tarifa-actual' },
        nocturna,
      ]);

      await expect(
        service.modificarTarifa('tarifa-1', {
          valor: 9000,
        }),
      ).rejects.toThrow(ConflictException);

      expect(repositorio.crearVersion).not.toHaveBeenCalled();
    });
  });
});
