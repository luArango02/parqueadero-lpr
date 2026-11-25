import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import {
  URL_BASE_PRUEBAS,
  limpiarBase,
  verificarBaseDePruebas,
} from './base-pruebas';
import { crearEscenario } from './escenario';
import { Flujo, crearFlujo, idDeCobro } from './flujo';

// Integración REAL: casos de uso + repositorios Prisma + PostgreSQL de pruebas. Nada simulado salvo el reloj y el aviso por Socket.IO.
describe('Flujos de espacios y accesos (integración con PostgreSQL de pruebas)', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    verificarBaseDePruebas(process.env.DATABASE_URL);
    prisma = new PrismaService({ datasourceUrl: URL_BASE_PRUEBAS });
    await prisma.$connect();
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.$disconnect();
  });

  /** Base vacía + sede con `carros` espacios de carro. Cada prueba parte de cero. */
  async function iniciar(carros: number): Promise<Flujo> {
    await limpiarBase(prisma);
    const { operadorId } = await crearEscenario(prisma, { carros, motos: 1 });
    return crearFlujo(prisma, operadorId);
  }

  const espaciosCarroLibres = () =>
    prisma.espacio.count({
      where: { tipoCompatible: 'CARRO', estado: 'DISPONIBLE' },
    });

  it('trabaja sobre la base de pruebas y no sobre la de desarrollo', async () => {
    const [{ current_database }] = await prisma.$queryRaw<
      { current_database: string }[]
    >`SELECT current_database()`;

    expect(current_database).toBe('parqueadero_test');
  });

  describe('TC-11: parqueadero lleno con pase pagado', () => {
    it('bloquea el ingreso aunque el pase del día esté pagado, sin crear cobro ni asignar espacio', async () => {
      const flujo = await iniciar(2);
      // PAG111 entra, paga (queda con pase vigente todo el día operativo) y sale.
      const primerIngreso = await flujo.ingresarYPagar('PAG111');
      expect((await flujo.salir('PAG111')).autorizado).toBe(true);
      // Otros dos carros llenan los dos espacios.
      await flujo.ingresarYPagar('LLE111');
      await flujo.ingresarYPagar('LLE222');
      expect(await espaciosCarroLibres()).toBe(0);

      const intento = await flujo.ingresar('PAG111');

      expect(intento).toMatchObject({
        autorizado: false,
        barrera: 'CERRADA',
        espacio: null,
        cobro: null,
      });
      expect(intento.motivo).toContain('LLENO');
      // Sigue con su único cobro, pagado: no se creó ninguno nuevo.
      const cobros = await prisma.cobro.findMany({
        where: { placa: 'PAG111' },
      });
      expect(cobros).toHaveLength(1);
      expect(cobros[0]).toMatchObject({
        id: idDeCobro(primerIngreso),
        estado: 'PAGADO',
      });
      expect(await prisma.cobro.count()).toBe(3);
      // No ocupa ningún espacio y el intento quedó registrado como denegado.
      expect(
        await prisma.permanencia.count({
          where: { vehiculo: { placa: 'PAG111' }, salidaEn: null },
        }),
      ).toBe(0);
      expect(
        await prisma.eventoAcceso.count({
          where: { placa: 'PAG111', tipo: 'INGRESO_DENEGADO' },
        }),
      ).toBe(1);
    });

    it('un carro nuevo con el parqueadero lleno tampoco genera cobro', async () => {
      const flujo = await iniciar(1);
      await flujo.ingresarYPagar('LLE111');

      const intento = await flujo.ingresar('NUE111');

      expect(intento.autorizado).toBe(false);
      expect(intento.motivo).toContain('LLENO');
      expect(await prisma.cobro.count({ where: { placa: 'NUE111' } })).toBe(0);
    });
  });

  describe('TC-12: reintento tras liberar un espacio', () => {
    it('entra con el pase vigente, en el espacio liberado y sin cobro nuevo', async () => {
      const flujo = await iniciar(2);
      const primerIngreso = await flujo.ingresarYPagar('PAG111');
      await flujo.salir('PAG111');
      await flujo.ingresarYPagar('LLE111');
      await flujo.ingresarYPagar('LLE222');
      expect((await flujo.ingresar('PAG111')).autorizado).toBe(false);

      // LLE111 (ya pagó) sale y libera su espacio.
      const salida = await flujo.salir('LLE111');
      expect(salida.autorizado).toBe(true);

      const reintento = await flujo.ingresar('PAG111');

      expect(reintento).toMatchObject({
        autorizado: true,
        barrera: 'ABIERTA',
        reingreso: true,
        motivo: 'REINGRESO CON PASE VIGENTE',
        espacio: salida.espacioLiberado,
      });
      expect(reintento.cobro).toMatchObject({
        id: idDeCobro(primerIngreso),
        estado: 'PAGADO',
      });
      expect(await prisma.cobro.count({ where: { placa: 'PAG111' } })).toBe(1);
      expect(await prisma.cobro.count()).toBe(3);
    });
  });

  describe('TC-13: dos vehículos no obtienen el mismo espacio', () => {
    it('con un solo espacio libre y dos ingresos simultáneos, solo uno lo obtiene', async () => {
      const flujo = await iniciar(2);
      await flujo.ingresarYPagar('OCU111'); // queda un único espacio libre

      const resultados = await Promise.all([
        flujo.ingresar('CMP111'),
        flujo.ingresar('CMP222'),
      ]);

      const autorizados = resultados.filter((r) => r.autorizado);
      const rechazados = resultados.filter((r) => !r.autorizado);
      expect(autorizados).toHaveLength(1);
      expect(rechazados).toHaveLength(1);
      expect(autorizados[0].espacio).toBe('A-02');
      expect(rechazados[0].motivo).toContain('LLENO');
      // En la base de datos: dos permanencias activas, en espacios distintos.
      const activas = await prisma.permanencia.findMany({
        where: { salidaEn: null },
        select: { espacioId: true },
      });
      expect(activas).toHaveLength(2);
      expect(new Set(activas.map((p) => p.espacioId)).size).toBe(2);
      expect(await prisma.espacio.count({ where: { estado: 'OCUPADO' } })).toBe(
        2,
      );
      // El que no obtuvo espacio no quedó con cobro.
      expect(
        await prisma.cobro.count({ where: { placa: rechazados[0].placa } }),
      ).toBe(0);
    });

    it('en una ráfaga de 6 ingresos para 3 espacios nunca se repite un espacio', async () => {
      const flujo = await iniciar(3);
      const placas = [
        'RAF111',
        'RAF222',
        'RAF333',
        'RAF444',
        'RAF555',
        'RAF666',
      ];

      // allSettled: aquí solo se exige la garantía de seguridad (sin duplicados),
      // aunque alguna solicitud pueda terminar en error por la competencia.
      const resultados = await Promise.allSettled(
        placas.map((placa) => flujo.ingresar(placa)),
      );

      const espaciosAsignados = resultados.flatMap((r) =>
        r.status === 'fulfilled' && r.value.autorizado && r.value.espacio
          ? [r.value.espacio]
          : [],
      );
      expect(new Set(espaciosAsignados).size).toBe(espaciosAsignados.length);
      expect(espaciosAsignados.length).toBeLessThanOrEqual(3);

      const activas = await prisma.permanencia.findMany({
        where: { salidaEn: null },
        select: { espacioId: true },
      });
      expect(new Set(activas.map((p) => p.espacioId)).size).toBe(
        activas.length,
      );
      expect(activas).toHaveLength(espaciosAsignados.length);
      expect(await prisma.espacio.count({ where: { estado: 'OCUPADO' } })).toBe(
        espaciosAsignados.length,
      );
    });
  });

  describe('TC-14: una salida bloqueada no libera el espacio', () => {
    it('el espacio sigue ocupado hasta que se paga y se sale', async () => {
      const flujo = await iniciar(1);
      const ingreso = await flujo.ingresar('BLQ111'); // sin pagar
      expect(ingreso).toMatchObject({ autorizado: true, espacio: 'A-01' });

      const bloqueada = await flujo.salir('BLQ111');

      expect(bloqueada).toMatchObject({
        autorizado: false,
        barrera: 'CERRADA',
        espacioLiberado: null,
      });
      expect(bloqueada.motivo).toContain('COBRO PENDIENTE');
      // El espacio y la permanencia siguen activos, y el bloqueo quedó registrado.
      expect(
        await prisma.espacio.findFirstOrThrow({ where: { codigo: 'A-01' } }),
      ).toMatchObject({ estado: 'OCUPADO' });
      const permanencia = await prisma.permanencia.findFirstOrThrow({
        where: { vehiculo: { placa: 'BLQ111' } },
      });
      expect(permanencia.salidaEn).toBeNull();
      expect(permanencia.espacioActivoId).not.toBeNull();
      expect(
        await prisma.eventoAcceso.count({
          where: { placa: 'BLQ111', tipo: 'SALIDA_DENEGADA' },
        }),
      ).toBe(1);
      // Nadie más puede tomar ese espacio mientras tanto.
      expect((await flujo.ingresar('OTR111')).motivo).toContain('LLENO');

      // Recién al pagar y salir se libera.
      await flujo.pagar(idDeCobro(ingreso));
      const salida = await flujo.salir('BLQ111');

      expect(salida).toMatchObject({
        autorizado: true,
        espacioLiberado: 'A-01',
      });
      expect(
        await prisma.espacio.findFirstOrThrow({ where: { codigo: 'A-01' } }),
      ).toMatchObject({ estado: 'DISPONIBLE' });
      const cerrada = await prisma.permanencia.findFirstOrThrow({
        where: { vehiculo: { placa: 'BLQ111' } },
      });
      expect(cerrada.salidaEn).not.toBeNull();
      expect(cerrada.espacioActivoId).toBeNull();
      expect((await flujo.ingresar('OTR111')).espacio).toBe('A-01');
    });
  });
});
