import { EventoReciente } from '../../domain/eventos/evento-reciente';
import { EventoRecienteRepositorio } from './evento-reciente.repositorio';
import { ListarEventosRecientesUseCase } from './listar-eventos-recientes.use-case';

const evento = (
  id: string,
  tipo: EventoReciente['tipo'],
  hora: string,
): EventoReciente => ({
  id,
  tipo,
  placa: 'ABC123',
  detalle: '',
  ocurridoEn: new Date(`2026-11-24T${hora}:00Z`),
});

// Doble en memoria: permite probar la unión de fuentes sin base de datos.
class RepositorioEnMemoria implements EventoRecienteRepositorio {
  limitesPedidos: number[] = [];
  datosAccesos = [
    evento('a1', 'INGRESO', '10:00'),
    evento('a2', 'INGRESO_DENEGADO', '10:20'),
  ];
  datosPagos = [evento('p1', 'PAGO', '10:10')];
  datosAlertas = [evento('l1', 'ALERTA', '10:30')];

  accesos(limite: number): Promise<EventoReciente[]> {
    this.limitesPedidos.push(limite);
    return Promise.resolve(this.datosAccesos);
  }

  pagos(limite: number): Promise<EventoReciente[]> {
    this.limitesPedidos.push(limite);
    return Promise.resolve(this.datosPagos);
  }

  alertas(limite: number): Promise<EventoReciente[]> {
    this.limitesPedidos.push(limite);
    return Promise.resolve(this.datosAlertas);
  }
}

describe('ListarEventosRecientesUseCase', () => {
  let repositorio: RepositorioEnMemoria;
  let casoDeUso: ListarEventosRecientesUseCase;

  beforeEach(() => {
    repositorio = new RepositorioEnMemoria();
    casoDeUso = new ListarEventosRecientesUseCase(repositorio);
  });

  it('une accesos, pagos y alertas con el más reciente primero', async () => {
    const lista = await casoDeUso.ejecutar();

    expect(lista.map((e) => e.tipo)).toEqual([
      'ALERTA',
      'INGRESO_DENEGADO',
      'PAGO',
      'INGRESO',
    ]);
  });

  it('respeta el límite pedido y se lo pide a cada fuente', async () => {
    const lista = await casoDeUso.ejecutar(2);

    expect(lista.map((e) => e.id)).toEqual(['l1', 'a2']);
    expect(repositorio.limitesPedidos).toEqual([2, 2, 2]);
  });

  it('usa 20 eventos por defecto', async () => {
    await casoDeUso.ejecutar();

    expect(repositorio.limitesPedidos).toEqual([20, 20, 20]);
  });
});
