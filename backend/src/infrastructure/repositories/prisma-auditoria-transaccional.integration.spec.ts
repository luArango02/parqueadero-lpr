import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { PrismaEspacioRepositorio } from './prisma-espacio.repositorio';
import { PrismaTarifaRepository } from './prisma-tarifa.repository';

const describirIntegracion =
  process.env.RUN_AUDITORIA_INTEGRATION === 'true' ? describe : describe.skip;

describirIntegracion('ACT-031 - Reversion transaccional de auditoria', () => {
  let prisma: PrismaService;
  let espacios: PrismaEspacioRepositorio;
  let tarifas: PrismaTarifaRepository;

  const usuarioInexistente = randomUUID();

  beforeAll(async () => {
    const conexion = new URL(process.env.DATABASE_URL ?? '');

    if (
      conexion.pathname !== '/parqueadero_lpr_test' ||
      conexion.hostname !== 'localhost' ||
      conexion.port !== '5433'
    ) {
      throw new Error('La prueba requiere la base de datos aislada.');
    }

    prisma = new PrismaService();
    await prisma.$connect();

    const bases = await prisma.$queryRaw<Array<{ nombre: string }>>`
      SELECT current_database() AS nombre
    `;

    if (bases[0]?.nombre !== 'parqueadero_lpr_test') {
      throw new Error('Base de datos incorrecta.');
    }

    espacios = new PrismaEspacioRepositorio(prisma);
    tarifas = new PrismaTarifaRepository(prisma);

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioInexistente },
    });

    expect(usuario).toBeNull();
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it('revierte la modificacion del espacio si falla la auditoria', async () => {
    const anterior = await prisma.espacio.findFirstOrThrow({
      where: {
        codigo: 'A-02',
        estado: 'DISPONIBLE',
      },
    });

    const auditoriasAntes = await prisma.auditoria.count({
      where: {
        entidad: 'Espacio',
        entidadId: anterior.id,
      },
    });

    await expect(
      espacios.actualizar(
        anterior.id,
        { estado: 'FUERA_DE_SERVICIO' },
        usuarioInexistente,
      ),
    ).rejects.toMatchObject({
      code: 'P2003',
    });

    const posterior = await prisma.espacio.findUniqueOrThrow({
      where: { id: anterior.id },
    });

    const auditoriasDespues = await prisma.auditoria.count({
      where: {
        entidad: 'Espacio',
        entidadId: anterior.id,
      },
    });

    expect(posterior).toEqual(anterior);
    expect(auditoriasDespues).toBe(auditoriasAntes);
  });

  it('revierte el versionamiento de tarifas si falla la auditoria', async () => {
    const sede = await prisma.sede.findFirstOrThrow({
      where: { nombre: 'Sede Principal' },
    });

    const filtro: Prisma.TarifaWhereInput = {
      sedeId: sede.id,
      tipoVehiculo: 'CARRO',
    };

    const anteriores = await prisma.tarifa.findMany({
      where: filtro,
      orderBy: { id: 'asc' },
    });

    const diurna = anteriores.find(
      (tarifa) => tarifa.franja === 'DIURNA' && tarifa.vigenteHasta === null,
    );

    const nocturna = anteriores.find(
      (tarifa) => tarifa.franja === 'NOCTURNA' && tarifa.vigenteHasta === null,
    );

    if (!diurna || !nocturna) {
      throw new Error('No existe el par vigente de tarifas.');
    }

    const auditoriasAntes = await prisma.auditoria.count({
      where: { entidad: 'Tarifa' },
    });

    await expect(
      tarifas.crearVersion({
        sedeId: sede.id,
        tipoVehiculo: 'CARRO',
        valorDiurno: diurna.valor.plus(1000).toFixed(2),
        valorNocturno: nocturna.valor.toFixed(2),
        tarifaEsperadaId: diurna.id,
        usuarioId: usuarioInexistente,
      }),
    ).rejects.toMatchObject({
      code: 'P2003',
    });

    const posteriores = await prisma.tarifa.findMany({
      where: filtro,
      orderBy: { id: 'asc' },
    });

    const auditoriasDespues = await prisma.auditoria.count({
      where: { entidad: 'Tarifa' },
    });

    expect(posteriores).toEqual(anteriores);
    expect(auditoriasDespues).toBe(auditoriasAntes);
  });
});
