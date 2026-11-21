import { randomUUID } from 'node:crypto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PrismaTarifaRepository } from './prisma-tarifa.repository';

describe('PrismaTarifaRepository - integración PARQ-21', () => {
  let prisma: PrismaService;
  let repositorio: PrismaTarifaRepository;
  let sedeId: string;

  beforeAll(async () => {
    // Utiliza la base de datos de desarrollo configurada en .env.
    prisma = new PrismaService();
    await prisma.$connect();

    repositorio = new PrismaTarifaRepository(prisma);

    const sede = await prisma.sede.create({
      data: {
        nombre: `TEST-PARQ-21-${randomUUID()}`,
      },
    });

    sedeId = sede.id;
  });

  afterAll(async () => {
    if (prisma) {
      try {
        if (sedeId) {
          await prisma.tarifa.deleteMany({
            where: { sedeId },
          });

          await prisma.sede.delete({
            where: { id: sedeId },
          });
        }
      } finally {
        await prisma.$disconnect();
      }
    }
  });

  it('crea las tarifas iniciales en versión 1', async () => {
    const resultado = await repositorio.crearVersion({
      sedeId,
      tipoVehiculo: 'CARRO',
      valorDiurno: '8000.00',
      valorNocturno: '5000.00',
    });

    expect(resultado.diurna.version).toBe(1);
    expect(resultado.nocturna.version).toBe(1);

    expect(resultado.diurna.valor).toBe('8000.00');
    expect(resultado.nocturna.valor).toBe('5000.00');

    expect(resultado.diurna.vigenteHasta).toBeNull();
    expect(resultado.nocturna.vigenteHasta).toBeNull();
  });

  it('crea una segunda versión y conserva el historial', async () => {
    const resultado = await repositorio.crearVersion({
      sedeId,
      tipoVehiculo: 'CARRO',
      valorDiurno: '9000.00',
      valorNocturno: '6000.00',
    });

    expect(resultado.diurna.version).toBe(2);
    expect(resultado.nocturna.version).toBe(2);

    const historial = await repositorio.listar(sedeId);

    expect(historial).toHaveLength(4);

    const anteriores = historial.filter((tarifa) => tarifa.version === 1);

    expect(anteriores).toHaveLength(2);

    expect(anteriores.every((tarifa) => tarifa.vigenteHasta !== null)).toBe(
      true,
    );

    expect(anteriores.find((tarifa) => tarifa.franja === 'DIURNA')?.valor).toBe(
      '8000.00',
    );

    expect(
      anteriores.find((tarifa) => tarifa.franja === 'NOCTURNA')?.valor,
    ).toBe('5000.00');
  });

  it('devuelve únicamente las tarifas vigentes', async () => {
    const vigentes = await repositorio.listarVigentes(sedeId, new Date());

    expect(vigentes).toHaveLength(2);

    expect(vigentes.every((tarifa) => tarifa.version === 2)).toBe(true);

    expect(vigentes.find((tarifa) => tarifa.franja === 'DIURNA')?.valor).toBe(
      '9000.00',
    );

    expect(vigentes.find((tarifa) => tarifa.franja === 'NOCTURNA')?.valor).toBe(
      '6000.00',
    );
  });

  it('permite consultar una tarifa histórica por ID', async () => {
    const historial = await repositorio.listar(sedeId);

    const historica = historial.find(
      (tarifa) => tarifa.version === 1 && tarifa.franja === 'DIURNA',
    );

    expect(historica).toBeDefined();

    const resultado = await repositorio.buscarPorId(historica!.id);

    expect(resultado?.version).toBe(1);
    expect(resultado?.valor).toBe('8000.00');
    expect(resultado?.vigenteHasta).not.toBeNull();
  });

  it('rechaza la actualización de una sede inexistente', async () => {
    await expect(
      repositorio.crearVersion({
        sedeId: randomUUID(),
        tipoVehiculo: 'CARRO',
        valorDiurno: '9000.00',
        valorNocturno: '6000.00',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('PATCH crea una nueva version y conserva la otra franja', async () => {
    const vigentes = await repositorio.listarVigentes(sedeId, new Date());

    const diurnaActual = vigentes.find(
      (tarifa) => tarifa.tipoVehiculo === 'CARRO' && tarifa.franja === 'DIURNA',
    );

    expect(diurnaActual).toBeDefined();

    const resultado = await repositorio.crearVersion({
      sedeId,
      tipoVehiculo: 'CARRO',
      valorDiurno: '10000.00',
      valorNocturno: '6000.00',
      tarifaEsperadaId: diurnaActual!.id,
    });

    expect(resultado.diurna.version).toBe(3);
    expect(resultado.nocturna.version).toBe(3);
    expect(resultado.diurna.valor).toBe('10000.00');
    expect(resultado.nocturna.valor).toBe('6000.00');

    const anterior = await repositorio.buscarPorId(diurnaActual!.id);

    expect(anterior?.valor).toBe('9000.00');
    expect(anterior?.vigenteHasta).not.toBeNull();
  });

  it('rechaza PATCH basado en una tarifa historica', async () => {
    const historialAntes = await repositorio.listar(sedeId);

    const tarifaHistorica = historialAntes.find(
      (tarifa) =>
        tarifa.tipoVehiculo === 'CARRO' &&
        tarifa.version === 2 &&
        tarifa.franja === 'DIURNA',
    );

    expect(tarifaHistorica).toBeDefined();

    await expect(
      repositorio.crearVersion({
        sedeId,
        tipoVehiculo: 'CARRO',
        valorDiurno: '11000.00',
        valorNocturno: '6000.00',
        tarifaEsperadaId: tarifaHistorica!.id,
      }),
    ).rejects.toThrow(ConflictException);

    const historialDespues = await repositorio.listar(sedeId);

    expect(historialDespues).toHaveLength(historialAntes.length);
  });

  it('rechaza PATCH cuando la otra franja cambio', async () => {
    const vigentes = await repositorio.listarVigentes(sedeId, new Date());

    const nocturnaActual = vigentes.find(
      (tarifa) =>
        tarifa.tipoVehiculo === 'CARRO' && tarifa.franja === 'NOCTURNA',
    );

    expect(nocturnaActual).toBeDefined();

    const historialAntes = await repositorio.listar(sedeId);

    await expect(
      repositorio.crearVersion({
        sedeId,
        tipoVehiculo: 'CARRO',
        valorDiurno: '9000.00',
        valorNocturno: '5500.00',
        tarifaEsperadaId: nocturnaActual!.id,
      }),
    ).rejects.toThrow(ConflictException);

    const historialDespues = await repositorio.listar(sedeId);

    expect(historialDespues).toHaveLength(historialAntes.length);
  });

  it('rechaza una segunda actualizacion basada en la misma tarifa', async () => {
    const vigentes = await repositorio.listarVigentes(sedeId, new Date());

    const diurnaActual = vigentes.find(
      (tarifa) => tarifa.tipoVehiculo === 'CARRO' && tarifa.franja === 'DIURNA',
    );

    expect(diurnaActual).toBeDefined();

    const resultados = await Promise.allSettled([
      repositorio.crearVersion({
        sedeId,
        tipoVehiculo: 'CARRO',
        valorDiurno: '11000.00',
        valorNocturno: '6000.00',
        tarifaEsperadaId: diurnaActual!.id,
      }),
      repositorio.crearVersion({
        sedeId,
        tipoVehiculo: 'CARRO',
        valorDiurno: '12000.00',
        valorNocturno: '6000.00',
        tarifaEsperadaId: diurnaActual!.id,
      }),
    ]);

    const exitosos = resultados.filter(
      (resultado) => resultado.status === 'fulfilled',
    );

    const rechazados = resultados.filter(
      (resultado) => resultado.status === 'rejected',
    );

    expect(exitosos).toHaveLength(1);
    expect(rechazados).toHaveLength(1);

    const rechazo = rechazados[0];

    expect(rechazo.status).toBe('rejected');

    if (rechazo.status === 'rejected') {
      expect(rechazo.reason).toBeInstanceOf(ConflictException);
    }

    const historial = await repositorio.listar(sedeId);

    expect(
      historial.filter(
        (tarifa) =>
          tarifa.tipoVehiculo === 'CARRO' &&
          tarifa.franja === 'DIURNA' &&
          tarifa.vigenteHasta === null,
      ),
    ).toHaveLength(1);

    expect(
      historial.filter(
        (tarifa) =>
          tarifa.tipoVehiculo === 'CARRO' &&
          tarifa.franja === 'NOCTURNA' &&
          tarifa.vigenteHasta === null,
      ),
    ).toHaveLength(1);
  });
});
