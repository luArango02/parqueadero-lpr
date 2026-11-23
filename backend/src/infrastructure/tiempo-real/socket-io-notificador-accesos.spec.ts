import { ResultadoIngreso } from '../../application/accesos/registrar-ingreso.use-case';
import { ResultadoSalida } from '../../application/accesos/registrar-salida.use-case';
import { ConsultaOcupacion, ResumenOcupacion } from './consulta-ocupacion';
import { EVENTOS, EventosGateway } from './eventos.gateway';
import { SocketIoNotificadorAccesos } from './socket-io-notificador-accesos';

class GatewayFalso {
  emitidos: { evento: string; datos: Record<string, unknown> }[] = [];
  emitir(evento: string, datos: Record<string, unknown>) {
    this.emitidos.push({ evento, datos });
  }
  eventos() {
    return this.emitidos.map((e) => e.evento);
  }
}

const resumen = { total: 15, ocupados: 1 } as unknown as ResumenOcupacion;

const ingreso = (
  cambios: Partial<ResultadoIngreso> = {},
): ResultadoIngreso => ({
  autorizado: true,
  barrera: 'ABIERTA',
  motivo: 'INGRESO CON COBRO DIURNA PENDIENTE',
  placa: 'ABC123',
  tipoVehiculo: 'CARRO',
  espacio: 'A-01',
  cobro: null,
  reingreso: false,
  ...cambios,
});

describe('SocketIoNotificadorAccesos', () => {
  let gateway: GatewayFalso;
  let ocupacion: { resumen: jest.Mock };
  let notificador: SocketIoNotificadorAccesos;

  beforeEach(() => {
    gateway = new GatewayFalso();
    ocupacion = { resumen: jest.fn().mockResolvedValue(resumen) };
    notificador = new SocketIoNotificadorAccesos(
      gateway as unknown as EventosGateway,
      ocupacion as unknown as ConsultaOcupacion,
    );
  });

  it('un ingreso autorizado emite barrera, ingreso y ocupación en ese orden', async () => {
    await notificador.ingresoRegistrado(ingreso());

    expect(gateway.eventos()).toEqual([
      EVENTOS.barrera,
      EVENTOS.ingreso,
      EVENTOS.ocupacion,
    ]);
    expect(gateway.emitidos[0].datos).toMatchObject({
      carril: 'ENTRADA',
      estado: 'ABIERTA',
      placa: 'ABC123',
    });
    expect(gateway.emitidos[2].datos).toBe(resumen);
  });

  it('un ingreso negado solo informa la barrera cerrada con su motivo', async () => {
    await notificador.ingresoRegistrado(
      ingreso({ autorizado: false, barrera: 'CERRADA', motivo: 'LLENO' }),
    );

    expect(gateway.eventos()).toEqual([EVENTOS.barrera]);
    expect(gateway.emitidos[0].datos).toMatchObject({
      estado: 'CERRADA',
      motivo: 'LLENO',
    });
    expect(ocupacion.resumen).not.toHaveBeenCalled();
  });

  it('una salida autorizada emite el espacio liberado', async () => {
    const salida: ResultadoSalida = {
      autorizado: true,
      barrera: 'ABIERTA',
      motivo: 'SALIDA SIN COBRO (MOTO)',
      placa: 'XYZ45A',
      tipoVehiculo: 'MOTO',
      espacioLiberado: 'M-01',
      minutosDentro: 30,
      cobrosPendientes: [],
    };

    await notificador.salidaRegistrada(salida);

    expect(gateway.emitidos[0].datos).toMatchObject({ carril: 'SALIDA' });
    expect(gateway.emitidos[1]).toMatchObject({
      evento: EVENTOS.salida,
      datos: { espacioLiberado: 'M-01', minutosDentro: 30 },
    });
  });

  it('si falla el conteo de ocupación no se cae la petición', async () => {
    ocupacion.resumen.mockRejectedValue(new Error('sin base de datos'));

    await expect(
      notificador.ingresoRegistrado(ingreso()),
    ).resolves.toBeUndefined();
    expect(gateway.eventos()).toEqual([EVENTOS.barrera, EVENTOS.ingreso]);
  });
});
