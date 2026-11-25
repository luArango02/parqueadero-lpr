import { BadRequestException } from '@nestjs/common';
import type {
  AuditoriaRepositorio,
  ResultadoAuditoria,
} from './auditoria.repositorio';
import { ListarAuditoriaUseCase } from './listar-auditoria.use-case';

describe('ListarAuditoriaUseCase', () => {
  let repositorio: jest.Mocked<AuditoriaRepositorio>;
  const listarMock = jest.fn<
    Promise<ResultadoAuditoria>,
    Parameters<AuditoriaRepositorio['listar']>
  >();
  let casoDeUso: ListarAuditoriaUseCase;

  const resultado: ResultadoAuditoria = {
    datos: [],
    total: 0,
    pagina: 1,
    limite: 20,
    totalPaginas: 0,
  };

  beforeEach(() => {
    listarMock.mockReset();
    listarMock.mockResolvedValue(resultado);
    repositorio = {
      listar: listarMock,
    };

    casoDeUso = new ListarAuditoriaUseCase(repositorio);
  });

  it('utiliza pagina 1 y limite 20 por defecto', async () => {
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
      pagina: 2,
      limite: 10,
    });

    expect(listarMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pagina: 2,
        limite: 10,
      }),
    );
  });

  it('envia los filtros de usuario, accion y entidad', async () => {
    await casoDeUso.ejecutar({
      usuarioId: 'usuario-1',
      accion: ' MODIFICAR_TARIFA ',
      entidad: ' Tarifa ',
      entidadId: 'tarifa-1',
    });

    expect(listarMock).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: 'usuario-1',
        accion: 'MODIFICAR_TARIFA',
        entidad: 'Tarifa',
        entidadId: 'tarifa-1',
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

  it('devuelve el resultado entregado por el repositorio', async () => {
    await expect(casoDeUso.ejecutar({})).resolves.toEqual(resultado);
  });

  it.each([0, -1, 1.5, 10001])('rechaza la pagina invalida %s', (pagina) => {
    expect(() => casoDeUso.ejecutar({ pagina })).toThrow(BadRequestException);

    expect(listarMock).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, 101])('rechaza el limite invalido %s', (limite) => {
    expect(() => casoDeUso.ejecutar({ limite })).toThrow(BadRequestException);

    expect(listarMock).not.toHaveBeenCalled();
  });

  it('rechaza una fecha inicial invalida', () => {
    expect(() => casoDeUso.ejecutar({ desde: 'fecha-invalida' })).toThrow(
      BadRequestException,
    );

    expect(listarMock).not.toHaveBeenCalled();
  });

  it('rechaza una fecha final invalida', () => {
    expect(() => casoDeUso.ejecutar({ hasta: 'fecha-invalida' })).toThrow(
      BadRequestException,
    );

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
