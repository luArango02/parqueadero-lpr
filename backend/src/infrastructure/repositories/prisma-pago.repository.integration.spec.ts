
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaPagoRepository } from './prisma-pago.repository';
import { PrismaService } from '../database/prisma.service';

describe('PrismaPagoRepository (integración PostgreSQL)', () => {
  const prisma = new PrismaClient();
  const repositorio = new PrismaPagoRepository(
    prisma as PrismaService,
  );

  const prefijo = `ACT023-${randomUUID()}`;
  const usuarioId = randomUUID();
  const sedeId = randomUUID();
  const vehiculoIds: string[] = [];
  const cobroIds: string[] = [];
  const pagoIds: string[] = [];
  const tarifaId = randomUUID();

  let consecutivo = 0;

  const nuevaReferencia = () => `${prefijo}-${randomUUID()}`;

  async function crearCobro(
    estado: 'PENDIENTE' | 'ANULADO' | 'VENCIDO' = 'PENDIENTE',
  ) {
    consecutivo++;

    const vehiculoId = randomUUID();
    const placa = `T${String(consecutivo).padStart(5, '0')}`;

    await prisma.vehiculo.create({
      data: {
        id: vehiculoId,
        placa,
        tipo: 'CARRO',
      },
    });

    vehiculoIds.push(vehiculoId);

    const cobro = await prisma.cobro.create({
      data: {
        sedeId,
        vehiculoId,
        placa,
        diaOperativo: new Date('2026-11-23T00:00:00.000Z'),
        franja: 'DIURNA',
        tarifaId,
        valor: '10000.00',
        estado,
      },
    });

    cobroIds.push(cobro.id);
    return cobro;
  }

  beforeAll(async () => {
    const url = process.env.DATABASE_URL;

    if (!url) {
      throw new Error('DATABASE_URL no está configurada.');
    }

    const nombreBase = new URL(url).pathname.slice(1);

    if (nombreBase !== 'parqueadero_lpr_test') {
      throw new Error(
        `Prueba bloqueada: la base actual es "${nombreBase}".`,
      );
    }

    await prisma.$connect();

    await prisma.usuario.create({
      data: {
        id: usuarioId,
        nombre: 'Operador de pruebas ACT-023',
        email: `${randomUUID()}@act023.test`,
        passwordHash: 'solo-pruebas',
        rol: 'OPERADOR',
      },
    });

    await prisma.sede.create({
      data: {
        id: sedeId,
        nombre: `Sede ${prefijo}`,
      },
    });

    await prisma.tarifa.create({
      data: {
        id: tarifaId,
        sedeId,
        tipoVehiculo: 'CARRO',
        franja: 'DIURNA',
        valor: '10000.00',
        version: 1,
        vigenteDesde: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
  });

  afterAll(async () => {
    try {
      await prisma.auditoria.deleteMany({
        where: {
          usuarioId,
          accion: 'REGISTRAR_PAGO_EFECTIVO',
        },
      });

      await prisma.pago.deleteMany({
        where: { cobroId: { in: cobroIds } },
      });

      await prisma.cobro.deleteMany({
        where: { id: { in: cobroIds } },
      });

      await prisma.tarifa.deleteMany({
        where: { id: tarifaId },
      });

      await prisma.vehiculo.deleteMany({
        where: { id: { in: vehiculoIds } },
      });

      await prisma.sede.deleteMany({
        where: { id: sedeId },
      });

      await prisma.usuario.deleteMany({
        where: { id: usuarioId },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  it('registra el pago, actualiza el cobro y crea auditoría', async () => {
    const cobro = await crearCobro();
    const referencia = nuevaReferencia();

    const resultado = await repositorio.registrarEfectivo({
      cobroId: cobro.id,
      referencia,
      registradoPorId: usuarioId,
    });

    const cobroActualizado = await prisma.cobro.findUniqueOrThrow({
      where: { id: cobro.id },
    });

    const pago = await prisma.pago.findUniqueOrThrow({
      where: { referencia },
    });

    const auditorias = await prisma.auditoria.findMany({
      where: {
        entidad: 'Pago',
        entidadId: pago.id,
        accion: 'REGISTRAR_PAGO_EFECTIVO',
      },
    });

    expect(resultado.id).toBe(pago.id);
    expect(resultado.valor).toBe('10000.00');
    expect(resultado.medio).toBe('EFECTIVO');
    expect(resultado.estadoCobro).toBe('PAGADO');
    expect(cobroActualizado.estado).toBe('PAGADO');
    expect(auditorias).toHaveLength(1);
    expect(auditorias[0].usuarioId).toBe(usuarioId);
  });

  it('repetir la misma referencia devuelve el mismo pago', async () => {
    const cobro = await crearCobro();
    const solicitud = {
      cobroId: cobro.id,
      referencia: nuevaReferencia(),
      registradoPorId: usuarioId,
    };

    const primero = await repositorio.registrarEfectivo(solicitud);
    const segundo = await repositorio.registrarEfectivo(solicitud);

    const cantidadPagos = await prisma.pago.count({
      where: { cobroId: cobro.id },
    });

    const cantidadAuditorias = await prisma.auditoria.count({
      where: {
        entidad: 'Pago',
        entidadId: primero.id,
      },
    });

    expect(segundo.id).toBe(primero.id);
    expect(cantidadPagos).toBe(1);
    expect(cantidadAuditorias).toBe(1);
  });

  it('rechaza reutilizar una referencia para otro cobro', async () => {
    const primero = await crearCobro();
    const segundo = await crearCobro();
    const referencia = nuevaReferencia();

    await repositorio.registrarEfectivo({
      cobroId: primero.id,
      referencia,
      registradoPorId: usuarioId,
    });

    await expect(
      repositorio.registrarEfectivo({
        cobroId: segundo.id,
        referencia,
        registradoPorId: usuarioId,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(
      await prisma.pago.count({ where: { cobroId: segundo.id } }),
    ).toBe(0);
  });

  it('rechaza pagar dos veces el mismo cobro con referencias diferentes', async () => {
    const cobro = await crearCobro();

    await repositorio.registrarEfectivo({
      cobroId: cobro.id,
      referencia: nuevaReferencia(),
      registradoPorId: usuarioId,
    });

    await expect(
      repositorio.registrarEfectivo({
        cobroId: cobro.id,
        referencia: nuevaReferencia(),
        registradoPorId: usuarioId,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(
      await prisma.pago.count({ where: { cobroId: cobro.id } }),
    ).toBe(1);
  });

  it.each(['ANULADO', 'VENCIDO'] as const)(
    'rechaza pagar un cobro en estado %s',
    async (estado) => {
      const cobro = await crearCobro(estado);

      await expect(
        repositorio.registrarEfectivo({
          cobroId: cobro.id,
          referencia: nuevaReferencia(),
          registradoPorId: usuarioId,
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(
        await prisma.pago.count({ where: { cobroId: cobro.id } }),
      ).toBe(0);
    },
  );

  it('rechaza un cobro inexistente', async () => {
    await expect(
      repositorio.registrarEfectivo({
        cobroId: randomUUID(),
        referencia: nuevaReferencia(),
        registradoPorId: usuarioId,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('dos solicitudes simultáneas no generan pagos duplicados', async () => {
    const cobro = await crearCobro();
    const solicitud = {
      cobroId: cobro.id,
      referencia: nuevaReferencia(),
      registradoPorId: usuarioId,
    };

    const resultados = await Promise.allSettled([
      repositorio.registrarEfectivo(solicitud),
      repositorio.registrarEfectivo(solicitud),
    ]);

    const pagos = await prisma.pago.findMany({
      where: { cobroId: cobro.id },
    });

    expect(pagos).toHaveLength(1);

    expect(
      resultados.every((resultado) => resultado.status === 'fulfilled'),
    ).toBe(true);

    const pagosDevueltos = resultados.filter(
      (
        resultado,
      ): resultado is PromiseFulfilledResult<
        Awaited<ReturnType<typeof repositorio.registrarEfectivo>>
      > => resultado.status === 'fulfilled',
    );

    expect(pagosDevueltos).toHaveLength(2);
    expect(pagosDevueltos[0].value.id).toBe(pagos[0].id);
    expect(pagosDevueltos[1].value.id).toBe(pagos[0].id);
  });

  it('revierte el cobro si falla el registro del pago', async () => {
    const cobro = await crearCobro();

    await expect(
      repositorio.registrarEfectivo({
        cobroId: cobro.id,
        referencia: nuevaReferencia(),
        registradoPorId: randomUUID(),
      }),
    ).rejects.toThrow();

    const cobroActualizado = await prisma.cobro.findUniqueOrThrow({
      where: { id: cobro.id },
    });

    expect(cobroActualizado.estado).toBe('PENDIENTE');
    expect(
      await prisma.pago.count({ where: { cobroId: cobro.id } }),
    ).toBe(0);
  });
});
