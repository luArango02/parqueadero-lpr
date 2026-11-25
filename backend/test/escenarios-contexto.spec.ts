import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { RELOJ } from '../src/domain/tiempo/reloj';
import { RelojControlado } from './dobles/reloj-controlado';
import { RegistrarIngresoUseCase } from '../src/application/accesos/registrar-ingreso.use-case';
import { RegistrarSalidaUseCase } from '../src/application/accesos/registrar-salida.use-case';
import { VerificarCambioDiaService } from '../src/application/accesos/verificar-cambio-dia.service';
import { ConsultarPaseVigenteUseCase } from '../src/application/pases/consultar-pase-vigente.use-case';
import { RegistrarPagoEfectivoUseCase } from '../src/application/pagos/registrar-pago-efectivo.use-case';
import { EventosGateway } from '../src/infrastructure/tiempo-real/eventos.gateway';
import { RegistrarDeteccionUseCase } from '../src/application/detecciones/registrar-deteccion.use-case';
import { ValidarDeteccionUseCase } from '../src/application/detecciones/validar-deteccion.use-case';
import { TarifasService } from '../src/application/tarifas/tarifas.service';

describe('ACT-037 - Escenarios del contexto', () => {
  let prisma: PrismaService;
  let sedeId: string;
  let operadorId: string;
  let carrilEntradaId: string;
  let modulo: TestingModule;
  let reloj: RelojControlado;
  let ingreso: RegistrarIngresoUseCase;
  let salida: RegistrarSalidaUseCase;
  let pago: RegistrarPagoEfectivoUseCase;
  let pase: ConsultarPaseVigenteUseCase;
  let cambioDia: VerificarCambioDiaService;
  let registrarDeteccion: RegistrarDeteccionUseCase;
  let validarDeteccion: ValidarDeteccionUseCase;
  let tarifas: TarifasService;

  beforeAll(async () => {
    const conexion = new URL(process.env.DATABASE_URL ?? '');

    if (
      !['localhost', '127.0.0.1'].includes(conexion.hostname) ||
      conexion.port !== '5433' ||
      conexion.pathname !== '/parqueadero_act037_test'
    ) {
      throw new Error(
        'ACT-037 requiere una base de datos local exclusiva de pruebas.',
      );
    }

    prisma = new PrismaService();
    await prisma.$connect();

    reloj = new RelojControlado('2026-11-23T08:00:00-05:00');

    modulo = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(RELOJ)
      .useValue(reloj)
      .overrideProvider(EventosGateway)
      .useValue({
        emitir: jest.fn(),
      })
      .compile();

    ingreso = modulo.get(RegistrarIngresoUseCase);
    salida = modulo.get(RegistrarSalidaUseCase);
    pago = modulo.get(RegistrarPagoEfectivoUseCase);
    pase = modulo.get(ConsultarPaseVigenteUseCase);
    cambioDia = modulo.get(VerificarCambioDiaService);
    registrarDeteccion = modulo.get(RegistrarDeteccionUseCase);
    validarDeteccion = modulo.get(ValidarDeteccionUseCase);
    tarifas = modulo.get(TarifasService);
  });

  async function limpiarDatos(): Promise<void> {
    await prisma.$transaction([
      prisma.auditoria.deleteMany(),
      prisma.alerta.deleteMany(),
      prisma.pago.deleteMany(),
      prisma.permanencia.deleteMany(),
      prisma.eventoAcceso.deleteMany(),
      prisma.deteccion.deleteMany(),
      prisma.cobro.deleteMany(),
      prisma.tarifa.deleteMany(),
      prisma.espacio.deleteMany(),
      prisma.carril.deleteMany(),
      prisma.vehiculo.deleteMany(),
      prisma.usuario.deleteMany(),
      prisma.sede.deleteMany(),
    ]);
  }

  beforeEach(async () => {
    await limpiarDatos();
    reloj.fijar('2026-11-23T08:00:00-05:00');

    const sede = await prisma.sede.create({
      data: {
        nombre: 'Sede ACT-037',
        zonaHoraria: 'America/Bogota',
        inicioDiaOperativo: '06:00',
        inicioFranjaDiurna: '06:00',
        inicioFranjaNocturna: '18:00',
        umbralConfianza: 0.8,
      },
    });

    sedeId = sede.id;

    const operador = await prisma.usuario.create({
      data: {
        nombre: 'Operador de pruebas',
        email: 'operador-act037@pruebas.local',
        passwordHash: 'fixture-sin-autenticacion',
        rol: 'OPERADOR',
      },
    });

    operadorId = operador.id;

    const entrada = await prisma.carril.create({
      data: {
        sedeId,
        nombre: 'Entrada ACT-037',
        sentido: 'ENTRADA',
      },
    });

    carrilEntradaId = entrada.id;

    await prisma.carril.create({
      data: {
        sedeId,
        nombre: 'Salida ACT-037',
        sentido: 'SALIDA',
      },
    });

    await prisma.espacio.createMany({
      data: [
        {
          sedeId,
          codigo: 'C-01',
          zona: 'CARROS',
          tipoCompatible: 'CARRO',
        },
        {
          sedeId,
          codigo: 'C-02',
          zona: 'CARROS',
          tipoCompatible: 'CARRO',
        },
        {
          sedeId,
          codigo: 'M-01',
          zona: 'MOTOS',
          tipoCompatible: 'MOTO',
        },
      ],
    });

    const vigenteDesde = new Date('2026-01-01T00:00:00-05:00');

    await prisma.tarifa.createMany({
      data: [
        {
          sedeId,
          tipoVehiculo: 'CARRO',
          franja: 'DIURNA',
          valor: 8000,
          version: 1,
          vigenteDesde,
        },
        {
          sedeId,
          tipoVehiculo: 'CARRO',
          franja: 'NOCTURNA',
          valor: 5000,
          version: 1,
          vigenteDesde,
        },
        {
          sedeId,
          tipoVehiculo: 'MOTO',
          franja: 'DIURNA',
          valor: 0,
          version: 1,
          vigenteDesde,
        },
        {
          sedeId,
          tipoVehiculo: 'MOTO',
          franja: 'NOCTURNA',
          valor: 0,
          version: 1,
          vigenteDesde,
        },
      ],
    });
  });

  afterAll(async () => {
    if (prisma) {
      try {
        await limpiarDatos();
      } finally {
        try {
          await modulo?.close();
        } finally {
          await prisma.$disconnect();
        }
      }
    }
  });

  async function entrar(placa: string, fecha: string) {
    reloj.fijar(fecha);

    return ingreso.ejecutar({
      placa,
      confianza: 0.99,
    });
  }

  async function salir(placa: string, fecha: string) {
    reloj.fijar(fecha);

    return salida.ejecutar({
      placa,
      confianza: 0.99,
    });
  }

  async function pagar(cobroId: string) {
    const resultado = await pago.ejecutar({
      cobroId,
      referencia: `ACT037-${cobroId}`,
      registradoPorId: operadorId,
    });

    expect(resultado.estadoCobro).toBe('PAGADO');

    return resultado;
  }

  async function consultarCobros(placa: string) {
    return prisma.cobro.findMany({
      where: {
        placa,
        sedeId,
      },
      orderBy: {
        diaOperativo: 'asc',
      },
    });
  }

  async function verificarCambio(fecha: string) {
    reloj.fijar(fecha);

    await cambioDia.verificarCambioDeDia();
  }

  it('RN-07: una nueva version de tarifas no modifica los cobros anteriores', async () => {
    const placaAnterior = 'ABC123';
    const placaNueva = 'DEF456';

    const entradaAnterior = await entrar(
      placaAnterior,
      '2026-11-23T08:00:00-05:00',
    );

    expect(entradaAnterior.autorizado).toBe(true);

    expect(entradaAnterior.cobro).toMatchObject({
      valor: 8000,
      franja: 'DIURNA',
      estado: 'PENDIENTE',
    });

    const cobroAnterior = await prisma.cobro.findUniqueOrThrow({
      where: {
        id: entradaAnterior.cobro!.id,
      },
    });

    const tarifaAnterior = await prisma.tarifa.findUniqueOrThrow({
      where: {
        id: cobroAnterior.tarifaId,
      },
    });

    expect(tarifaAnterior.version).toBe(1);
    expect(Number(tarifaAnterior.valor)).toBe(8000);

    // Crear la segunda version mediante el servicio real.
    const nuevas = await tarifas.actualizarTarifas({
      sedeId,
      tipoVehiculo: 'CARRO',
      valorDiurno: 10000,
      valorNocturno: 6000,
    });

    expect(nuevas.diurna).toMatchObject({
      version: 2,
      valor: '10000.00',
      franja: 'DIURNA',
      vigenteHasta: null,
    });

    expect(nuevas.nocturna).toMatchObject({
      version: 2,
      valor: '6000.00',
      franja: 'NOCTURNA',
      vigenteHasta: null,
    });

    const historica = await prisma.tarifa.findUniqueOrThrow({
      where: {
        id: tarifaAnterior.id,
      },
    });

    expect(historica.version).toBe(1);
    expect(Number(historica.valor)).toBe(8000);
    expect(historica.vigenteHasta).toEqual(nuevas.diurna.vigenteDesde);

    // Obtener un instante diurno posterior al cambio real.
    const fechaNueva = new Date(nuevas.diurna.vigenteDesde);

    fechaNueva.setUTCDate(fechaNueva.getUTCDate() + 1);
    fechaNueva.setUTCHours(13, 0, 0, 0);

    // Las 13:00 UTC corresponden a las 08:00 en Colombia.
    const entradaNueva = await entrar(placaNueva, fechaNueva.toISOString());

    expect(entradaNueva.autorizado).toBe(true);

    expect(entradaNueva.cobro).toMatchObject({
      valor: 10000,
      franja: 'DIURNA',
      estado: 'PENDIENTE',
    });

    const cobroNuevo = await prisma.cobro.findUniqueOrThrow({
      where: {
        id: entradaNueva.cobro!.id,
      },
    });

    expect(cobroNuevo.tarifaId).toBe(nuevas.diurna.id);

    // Comprobar que el cobro anterior no fue alterado.
    const cobroConservado = await prisma.cobro.findUniqueOrThrow({
      where: {
        id: cobroAnterior.id,
      },
    });

    expect(cobroConservado.tarifaId).toBe(tarifaAnterior.id);
    expect(Number(cobroConservado.valor)).toBe(8000);
    expect(cobroConservado.estado).toBe('PENDIENTE');

    const pagoAnterior = await pagar(cobroAnterior.id);

    expect(Number(pagoAnterior.valor)).toBe(8000);

    expect(
      await prisma.tarifa.count({
        where: {
          sedeId,
          tipoVehiculo: 'CARRO',
        },
      }),
    ).toBe(4);

    expect(
      await prisma.tarifa.count({
        where: {
          sedeId,
          tipoVehiculo: 'CARRO',
          vigenteHasta: null,
        },
      }),
    ).toBe(2);
  });

  it.each([
    [8000, 9000],
    [8000, 8000],
  ])(
    'RN-02: rechaza tarifa diurna %i y nocturna %i',
    async (valorDiurno, valorNocturno) => {
      const anteriores = await prisma.tarifa.findMany({
        where: {
          sedeId,
          tipoVehiculo: 'CARRO',
        },
        orderBy: {
          id: 'asc',
        },
      });

      await expect(
        tarifas.actualizarTarifas({
          sedeId,
          tipoVehiculo: 'CARRO',
          valorDiurno,
          valorNocturno,
        }),
      ).rejects.toMatchObject({
        status: 400,
      });

      const posteriores = await prisma.tarifa.findMany({
        where: {
          sedeId,
          tipoVehiculo: 'CARRO',
        },
        orderBy: {
          id: 'asc',
        },
      });

      expect(posteriores).toEqual(anteriores);
      expect(posteriores).toHaveLength(2);

      expect(
        posteriores.every(
          (tarifa) => tarifa.version === 1 && tarifa.vigenteHasta === null,
        ),
      ).toBe(true);
    },
  );

  it('RN-04: ingresos simultaneos de una misma placa no duplican cobros ni permanencias', async () => {
    const placa = 'ABC123';

    reloj.fijar('2026-11-23T08:00:00-05:00');

    const resultados = await Promise.all([
      ingreso.ejecutar({
        placa,
        confianza: 0.99,
      }),
      ingreso.ejecutar({
        placa,
        confianza: 0.99,
      }),
    ]);

    expect(resultados.filter((resultado) => resultado.autorizado)).toHaveLength(
      1,
    );

    expect(
      resultados.filter((resultado) => !resultado.autorizado),
    ).toHaveLength(1);

    expect(await consultarCobros(placa)).toHaveLength(1);

    expect(
      await prisma.vehiculo.count({
        where: { placa },
      }),
    ).toBe(1);

    expect(
      await prisma.permanencia.count({
        where: {
          vehiculo: { placa },
          salidaEn: null,
        },
      }),
    ).toBe(1);

    expect(
      await prisma.espacio.count({
        where: {
          sedeId,
          estado: 'OCUPADO',
        },
      }),
    ).toBe(1);

    expect(
      await prisma.eventoAcceso.count({
        where: {
          sedeId,
          placa,
          tipo: 'INGRESO',
        },
      }),
    ).toBe(1);
  });

  it('RN-01: motocicleta permanece varios dias operativos sin generar cobros', async () => {
    const placa = 'ABC12D';

    const entrada = await entrar(placa, '2026-11-23T23:00:00-05:00');

    expect(entrada.autorizado).toBe(true);
    expect(entrada.tipoVehiculo).toBe('MOTO');
    expect(entrada.cobro).toBeNull();

    await verificarCambio('2026-11-24T06:00:00-05:00');

    expect(await consultarCobros(placa)).toHaveLength(0);

    await verificarCambio('2026-11-25T06:00:00-05:00');

    expect(await consultarCobros(placa)).toHaveLength(0);

    const resultado = await salir(placa, '2026-11-25T09:00:00-05:00');

    expect(resultado.autorizado).toBe(true);
    expect(await consultarCobros(placa)).toHaveLength(0);

    const espacio = await prisma.espacio.findFirstOrThrow({
      where: {
        sedeId,
        codigo: 'M-01',
      },
    });

    expect(espacio.estado).toBe('DISPONIBLE');
  });

  it('ESC-01: moto ingresa y sale sin generar cobros', async () => {
    const placa = 'ABC12D';

    const entrada = await entrar(placa, '2026-11-23T10:00:00-05:00');

    expect(entrada.autorizado).toBe(true);
    expect(entrada.tipoVehiculo).toBe('MOTO');
    expect(entrada.cobro).toBeNull();
    expect(entrada.espacio).toBe('M-01');

    const resultado = await salir(placa, '2026-11-23T14:00:00-05:00');

    expect(resultado.autorizado).toBe(true);
    expect(resultado.minutosDentro).toBe(240);
    expect(await consultarCobros(placa)).toHaveLength(0);

    expect(
      await prisma.eventoAcceso.count({
        where: {
          placa,
          tipo: { in: ['INGRESO', 'SALIDA'] },
        },
      }),
    ).toBe(2);

    const espacio = await prisma.espacio.findFirstOrThrow({
      where: { sedeId, codigo: 'M-01' },
    });

    expect(espacio.estado).toBe('DISPONIBLE');
  });

  it('ESC-02: carro diurno debe pagar antes de salir', async () => {
    const placa = 'ABC123';

    const entrada = await entrar(placa, '2026-11-23T08:00:00-05:00');

    expect(entrada.autorizado).toBe(true);

    expect(entrada.cobro).toMatchObject({
      valor: 8000,
      franja: 'DIURNA',
      estado: 'PENDIENTE',
      diaOperativo: '2026-11-23',
    });

    const salidaDenegada = await salir(placa, '2026-11-23T12:00:00-05:00');

    expect(salidaDenegada.autorizado).toBe(false);
    expect(salidaDenegada.barrera).toBe('CERRADA');
    expect(salidaDenegada.cobrosPendientes).toHaveLength(1);

    const espacio = await prisma.espacio.findFirstOrThrow({
      where: {
        sedeId,
        codigo: entrada.espacio!,
      },
    });

    expect(espacio.estado).toBe('OCUPADO');

    await pagar(entrada.cobro!.id);

    const salidaAutorizada = await salir(placa, '2026-11-23T12:01:00-05:00');

    expect(salidaAutorizada.autorizado).toBe(true);

    const cobros = await consultarCobros(placa);

    expect(cobros).toHaveLength(1);
    expect(cobros[0].estado).toBe('PAGADO');

    const espacioLiberado = await prisma.espacio.findUniqueOrThrow({
      where: { id: espacio.id },
    });

    expect(espacioLiberado.estado).toBe('DISPONIBLE');
  });

  it('ESC-09: lectura de baja confianza requiere validacion manual y auditoria', async () => {
    reloj.fijar('2026-11-23T10:00:00-05:00');

    const deteccion = await registrarDeteccion.ejecutar({
      placa: 'ABC128',
      confianza: 0.35,
      tipoVisual: 'CARRO',
      carrilId: carrilEntradaId,
    });

    expect(deteccion.estado).toBe('PENDIENTE_REVISION');
    expect(deteccion.confianza).toBe(0.35);
    expect(deteccion.umbralAplicado).toBe(0.8);
    expect(deteccion.placaLeida).toBe('ABC128');
    expect(deteccion.ocurridaEn).toEqual(reloj.ahora());

    const pendiente = await prisma.deteccion.findUniqueOrThrow({
      where: {
        id: deteccion.id,
      },
    });

    expect(pendiente.lecturaManual).toBe(false);
    expect(pendiente.estado).toBe('PENDIENTE_REVISION');

    expect(await prisma.permanencia.count()).toBe(0);
    expect(await prisma.cobro.count()).toBe(0);

    const motivo = 'La camara confundio el numero 3 con el 8';

    const validada = await validarDeteccion.ejecutar({
      deteccionId: deteccion.id,
      usuarioId: operadorId,
      placa: 'abc 123',
      motivo,
    });

    expect(validada).toMatchObject({
      id: deteccion.id,
      placaLeida: 'ABC128',
      placaFinal: 'ABC123',
      estado: 'CORREGIDA',
      lecturaManual: true,
      corregidaPorId: operadorId,
      motivoCorreccion: motivo,
    });

    const persistida = await prisma.deteccion.findUniqueOrThrow({
      where: {
        id: deteccion.id,
      },
    });

    expect(persistida).toMatchObject({
      placaLeida: 'ABC128',
      placaFinal: 'ABC123',
      estado: 'CORREGIDA',
      lecturaManual: true,
      corregidaPorId: operadorId,
      motivoCorreccion: motivo,
    });

    const auditorias = await prisma.auditoria.findMany({
      where: {
        accion: 'VALIDAR_LECTURA',
        entidad: 'Deteccion',
        entidadId: deteccion.id,
      },
    });

    expect(auditorias).toHaveLength(1);

    expect(auditorias[0].usuarioId).toBe(operadorId);

    expect(auditorias[0].datosAnteriores).toMatchObject({
      placaLeida: 'ABC128',
      estado: 'PENDIENTE_REVISION',
      lecturaManual: false,
    });

    expect(auditorias[0].datosNuevos).toMatchObject({
      placaLeida: 'ABC128',
      placaFinal: 'ABC123',
      estado: 'CORREGIDA',
      lecturaManual: true,
      motivo,
    });

    // Una lectura corregida no debe validarse nuevamente.
    await expect(
      validarDeteccion.ejecutar({
        deteccionId: deteccion.id,
        usuarioId: operadorId,
        placa: 'ABC124',
        motivo: 'Segundo intento de correccion',
      }),
    ).rejects.toThrow('La lectura no está pendiente de revisión');

    expect(
      await prisma.auditoria.count({
        where: {
          accion: 'VALIDAR_LECTURA',
          entidadId: deteccion.id,
        },
      }),
    ).toBe(1);
  });

  it('TC-10: ingreso a las 05:20 y permanencia hasta las 06:10 generan dos cobros sin duplicados', async () => {
    const placa = 'ABC123';

    const entrada = await entrar(placa, '2026-11-24T05:20:00-05:00');

    expect(entrada.autorizado).toBe(true);

    expect(entrada.cobro).toMatchObject({
      valor: 5000,
      franja: 'NOCTURNA',
      diaOperativo: '2026-11-23',
      estado: 'PENDIENTE',
    });

    const cobroNocturnoId = entrada.cobro!.id;

    await verificarCambio('2026-11-24T05:59:59-05:00');

    expect(await consultarCobros(placa)).toHaveLength(1);

    await verificarCambio('2026-11-24T06:00:00-05:00');

    const cobros = await consultarCobros(placa);

    expect(cobros).toHaveLength(2);

    expect(cobros[0].id).toBe(cobroNocturnoId);
    expect(cobros[0].franja).toBe('NOCTURNA');
    expect(Number(cobros[0].valor)).toBe(5000);

    expect(cobros[1].franja).toBe('DIURNA');
    expect(Number(cobros[1].valor)).toBe(8000);

    expect(cobros[1].diaOperativo.toISOString().slice(0, 10)).toBe(
      '2026-11-24',
    );

    await verificarCambio('2026-11-24T06:10:00-05:00');
    await verificarCambio('2026-11-24T06:10:00-05:00');

    const cobrosFinales = await consultarCobros(placa);

    expect(cobrosFinales).toHaveLength(2);

    expect(cobrosFinales.map((cobro) => cobro.id)).toEqual(
      cobros.map((cobro) => cobro.id),
    );

    const resultado = await salir(placa, '2026-11-24T06:10:00-05:00');

    expect(resultado.autorizado).toBe(false);
    expect(resultado.cobrosPendientes).toHaveLength(2);

    await pagar(cobros[0].id);
    await pagar(cobros[1].id);

    expect((await salir(placa, '2026-11-24T06:11:00-05:00')).autorizado).toBe(
      true,
    );

    expect(await consultarCobros(placa)).toHaveLength(2);
  });

  it('TC-11: pase vigente no permite ingresar cuando no hay cupo', async () => {
    const placa = 'ABC123';

    const primeraEntrada = await entrar(placa, '2026-11-23T08:00:00-05:00');

    expect(primeraEntrada.autorizado).toBe(true);

    const cobroId = primeraEntrada.cobro!.id;

    await pagar(cobroId);

    expect((await salir(placa, '2026-11-23T10:00:00-05:00')).autorizado).toBe(
      true,
    );

    // Ocupar los dos espacios disponibles para carros.
    expect(
      (await entrar('DEF456', '2026-11-23T11:00:00-05:00')).autorizado,
    ).toBe(true);

    expect(
      (await entrar('GHI789', '2026-11-23T11:10:00-05:00')).autorizado,
    ).toBe(true);

    reloj.fijar('2026-11-23T12:00:00-05:00');

    expect(await pase.ejecutar(placa)).toMatchObject({
      vigente: true,
      cobroId,
    });

    const reingreso = await entrar(placa, '2026-11-23T12:00:00-05:00');

    expect(reingreso.autorizado).toBe(false);

    const cobros = await consultarCobros(placa);

    expect(cobros).toHaveLength(1);
    expect(cobros[0].id).toBe(cobroId);
    expect(cobros[0].estado).toBe('PAGADO');

    expect(
      await prisma.permanencia.count({
        where: {
          vehiculo: { placa },
          salidaEn: null,
        },
      }),
    ).toBe(0);

    expect(
      await prisma.espacio.count({
        where: {
          sedeId,
          tipoCompatible: 'CARRO',
          estado: 'OCUPADO',
        },
      }),
    ).toBe(2);

    // El espacio de motocicletas no puede asignarse a un carro.
    expect(
      await prisma.espacio.count({
        where: {
          sedeId,
          tipoCompatible: 'MOTO',
          estado: 'DISPONIBLE',
        },
      }),
    ).toBe(1);
  });

  it('TC-12: pase vigente permite reingresar cuando se libera un cupo', async () => {
    const placa = 'ABC123';

    const entrada = await entrar(placa, '2026-11-23T08:00:00-05:00');

    expect(entrada.autorizado).toBe(true);

    const cobroId = entrada.cobro!.id;

    await pagar(cobroId);

    expect((await salir(placa, '2026-11-23T10:00:00-05:00')).autorizado).toBe(
      true,
    );

    const ocupante = await entrar('DEF456', '2026-11-23T11:00:00-05:00');

    expect(ocupante.autorizado).toBe(true);

    expect(
      (await entrar('GHI789', '2026-11-23T11:10:00-05:00')).autorizado,
    ).toBe(true);

    const rechazado = await entrar(placa, '2026-11-23T12:00:00-05:00');

    expect(rechazado.autorizado).toBe(false);

    await pagar(ocupante.cobro!.id);

    expect(
      (await salir('DEF456', '2026-11-23T12:30:00-05:00')).autorizado,
    ).toBe(true);

    const autorizado = await entrar(placa, '2026-11-23T13:00:00-05:00');

    expect(autorizado.autorizado).toBe(true);
    expect(autorizado.reingreso).toBe(true);
    expect(autorizado.espacio).toBe(ocupante.espacio);

    expect(autorizado.cobro).toMatchObject({
      id: cobroId,
      estado: 'PAGADO',
      valor: 8000,
    });

    expect(await consultarCobros(placa)).toHaveLength(1);
  });

  it('TC-13: dos carros compiten por el ultimo espacio y solo uno ingresa', async () => {
    const ocupante = await entrar('ABC123', '2026-11-23T08:00:00-05:00');

    expect(ocupante.autorizado).toBe(true);

    reloj.fijar('2026-11-23T09:00:00-05:00');

    const resultados = await Promise.all([
      ingreso.ejecutar({
        placa: 'DEF456',
        confianza: 0.99,
      }),
      ingreso.ejecutar({
        placa: 'GHI789',
        confianza: 0.99,
      }),
    ]);

    expect(resultados.filter((resultado) => resultado.autorizado)).toHaveLength(
      1,
    );

    expect(
      resultados.filter((resultado) => !resultado.autorizado),
    ).toHaveLength(1);

    expect(
      await prisma.espacio.count({
        where: {
          sedeId,
          tipoCompatible: 'CARRO',
          estado: 'OCUPADO',
        },
      }),
    ).toBe(2);

    const permanencias = await prisma.permanencia.findMany({
      where: {
        salidaEn: null,
        espacio: { sedeId },
      },
    });

    expect(permanencias).toHaveLength(2);

    expect(new Set(permanencias.map((item) => item.espacioId)).size).toBe(2);

    expect(
      await prisma.cobro.count({
        where: {
          sedeId,
          placa: { in: ['DEF456', 'GHI789'] },
        },
      }),
    ).toBe(1);

    expect(
      await prisma.eventoAcceso.count({
        where: {
          sedeId,
          placa: { in: ['DEF456', 'GHI789'] },
          tipo: 'INGRESO_DENEGADO',
        },
      }),
    ).toBe(1);
  });

  it('TC-14: salida denegada conserva la permanencia y el espacio ocupado', async () => {
    const placa = 'ABC123';

    const entrada = await entrar(placa, '2026-11-23T08:00:00-05:00');

    expect(entrada.autorizado).toBe(true);

    const antes = await prisma.permanencia.findFirstOrThrow({
      where: {
        vehiculo: { placa },
        salidaEn: null,
      },
    });

    const resultado = await salir(placa, '2026-11-23T12:00:00-05:00');

    expect(resultado.autorizado).toBe(false);
    expect(resultado.barrera).toBe('CERRADA');
    expect(resultado.cobrosPendientes).toHaveLength(1);

    const despues = await prisma.permanencia.findUniqueOrThrow({
      where: { id: antes.id },
    });

    expect(despues.salidaEn).toBeNull();
    expect(despues.eventoSalidaId).toBeNull();
    expect(despues.espacioId).toBe(antes.espacioId);
    expect(despues.vehiculoActivoId).toBe(antes.vehiculoActivoId);
    expect(despues.espacioActivoId).toBe(antes.espacioActivoId);

    const espacio = await prisma.espacio.findUniqueOrThrow({
      where: { id: antes.espacioId },
    });

    expect(espacio.estado).toBe('OCUPADO');

    expect(
      await prisma.eventoAcceso.count({
        where: {
          sedeId,
          placa,
          tipo: 'SALIDA_DENEGADA',
        },
      }),
    ).toBe(1);

    expect(
      await prisma.eventoAcceso.count({
        where: {
          sedeId,
          placa,
          tipo: 'SALIDA',
        },
      }),
    ).toBe(0);
  });

  it('TC-15: discrepancia de clasificacion genera alerta y no asigna espacio', async () => {
    const placa = 'ABC123';

    await prisma.vehiculo.create({
      data: {
        placa,
        tipo: 'CARRO',
      },
    });

    reloj.fijar('2026-11-23T10:00:00-05:00');

    const deteccion = await registrarDeteccion.ejecutar({
      placa,
      confianza: 0.99,
      tipoVisual: 'MOTO',
      carrilId: carrilEntradaId,
    });

    expect(deteccion.alertaId).not.toBeNull();

    const alerta = await prisma.alerta.findUniqueOrThrow({
      where: {
        id: deteccion.alertaId!,
      },
    });

    expect(alerta).toMatchObject({
      sedeId,
      placa,
      tipo: 'DISCREPANCIA_TIPO',
      estado: 'ABIERTA',
      deteccionId: deteccion.id,
    });

    const resultado = await entrar(placa, '2026-11-23T10:01:00-05:00');

    expect(resultado.autorizado).toBe(false);

    expect(
      await prisma.permanencia.count({
        where: {
          vehiculo: { placa },
          salidaEn: null,
        },
      }),
    ).toBe(0);

    expect(await consultarCobros(placa)).toHaveLength(0);

    expect(
      await prisma.espacio.count({
        where: {
          sedeId,
          estado: 'OCUPADO',
        },
      }),
    ).toBe(0);
  });

  it.each([
    ['2026-11-24T05:59:59-05:00', '2026-11-23', 'NOCTURNA', 5000],
    ['2026-11-24T06:00:00-05:00', '2026-11-24', 'DIURNA', 8000],
    ['2026-11-24T17:59:59-05:00', '2026-11-24', 'DIURNA', 8000],
    ['2026-11-24T18:00:00-05:00', '2026-11-24', 'NOCTURNA', 5000],
  ])(
    'Limite horario %s: dia %s, franja %s y valor %i',
    async (fecha, diaOperativo, franja, valor) => {
      const entrada = await entrar('ABC123', fecha);

      expect(entrada.autorizado).toBe(true);

      expect(entrada.cobro).toMatchObject({
        diaOperativo,
        franja,
        valor,
        estado: 'PENDIENTE',
      });

      expect(await consultarCobros('ABC123')).toHaveLength(1);
    },
  );

  it('ESC-03: reingreso diurno conserva el cobro pagado', async () => {
    const placa = 'ABC123';

    const primeraEntrada = await entrar(placa, '2026-11-23T08:00:00-05:00');

    expect(primeraEntrada.autorizado).toBe(true);

    const cobroId = primeraEntrada.cobro!.id;

    await pagar(cobroId);

    expect((await salir(placa, '2026-11-23T12:00:00-05:00')).autorizado).toBe(
      true,
    );

    reloj.fijar('2026-11-23T15:00:00-05:00');

    expect(await pase.ejecutar(placa)).toMatchObject({
      vigente: true,
      cobroId,
    });

    const reingreso = await entrar(placa, '2026-11-23T15:00:00-05:00');

    expect(reingreso.autorizado).toBe(true);
    expect(reingreso.reingreso).toBe(true);
    expect(reingreso.cobro!.id).toBe(cobroId);
    expect(reingreso.cobro!.estado).toBe('PAGADO');

    expect(await consultarCobros(placa)).toHaveLength(1);
  });

  it('ESC-04: reingreso nocturno conserva el pago diurno', async () => {
    const placa = 'ABC123';

    const primeraEntrada = await entrar(placa, '2026-11-23T08:00:00-05:00');

    expect(primeraEntrada.autorizado).toBe(true);

    const cobroId = primeraEntrada.cobro!.id;

    await pagar(cobroId);

    expect((await salir(placa, '2026-11-23T12:00:00-05:00')).autorizado).toBe(
      true,
    );

    expect((await entrar(placa, '2026-11-23T15:00:00-05:00')).autorizado).toBe(
      true,
    );

    expect((await salir(placa, '2026-11-23T17:00:00-05:00')).autorizado).toBe(
      true,
    );

    const reingreso = await entrar(placa, '2026-11-23T22:00:00-05:00');

    expect(reingreso.autorizado).toBe(true);
    expect(reingreso.reingreso).toBe(true);

    expect(reingreso.cobro).toMatchObject({
      id: cobroId,
      franja: 'DIURNA',
      valor: 8000,
      estado: 'PAGADO',
    });

    expect(await consultarCobros(placa)).toHaveLength(1);
  });

  it('ESC-05: primer ingreso a las 19:00 aplica tarifa nocturna', async () => {
    const placa = 'ABC123';

    const entrada = await entrar(placa, '2026-11-23T19:00:00-05:00');

    expect(entrada.autorizado).toBe(true);

    expect(entrada.cobro).toMatchObject({
      valor: 5000,
      franja: 'NOCTURNA',
      estado: 'PENDIENTE',
      diaOperativo: '2026-11-23',
    });

    expect(entrada.cobro!.valor).toBeLessThan(8000);

    expect(await consultarCobros(placa)).toHaveLength(1);
  });

  it('ESC-06: ingreso a las 23:00 y salida a la 01:00 mantienen un solo cobro', async () => {
    const placa = 'ABC123';

    const entrada = await entrar(placa, '2026-11-23T23:00:00-05:00');

    expect(entrada.autorizado).toBe(true);

    expect(entrada.cobro).toMatchObject({
      valor: 5000,
      franja: 'NOCTURNA',
      diaOperativo: '2026-11-23',
    });

    await pagar(entrada.cobro!.id);

    const resultado = await salir(placa, '2026-11-24T01:00:00-05:00');

    expect(resultado.autorizado).toBe(true);
    expect(resultado.minutosDentro).toBe(120);

    const cobros = await consultarCobros(placa);

    expect(cobros).toHaveLength(1);
    expect(cobros[0].estado).toBe('PAGADO');

    expect(cobros[0].diaOperativo.toISOString().slice(0, 10)).toBe(
      '2026-11-23',
    );
  });

  it('ESC-07: permanencia a las 06:00 genera un nuevo cobro diurno sin duplicados', async () => {
    const placa = 'ABC123';

    const entrada = await entrar(placa, '2026-11-24T05:50:00-05:00');

    expect(entrada.autorizado).toBe(true);

    expect(entrada.cobro).toMatchObject({
      valor: 5000,
      franja: 'NOCTURNA',
      diaOperativo: '2026-11-23',
    });

    await pagar(entrada.cobro!.id);

    await verificarCambio('2026-11-24T05:59:59-05:00');

    expect(await consultarCobros(placa)).toHaveLength(1);

    await verificarCambio('2026-11-24T06:00:00-05:00');

    let cobros = await consultarCobros(placa);

    expect(cobros).toHaveLength(2);

    expect(cobros[0].id).toBe(entrada.cobro!.id);
    expect(cobros[0].estado).toBe('PAGADO');
    expect(Number(cobros[0].valor)).toBe(5000);

    expect(cobros[1].franja).toBe('DIURNA');
    expect(cobros[1].estado).toBe('PENDIENTE');
    expect(Number(cobros[1].valor)).toBe(8000);

    expect(cobros[1].diaOperativo.toISOString().slice(0, 10)).toBe(
      '2026-11-24',
    );

    await verificarCambio('2026-11-24T06:01:00-05:00');

    await verificarCambio('2026-11-24T08:59:00-05:00');

    expect(await consultarCobros(placa)).toHaveLength(2);

    const bloqueada = await salir(placa, '2026-11-24T09:00:00-05:00');

    expect(bloqueada.autorizado).toBe(false);
    expect(bloqueada.cobrosPendientes).toHaveLength(1);

    await pagar(cobros[1].id);

    const autorizada = await salir(placa, '2026-11-24T09:01:00-05:00');

    expect(autorizada.autorizado).toBe(true);

    cobros = await consultarCobros(placa);

    expect(cobros).toHaveLength(2);

    expect(cobros.every((cobro) => cobro.estado === 'PAGADO')).toBe(true);
  });

  it('ESC-08: pago del lunes no habilita el pase del martes', async () => {
    const placa = 'ABC123';

    const lunes = await entrar(placa, '2026-11-23T08:00:00-05:00');

    expect(lunes.autorizado).toBe(true);

    await pagar(lunes.cobro!.id);

    expect((await salir(placa, '2026-11-23T12:00:00-05:00')).autorizado).toBe(
      true,
    );

    reloj.fijar('2026-11-24T07:00:00-05:00');

    expect(await pase.ejecutar(placa)).toMatchObject({
      vigente: false,
      diaOperativo: '2026-11-24',
    });

    const martes = await entrar(placa, '2026-11-24T07:00:00-05:00');

    expect(martes.autorizado).toBe(true);
    expect(martes.reingreso).toBe(false);
    expect(martes.cobro!.id).not.toBe(lunes.cobro!.id);

    expect(martes.cobro).toMatchObject({
      valor: 8000,
      franja: 'DIURNA',
      estado: 'PENDIENTE',
      diaOperativo: '2026-11-24',
    });

    const cobros = await consultarCobros(placa);

    expect(cobros).toHaveLength(2);
    expect(cobros[0].estado).toBe('PAGADO');
    expect(cobros[1].estado).toBe('PENDIENTE');
  });

  it('TC-09: ingreso a las 05:20 y salida a las 05:50 conservan tarifa nocturna', async () => {
    const placa = 'ABC123';

    const entrada = await entrar(placa, '2026-11-24T05:20:00-05:00');

    expect(entrada.autorizado).toBe(true);

    expect(entrada.cobro).toMatchObject({
      valor: 5000,
      franja: 'NOCTURNA',
      diaOperativo: '2026-11-23',
    });

    await pagar(entrada.cobro!.id);

    const resultado = await salir(placa, '2026-11-24T05:50:00-05:00');

    expect(resultado.autorizado).toBe(true);

    await verificarCambio('2026-11-24T06:00:00-05:00');

    const cobros = await consultarCobros(placa);

    expect(cobros).toHaveLength(1);
    expect(cobros[0].franja).toBe('NOCTURNA');
    expect(Number(cobros[0].valor)).toBe(5000);
    expect(cobros[0].estado).toBe('PAGADO');
  });

  it('prepara los datos independientes de cada escenario', async () => {
    expect(await prisma.sede.count()).toBe(1);

    expect(await prisma.carril.count({ where: { sedeId } })).toBe(2);

    expect(await prisma.espacio.count({ where: { sedeId } })).toBe(3);

    expect(await prisma.tarifa.count({ where: { sedeId } })).toBe(4);

    expect(
      await prisma.usuario.findUnique({
        where: { id: operadorId },
      }),
    ).not.toBeNull();

    expect(
      await prisma.carril.findUnique({
        where: { id: carrilEntradaId },
      }),
    ).not.toBeNull();

    expect(await prisma.cobro.count()).toBe(0);
    expect(await prisma.permanencia.count()).toBe(0);
  });
});
