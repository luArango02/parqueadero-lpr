import { BadRequestException } from '@nestjs/common';
import type {
  HistorialEventosRepositorio,
  ResultadoHistorial,
} from './historial-eventos.repositorio';
import { ListarHistorialEventosUseCase } from './listar-historial-eventos.use-case';

describe('ListarHistorialEventosUseCase', () => {
  const resultado: ResultadoHistorial = {
    datos: [],
    total: 0,
    pagina: 1,
    limite: 20,
    totalPaginas: 0,
  };

  const listarMock = jest.fn<
    Promise<ResultadoHistorial>,
    Parameters<HistorialEventosRepositorio['listar']>
  >();

  let casoDeUso: ListarHistorialEventosUseCase;

  beforeEach(() => {
    listarMock.mockReset();
    listarMock.mockResolvedValue(resultado);

    casoDeUso = new ListarHistorialEventosUseCase({
      listar: listarMock,
    });
  });

  it('utiliza los valores de paginacion por defecto', async () => {
    await casoDeUso.ejecutar({});

    expect(listarMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pagina: 1,
        limite: 20,
      }),
    );
  });

  it('respeta la paginacion solicitada', async () => {
    await casoDeUso.ejecutar({
      pagina: 3,
      limite: 10,
    });

    expect(listarMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pagina: 3,
        limite: 10,
      }),
    );
  });

  it('normaliza el filtro de placa', async () => {
    await casoDeUso.ejecutar({
      placa: ' abc123 ',
    });

    expect(listarMock).toHaveBeenCalledWith(
      expect.objectContaining({
        placa: 'ABC123',
      }),
    );
  });

  it('permite buscar por una placa parcial', async () => {
    await casoDeUso.ejecutar({
      placa: 'abc',
    });

    expect(listarMock).toHaveBeenCalledWith(
      expect.objectContaining({
        placa: 'ABC',
      }),
    );
  });

  it('envia los filtros de tipo y estado', async () => {
    await casoDeUso.ejecutar({
      tipo: 'INGRESO',
      estado: 'AUTORIZADO',
    });

    expect(listarMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'INGRESO',
        estado: 'AUTORIZADO',
      }),
    );
  });

  it('permite consultar pagos con cobro vencido', async () => {
    await casoDeUso.ejecutar({
      tipo: 'PAGO',
      estado: 'VENCIDO',
    });

    expect(listarMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'PAGO',
        estado: 'VENCIDO',
      }),
    );
  });

  it('permite consultar alertas resueltas', async () => {
    await casoDeUso.ejecutar({
      tipo: 'ALERTA',
      estado: 'RESUELTA',
    });

    expect(listarMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'ALERTA',
        estado: 'RESUELTA',
      }),
    );
  });

  it('convierte las fechas respetando la zona horaria', async () => {
    await casoDeUso.ejecutar({
      desde: '2026-11-25T06:00:00-05:00',
      hasta: '2026-11-25T18:00:00-05:00',
    });

    expect(listarMock).toHaveBeenCalledWith(
      expect.objectContaining({
        desde: new Date('2026-11-25T11:00:00Z'),
        hasta: new Date('2026-11-25T23:00:00Z'),
      }),
    );
  });

  it('devuelve el resultado del repositorio', async () => {
    await expect(casoDeUso.ejecutar({})).resolves.toEqual(resultado);
  });

  it.each([0, -1, 1.5, 1001])('rechaza la pagina invalida %s', (pagina) => {
    expect(() => casoDeUso.ejecutar({ pagina })).toThrow(BadRequestException);

    expect(listarMock).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, 101])('rechaza el limite invalido %s', (limite) => {
    expect(() => casoDeUso.ejecutar({ limite })).toThrow(BadRequestException);

    expect(listarMock).not.toHaveBeenCalled();
  });

  it.each(['', 'ABC-123', 'ABC 123', 'ABCDEFGHIJK'])(
    'rechaza la placa invalida %s',
    (placa) => {
      expect(() => casoDeUso.ejecutar({ placa })).toThrow(BadRequestException);

      expect(listarMock).not.toHaveBeenCalled();
    },
  );

  it('rechaza una fecha inicial invalida', () => {
    expect(() =>
      casoDeUso.ejecutar({
        desde: 'fecha-invalida',
      }),
    ).toThrow(BadRequestException);

    expect(listarMock).not.toHaveBeenCalled();
  });

  it('rechaza una fecha final invalida', () => {
    expect(() =>
      casoDeUso.ejecutar({
        hasta: 'fecha-invalida',
      }),
    ).toThrow(BadRequestException);

    expect(listarMock).not.toHaveBeenCalled();
  });

  it('rechaza un intervalo de fechas invertido', () => {
    expect(() =>
      casoDeUso.ejecutar({
        desde: '2026-11-26T00:00:00Z',
        hasta: '2026-11-25T00:00:00Z',
      }),
    ).toThrow(BadRequestException);

    expect(listarMock).not.toHaveBeenCalled();
  });
});
