import { NotificadorAccesos } from './notificador-accesos';
import { Reloj } from '../../domain/tiempo/reloj';
import { CobroDelDia, SedeOperativa } from './ingreso.repositorio';
import { RegistrarSalidaUseCase } from './registrar-salida.use-case';
import {
  DatosSalida,
  DatosSalidaDenegada,
  DatosVerificacionCobros,
  PermanenciaActiva,
  SalidaRepositorio,
} from './salida.repositorio';

class RepositorioEnMemoria implements SalidaRepositorio {
  permanencias = new Map<string, PermanenciaActiva>();
  cobros = new Map<string, CobroDelDia[]>();
  espaciosLibres: string[] = [];
  salidas: DatosSalida[] = [];
  denegadas: DatosSalidaDenegada[] = [];

  sedeOperativa(): Promise<SedeOperativa> {
    return Promise.resolve({
      id: 'sede-1',
      zonaHoraria: 'America/Bogota',
      inicioDiaOperativo: '06:00',
      inicioFranjaDiurna: '06:00',
      inicioFranjaNocturna: '18:00',
      umbralConfianza: 0.8,
    });
  }
  carrilDeSalida(): Promise<string> {
    return Promise.resolve('carril-salida');
  }
  permanenciaActiva(placa: string): Promise<PermanenciaActiva | null> {
    return Promise.resolve(this.permanencias.get(placa) ?? null);
  }
  cobrosPendientes(placa: string): Promise<CobroDelDia[]> {
    const cobros = this.cobros.get(placa) ?? [];
    return Promise.resolve(cobros.filter((c) => c.estado === 'PENDIENTE'));
  }
  registrarSalida(datos: DatosSalida): Promise<boolean> {
    if (!this.permanencias.delete(datos.placa)) return Promise.resolve(false);
    this.espaciosLibres.push(datos.permanencia.espacioCodigo);
    this.salidas.push(datos);
    return Promise.resolve(true);
  }
  registrarSalidaDenegada(datos: DatosSalidaDenegada): Promise<void> {
    this.denegadas.push(datos);
    return Promise.resolve();
  }

  estacionar(placa: string, tipo: 'CARRO' | 'MOTO', espacio: string) {
    this.permanencias.set(placa, {
      id: `perm-${placa}`,
      vehiculoId: `veh-${placa}`,
      tipo,
      espacioId: `esp-${espacio}`,
      espacioCodigo: espacio,
      ingresoEn: local('2026-11-20T08:00'),
    });
  }
  cobrar(placa: string, estado: CobroDelDia['estado'], dia = '2026-11-20') {
    const lista = this.cobros.get(placa) ?? [];
    lista.push({
      id: `cobro-${placa}-${dia}`,
      valor: 8000,
      franja: 'DIURNA',
      estado,
      diaOperativo: dia,
    });
    this.cobros.set(placa, lista);
  }

  verificacionesCobros: DatosVerificacionCobros[] = [];

  garantizarCobrosPorCambioDeDia(
    datos: DatosVerificacionCobros,
  ): Promise<void> {
    this.verificacionesCobros.push(datos);
    return Promise.resolve();
  }
}

class NotificadorFalso implements NotificadorAccesos {
  avisos: { autorizado: boolean; motivo: string }[] = [];
  ingresoRegistrado(r: { autorizado: boolean; motivo: string }) {
    this.avisos.push({ autorizado: r.autorizado, motivo: r.motivo });
    return Promise.resolve();
  }
  salidaRegistrada(r: { autorizado: boolean; motivo: string }) {
    return this.ingresoRegistrado(r);
  }
}

class RelojFijo implements Reloj {
  constructor(public instante: Date) {}
  ahora(): Date {
    return this.instante;
  }
}

const local = (fechaHora: string) => new Date(`${fechaHora}:00-05:00`);

describe('RegistrarSalidaUseCase', () => {
  let repositorio: RepositorioEnMemoria;
  let notificador: NotificadorFalso;
  let casoDeUso: RegistrarSalidaUseCase;

  beforeEach(() => {
    repositorio = new RepositorioEnMemoria();
    const reloj = new RelojFijo(local('2026-11-20T10:30'));
    notificador = new NotificadorFalso();
    casoDeUso = new RegistrarSalidaUseCase(repositorio, reloj, notificador);
  });

  it('una moto sale sin cobro y libera su espacio', async () => {
    repositorio.estacionar('XYZ45A', 'MOTO', 'M-01');

    const resultado = await casoDeUso.ejecutar({ placa: 'xyz45a' });

    expect(resultado).toMatchObject({
      autorizado: true,
      barrera: 'ABIERTA',
      motivo: 'SALIDA SIN COBRO (MOTO)',
      espacioLiberado: 'M-01',
      minutosDentro: 150,
    });
    expect(repositorio.espaciosLibres).toEqual(['M-01']);
  });

  it('un carro con cobro pendiente no puede salir', async () => {
    repositorio.estacionar('DEF456', 'CARRO', 'A-01');
    repositorio.cobrar('DEF456', 'PENDIENTE');

    const resultado = await casoDeUso.ejecutar({ placa: 'DEF456' });

    expect(resultado.barrera).toBe('CERRADA');
    expect(resultado.motivo).toContain('COBRO PENDIENTE');
    expect(resultado.cobrosPendientes).toHaveLength(1);
    expect(repositorio.permanencias.has('DEF456')).toBe(true);
    expect(repositorio.denegadas).toHaveLength(1);
  });

  it('un carro con el cobro pagado sale y libera el espacio', async () => {
    repositorio.estacionar('DEF456', 'CARRO', 'A-01');
    repositorio.cobrar('DEF456', 'PAGADO');

    const resultado = await casoDeUso.ejecutar({ placa: 'DEF456' });

    expect(resultado).toMatchObject({
      autorizado: true,
      motivo: 'SALIDA AUTORIZADA: COBRO PAGADO',
      espacioLiberado: 'A-01',
    });
    expect(repositorio.salidas).toHaveLength(1);
  });

  it('un cobro pendiente de un día anterior también bloquea la salida', async () => {
    repositorio.estacionar('DEF456', 'CARRO', 'A-01');
    repositorio.cobrar('DEF456', 'PENDIENTE', '2026-11-19');
    repositorio.cobrar('DEF456', 'PAGADO', '2026-11-20');

    const resultado = await casoDeUso.ejecutar({ placa: 'DEF456' });

    expect(resultado.barrera).toBe('CERRADA');
    expect(resultado.cobrosPendientes[0].diaOperativo).toBe('2026-11-19');
  });

  it('una placa que no está adentro no abre la barrera', async () => {
    const resultado = await casoDeUso.ejecutar({ placa: 'GHI789' });

    expect(resultado).toMatchObject({
      autorizado: false,
      motivo: 'LA PLACA NO FIGURA ADENTRO',
    });
  });

  it('con baja confianza pide validación manual y no consulta la permanencia', async () => {
    repositorio.estacionar('XYZ45A', 'MOTO', 'M-01');

    const resultado = await casoDeUso.ejecutar({
      placa: 'XYZ45A',
      confianza: 0.5,
    });

    expect(resultado.motivo).toBe('BAJA CONFIANZA: REQUIERE VALIDACIÓN MANUAL');
    expect(repositorio.permanencias.has('XYZ45A')).toBe(true);
  });

  it('una segunda lectura de la misma placa no la saca dos veces', async () => {
    repositorio.estacionar('XYZ45A', 'MOTO', 'M-01');
    await casoDeUso.ejecutar({ placa: 'XYZ45A' });

    const segunda = await casoDeUso.ejecutar({ placa: 'XYZ45A' });

    expect(segunda.barrera).toBe('CERRADA');
    expect(repositorio.espaciosLibres).toEqual(['M-01']);
  });

  it('avisa la salida solo cuando ya quedó registrada', async () => {
    repositorio.estacionar('XYZ45A', 'MOTO', 'M-01');
    const espaciosAlAvisar: string[][] = [];
    notificador.salidaRegistrada = () => {
      espaciosAlAvisar.push([...repositorio.espaciosLibres]);
      return Promise.resolve();
    };

    await casoDeUso.ejecutar({ placa: 'XYZ45A' });

    expect(espaciosAlAvisar).toEqual([['M-01']]);
  });

  it('verifica los cobros antes de autorizar la salida', async () => {
    repositorio.estacionar('DEF456', 'CARRO', 'A-01');
    repositorio.cobrar('DEF456', 'PAGADO');

    const resultado = await casoDeUso.ejecutar({
      placa: 'DEF456',
    });

    expect(resultado.autorizado).toBe(true);
    expect(repositorio.verificacionesCobros).toHaveLength(1);

    expect(repositorio.verificacionesCobros[0]).toMatchObject({
      sedeId: 'sede-1',
      placa: 'DEF456',
      vehiculoId: 'veh-DEF456',
      tipo: 'CARRO',
      zonaHoraria: 'America/Bogota',
      inicioDiaOperativo: '06:00',
    });
  });

  it('no verifica cobros cuando la placa no está adentro', async () => {
    await casoDeUso.ejecutar({ placa: 'GHI789' });

    expect(repositorio.verificacionesCobros).toHaveLength(0);
  });

  it('no verifica cobros cuando la lectura tiene baja confianza', async () => {
    repositorio.estacionar('DEF456', 'CARRO', 'A-01');

    await casoDeUso.ejecutar({
      placa: 'DEF456',
      confianza: 0.5,
    });

    expect(repositorio.verificacionesCobros).toHaveLength(0);
  });
});
