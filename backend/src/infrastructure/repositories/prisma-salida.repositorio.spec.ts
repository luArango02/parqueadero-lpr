import { randomUUID } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { PrismaSalidaRepositorio } from './prisma-salida.repositorio';
import type { DatosVerificacionCobros } from '../../application/accesos/salida.repositorio';

describe('PrismaSalidaRepositorio - integración ACT-020', () => {
  let prisma: PrismaService;
  let repositorio: PrismaSalidaRepositorio;
  let sedeId: string;
  let vehiculoId: string;
  let placa: string;
  let tarifaId: string;

  const ingresoEn = new Date('2026-11-20T10:20:00.000Z');
  const verificadoEn = new Date('2026-11-20T11:10:00.000Z');

  function datos(
    cambios: Partial<DatosVerificacionCobros> = {},
  ): DatosVerificacionCobros {
    return {
      sedeId,
      vehiculoId,
      placa,
      tipo: 'CARRO',
      ingresoEn,
      verificadoEn,
      zonaHoraria: 'America/Bogota',
      inicioDiaOperativo: '06:00',
      inicioFranjaDiurna: '06:00',
      inicioFranjaNocturna: '18:00',
      ...cambios,
    };
  }

  beforeAll(async () => {
    const url = process.env.DATABASE_URL;

    if (!url) {
      throw new Error(
        'ACT-020 requiere DATABASE_URL para la base de pruebas',
      );
    }

    const destino = new URL(url);

    if (
      destino.pathname !== '/parqueadero_test' ||
      !['localhost', '127.0.0.1'].includes(destino.hostname) ||
      destino.port !== '5433'
    ) {
      throw new Error(
        'ACT-020 solo permite PostgreSQL de pruebas en localhost:5433/parqueadero_test',
      );
    }

    prisma = new PrismaService();
    await prisma.$connect();

    repositorio = new PrismaSalidaRepositorio(prisma);

    placa = `T${randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`;

    const sede = await prisma.sede.create({
      data: {
        nombre: `TEST-ACT-020-${randomUUID()}`,
      },
    });

    sedeId = sede.id;

    const vehiculo = await prisma.vehiculo.create({
      data: {
        placa,
        tipo: 'CARRO',
      },
    });

    vehiculoId = vehiculo.id;

    const tarifa = await prisma.tarifa.create({
      data: {
        sedeId,
        tipoVehiculo: 'CARRO',
        franja: 'DIURNA',
        valor: '8000.00',
        version: 1,
        vigenteDesde: new Date('2026-11-01T00:00:00.000Z'),
      },
    });

    tarifaId = tarifa.id;
  });

  afterAll(async () => {
    if (!prisma) return;

    try {
      if (sedeId) {
        const cobros = await prisma.cobro.findMany({
          where: { sedeId },
          select: { id: true },
        });

        const ids = cobros.map((cobro) => cobro.id);

        await prisma.auditoria.deleteMany({
          where: {
            entidad: 'Cobro',
            entidadId: { in: ids },
            accion: 'COBRO_CAMBIO_DIA_OPERATIVO',
          },
        });

        await prisma.cobro.deleteMany({ where: { sedeId } });
        await prisma.tarifa.deleteMany({ where: { sedeId } });
        await prisma.sede.delete({ where: { id: sedeId } });
      }

      if (vehiculoId) {
        await prisma.vehiculo.delete({
          where: { id: vehiculoId },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  it('genera un cobro diurno al cruzar las 06:00', async () => {
    await repositorio.garantizarCobrosPorCambioDeDia(datos());

    const cobros = await prisma.cobro.findMany({
      where: { sedeId, placa },
    });

    expect(cobros).toHaveLength(1);
    expect(cobros[0].diaOperativo.toISOString().slice(0, 10)).toBe(
      '2026-11-20',
    );
    expect(cobros[0].franja).toBe('DIURNA');
    expect(cobros[0].estado).toBe('PENDIENTE');
    expect(cobros[0].valor.toString()).toBe('8000');
    expect(cobros[0].tarifaId).toBe(tarifaId);
  });

  it('no duplica el cobro al repetir la verificación', async () => {
    await repositorio.garantizarCobrosPorCambioDeDia(datos());
    await repositorio.garantizarCobrosPorCambioDeDia(datos());

    const cantidad = await prisma.cobro.count({
      where: { sedeId, placa },
    });

    expect(cantidad).toBe(1);
  });

  it('registra una auditoría para el cobro generado', async () => {
    const cobro = await prisma.cobro.findFirstOrThrow({
      where: { sedeId, placa },
    });

    const auditorias = await prisma.auditoria.findMany({
      where: {
        accion: 'COBRO_CAMBIO_DIA_OPERATIVO',
        entidad: 'Cobro',
        entidadId: cobro.id,
      },
    });

    expect(auditorias).toHaveLength(1);
    expect(auditorias[0].datosNuevos).toMatchObject({
      placa,
      sedeId,
      diaOperativo: '2026-11-20',
      franja: 'DIURNA',
      tarifaId,
    });
  });

  it('no genera cobros para una motocicleta', async () => {
    const placaMoto =
      `M${randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`;

    await repositorio.garantizarCobrosPorCambioDeDia(
      datos({
        placa: placaMoto,
        tipo: 'MOTO',
      }),
    );

    const cantidad = await prisma.cobro.count({
      where: { sedeId, placa: placaMoto },
    });

    expect(cantidad).toBe(0);
  });

  it('no genera un cobro si todavía no son las 06:00', async () => {
    const otraPlaca = `N${randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`;

    await repositorio.garantizarCobrosPorCambioDeDia(
      datos({
        placa: otraPlaca,
        verificadoEn: new Date('2026-11-20T10:50:00.000Z'),
      }),
    );

    const cantidad = await prisma.cobro.count({
      where: { sedeId, placa: otraPlaca },
    });

    expect(cantidad).toBe(0);
  });

  it('evita cobros duplicados ante verificaciones concurrentes', async () => {
    const placaConcurrente = `C${randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`;

    const vehiculoConcurrente = await prisma.vehiculo.create({
      data: {
        placa: placaConcurrente,
        tipo: 'CARRO',
      },
    });

    try {
      const datosConcurrentes = datos({
        placa: placaConcurrente,
        vehiculoId: vehiculoConcurrente.id,
      });

      // Dos repositorios independientes comparten PostgreSQL.
      const otroRepositorio = new PrismaSalidaRepositorio(prisma);

      await Promise.all([
        repositorio.garantizarCobrosPorCambioDeDia(datosConcurrentes),
        otroRepositorio.garantizarCobrosPorCambioDeDia(datosConcurrentes),
      ]);

      const cobros = await prisma.cobro.findMany({
        where: {
          sedeId,
          placa: placaConcurrente,
        },
      });

      expect(cobros).toHaveLength(1);
      expect(cobros[0].diaOperativo.toISOString().slice(0, 10)).toBe(
        '2026-11-20',
      );

      const auditorias = await prisma.auditoria.findMany({
        where: {
          accion: 'COBRO_CAMBIO_DIA_OPERATIVO',
          entidad: 'Cobro',
          entidadId: cobros[0].id,
        },
      });

      expect(auditorias).toHaveLength(1);
    } finally {
      // Primero se eliminan las auditorías y los cobros.
      const cobros = await prisma.cobro.findMany({
        where: {
          sedeId,
          placa: placaConcurrente,
        },
        select: { id: true },
      });

      await prisma.auditoria.deleteMany({
        where: {
          entidad: 'Cobro',
          entidadId: { in: cobros.map((cobro) => cobro.id) },
          accion: 'COBRO_CAMBIO_DIA_OPERATIVO',
        },
      });

      await prisma.cobro.deleteMany({
        where: {
          sedeId,
          placa: placaConcurrente,
        },
      });

      await prisma.vehiculo.delete({
        where: { id: vehiculoConcurrente.id },
      });
    }
  });
});
