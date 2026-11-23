
import { RegistrarPagoEfectivoUseCase } from './registrar-pago-efectivo.use-case';
import type {
  PagoRegistrado,
  PagoRepository,
  SolicitudRegistroPago,
} from './pago.repository';

describe('RegistrarPagoEfectivoUseCase', () => {
  let casoDeUso: RegistrarPagoEfectivoUseCase;
  let repositorio: jest.Mocked<PagoRepository>;

  const solicitud: SolicitudRegistroPago = {
    cobroId: '550e8400-e29b-41d4-a716-446655440000',
    referencia: 'EFECTIVO-CAJA-000123',
    registradoPorId: '550e8400-e29b-41d4-a716-446655440001',
  };

  const pago: PagoRegistrado = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    cobroId: solicitud.cobroId,
    referencia: solicitud.referencia,
    medio: 'EFECTIVO',
    valor: '10000.00',
    estadoCobro: 'PAGADO',
    pagadoEn: new Date('2026-11-23T16:00:00.000Z'),
    registradoPorId: solicitud.registradoPorId,
  };

  beforeEach(() => {
    repositorio = {
      registrarEfectivo: jest.fn(),
    };

    casoDeUso = new RegistrarPagoEfectivoUseCase(repositorio);
  });

  it('debe registrar un pago en efectivo', async () => {
    repositorio.registrarEfectivo.mockResolvedValue(pago);

    const resultado = await casoDeUso.ejecutar(solicitud);

    expect(repositorio.registrarEfectivo).toHaveBeenCalledTimes(1);
    expect(repositorio.registrarEfectivo).toHaveBeenCalledWith(solicitud);
    expect(resultado).toEqual(pago);
  });

  it('debe propagar los errores del repositorio', async () => {
    const error = new Error('El cobro no existe');

    repositorio.registrarEfectivo.mockRejectedValue(error);

    await expect(casoDeUso.ejecutar(solicitud)).rejects.toThrow(
      'El cobro no existe',
    );
  });

  it('debe conservar la referencia de idempotencia', async () => {
    repositorio.registrarEfectivo.mockResolvedValue(pago);

    await casoDeUso.ejecutar(solicitud);

    expect(repositorio.registrarEfectivo).toHaveBeenCalledWith(
      expect.objectContaining({
        referencia: 'EFECTIVO-CAJA-000123',
      }),
    );
  });
});
