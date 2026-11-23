import { NotificadorAccesos } from './notificador-accesos';
import { Franja } from '../../domain/tiempo/reglas-horario';
import { Reloj } from '../../domain/tiempo/reloj';
import { TipoVehiculo } from '../../domain/vehiculos/placa';
import {
  CobroDelDia,
  DatosDenegado,
  DatosIngreso,
  IngresoRegistrado,
  IngresoRepositorio,
  SedeOperativa,
  TarifaVigente,
} from './ingreso.repositorio';
import { RegistrarIngresoUseCase } from './registrar-ingreso.use-case';

const TARIFAS: Record<TipoVehiculo, Record<Franja, number>> = {
  CARRO: { DIURNA: 8000, NOCTURNA: 5000 },
  MOTO: { DIURNA: 0, NOCTURNA: 0 },
};

// Doble en memoria del repositorio: permite probar las reglas sin base de datos.
class RepositorioEnMemoria implements IngresoRepositorio {
  espaciosLibres: Record<TipoVehiculo, string[]> = {
    CARRO: ['A-01', 'A-02'],
    MOTO: ['M-01'],
  };
  adentro = new Set<string>();
  cobros: CobroDelDia[] = [];
  placasCobro = new Map<string, string>();
  denegados: DatosDenegado[] = [];

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
  carrilDeEntrada(): Promise<string> {
    return Promise.resolve('carril-entrada');
  }
  tipoRegistrado(): Promise<TipoVehiculo | null> {
    return Promise.resolve(null);
  }
  estaAdentro(placa: string): Promise<boolean> {
    return Promise.resolve(this.adentro.has(placa));
  }
  cobroDelDia(
    placa: string,
    _sede: string,
    dia: string,
  ): Promise<CobroDelDia | null> {
    const cobro = this.cobros.find(
      (c) => this.placasCobro.get(c.id) === placa && c.diaOperativo === dia,
    );
    return Promise.resolve(cobro ?? null);
  }
  tarifaVigente(
    _sede: string,
    tipo: TipoVehiculo,
    franja: Franja,
  ): Promise<TarifaVigente> {
    return Promise.resolve({
      id: `${tipo}-${franja}`,
      valor: TARIFAS[tipo][franja],
    });
  }
  registrarIngreso(datos: DatosIngreso): Promise<IngresoRegistrado | null> {
    const espacio = this.espaciosLibres[datos.tipo].shift();
    if (!espacio) return Promise.resolve(null);
    this.adentro.add(datos.placa);
    let cobro: CobroDelDia | null = null;
    if (datos.cobroNuevo) {
      cobro = {
        id: `cobro-${this.cobros.length + 1}`,
        valor: datos.cobroNuevo.valor,
        franja: datos.cobroNuevo.franja,
        estado: 'PENDIENTE',
        diaOperativo: datos.cobroNuevo.diaOperativo,
      };
      this.cobros.push(cobro);
      this.placasCobro.set(cobro.id, datos.placa);
    }
    return Promise.resolve({ espacioCodigo: espacio, cobro });
  }
  registrarDenegado(datos: DatosDenegado): Promise<void> {
    this.denegados.push(datos);
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

describe('RegistrarIngresoUseCase', () => {
  let repositorio: RepositorioEnMemoria;
  let reloj: RelojFijo;
  let notificador: NotificadorFalso;
  let casoDeUso: RegistrarIngresoUseCase;

  beforeEach(() => {
    repositorio = new RepositorioEnMemoria();
    reloj = new RelojFijo(local('2026-11-20T08:00'));
    notificador = new NotificadorFalso();
    casoDeUso = new RegistrarIngresoUseCase(repositorio, reloj, notificador);
  });

  it('una moto entra sin cobro (RN-01)', async () => {
    const resultado = await casoDeUso.ejecutar({ placa: 'xyz45a' });

    expect(resultado).toMatchObject({
      autorizado: true,
      barrera: 'ABIERTA',
      tipoVehiculo: 'MOTO',
      espacio: 'M-01',
      cobro: null,
    });
  });

  it('un carro que entra a las 08:00 queda con cobro diurno pendiente', async () => {
    const resultado = await casoDeUso.ejecutar({ placa: 'ABC123' });

    expect(resultado.autorizado).toBe(true);
    expect(resultado.espacio).toBe('A-01');
    expect(resultado.cobro).toMatchObject({
      valor: 8000,
      franja: 'DIURNA',
      estado: 'PENDIENTE',
      diaOperativo: '2026-11-20',
    });
  });

  it('un carro que entra a las 19:00 queda con cobro nocturno', async () => {
    reloj.instante = local('2026-11-20T19:00');

    const resultado = await casoDeUso.ejecutar({ placa: 'ABC123' });

    expect(resultado.cobro).toMatchObject({ valor: 5000, franja: 'NOCTURNA' });
  });

  it('un carro que entra a la 01:00 pertenece al día operativo anterior', async () => {
    reloj.instante = local('2026-11-21T01:00');

    const resultado = await casoDeUso.ejecutar({ placa: 'ABC123' });

    expect(resultado.cobro).toMatchObject({
      franja: 'NOCTURNA',
      diaOperativo: '2026-11-20',
    });
  });

  it('con pase vigente reingresa sin cobro nuevo (RN-03)', async () => {
    repositorio.cobros.push({
      id: 'pagado',
      valor: 8000,
      franja: 'DIURNA',
      estado: 'PAGADO',
      diaOperativo: '2026-11-20',
    });
    repositorio.placasCobro.set('pagado', 'ABC123');
    reloj.instante = local('2026-11-20T15:00');

    const resultado = await casoDeUso.ejecutar({ placa: 'ABC123' });

    expect(resultado).toMatchObject({
      autorizado: true,
      reingreso: true,
      motivo: 'REINGRESO CON PASE VIGENTE',
    });
    expect(repositorio.cobros).toHaveLength(1);
  });

  it('niega el ingreso de una placa que ya está adentro y genera alerta (anti-passback)', async () => {
    await casoDeUso.ejecutar({ placa: 'ABC123' });

    const resultado = await casoDeUso.ejecutar({ placa: 'ABC123' });

    expect(resultado).toMatchObject({ autorizado: false, barrera: 'CERRADA' });
    expect(repositorio.denegados[0].alertaAntiPassback).toBe(true);
  });

  it('niega el ingreso si no hay espacio para ese tipo y muestra LLENO', async () => {
    repositorio.espaciosLibres.CARRO = [];

    const resultado = await casoDeUso.ejecutar({ placa: 'ABC123' });

    expect(resultado).toMatchObject({
      autorizado: false,
      barrera: 'CERRADA',
      motivo: 'LLENO: SIN ESPACIO PARA CARRO',
    });
  });

  it('con pase pagado también se bloquea si no hay espacio para su tipo (RN-11)', async () => {
    repositorio.cobros.push({
      id: 'pagado',
      valor: 8000,
      franja: 'DIURNA',
      estado: 'PAGADO',
      diaOperativo: '2026-11-20',
    });
    repositorio.placasCobro.set('pagado', 'ABC123');
    repositorio.espaciosLibres.CARRO = [];
    reloj.instante = local('2026-11-20T15:00');

    const resultado = await casoDeUso.ejecutar({ placa: 'ABC123' });

    expect(resultado).toMatchObject({
      autorizado: false,
      barrera: 'CERRADA',
      motivo: 'LLENO: SIN ESPACIO PARA CARRO',
    });
    expect(repositorio.cobros).toHaveLength(1);
    expect(repositorio.denegados).toHaveLength(1);
  });

  it('el lleno de una categoría no bloquea a la otra', async () => {
    repositorio.espaciosLibres.CARRO = [];

    const moto = await casoDeUso.ejecutar({ placa: 'xyz45a' });

    expect(moto).toMatchObject({ autorizado: true, espacio: 'M-01' });
  });

  it('al liberarse un espacio, el reintento con pase pagado entra sin cobro nuevo (RN-11)', async () => {
    repositorio.cobros.push({
      id: 'pagado',
      valor: 8000,
      franja: 'DIURNA',
      estado: 'PAGADO',
      diaOperativo: '2026-11-20',
    });
    repositorio.placasCobro.set('pagado', 'ABC123');
    repositorio.espaciosLibres.CARRO = [];
    reloj.instante = local('2026-11-20T15:00');

    const bloqueado = await casoDeUso.ejecutar({ placa: 'ABC123' });
    repositorio.espaciosLibres.CARRO = ['A-01'];
    const reintento = await casoDeUso.ejecutar({ placa: 'ABC123' });

    expect(bloqueado.autorizado).toBe(false);
    expect(reintento).toMatchObject({
      autorizado: true,
      reingreso: true,
      motivo: 'REINGRESO CON PASE VIGENTE',
    });
    expect(repositorio.cobros).toHaveLength(1);
  });

  it('pide validación manual si la confianza está bajo el umbral', async () => {
    const resultado = await casoDeUso.ejecutar({
      placa: 'ABC123',
      confianza: 0.5,
    });

    expect(resultado.autorizado).toBe(false);
    expect(resultado.motivo).toContain('VALIDACIÓN MANUAL');
  });

  it('pide validación manual si el formato de placa no se reconoce', async () => {
    const resultado = await casoDeUso.ejecutar({ placa: 'AB1234' });

    expect(resultado.autorizado).toBe(false);
    expect(resultado.motivo).toContain('PLACA NO RECONOCIDA');
  });

  it('avisa en tiempo real después de guardar, también cuando niega el paso', async () => {
    await casoDeUso.ejecutar({ placa: 'ABC123' });
    await casoDeUso.ejecutar({ placa: 'ABC123' });

    expect(notificador.avisos).toEqual([
      { autorizado: true, motivo: 'INGRESO CON COBRO DIURNA PENDIENTE' },
      {
        autorizado: false,
        motivo: 'LA PLACA YA FIGURA ADENTRO (ANTI-PASSBACK)',
      },
    ]);
    expect(repositorio.denegados).toHaveLength(1);
  });
});
