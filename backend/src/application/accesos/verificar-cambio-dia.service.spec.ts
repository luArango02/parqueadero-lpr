import { PrismaService } from '../../infrastructure/database/prisma.service';
import { SalidaRepositorio } from './salida.repositorio';
import { VerificarCambioDiaService } from './verificar-cambio-dia.service';

describe('VerificarCambioDiaService - ACT-020', () => {
  const sede = {
    id: 'sede-1',
    zonaHoraria: 'America/Bogota',
    inicioDiaOperativo: '06:00',
    inicioFranjaDiurna: '06:00',
    inicioFranjaNocturna: '18:00',
  };

  const permanencia = {
    id: 'permanencia-1',
    vehiculoId: 'vehiculo-1',
    ingresoEn: new Date('2026-11-20T10:20:00.000Z'),
    vehiculo: {
      placa: 'ABC123',
      tipo: 'CARRO',
    },
    espacio: { sede },
  };

  let findMany: jest.Mock;
  let garantizarCobros: jest.Mock;
  let servicio: VerificarCambioDiaService;

  beforeEach(() => {
    findMany = jest.fn().mockResolvedValue([]);
    garantizarCobros = jest.fn().mockResolvedValue(undefined);

    const prisma = {
      permanencia: { findMany },
    } as unknown as PrismaService;

    const repositorio = {
      garantizarCobrosPorCambioDeDia: garantizarCobros,
    } as unknown as SalidaRepositorio;

    servicio = new VerificarCambioDiaService(prisma, repositorio, {
      ahora: () => new Date('2026-11-24T11:00:00.000Z'),
    });
  });

  it('consulta solamente las permanencias activas', async () => {
    await servicio.verificarCambioDeDia();

    expect(findMany).toHaveBeenCalledWith({
      where: {
        vehiculoActivoId: { not: null },
        salidaEn: null,
      },
      include: {
        vehiculo: true,
        espacio: {
          include: { sede: true },
        },
      },
    });
  });

  it('verifica los cobros de cada permanencia activa', async () => {
    findMany.mockResolvedValue([permanencia]);

    await servicio.verificarCambioDeDia();

    expect(garantizarCobros).toHaveBeenCalledTimes(1);
    expect(garantizarCobros).toHaveBeenCalledWith(
      expect.objectContaining({
        sedeId: 'sede-1',
        vehiculoId: 'vehiculo-1',
        placa: 'ABC123',
        tipo: 'CARRO',
        ingresoEn: permanencia.ingresoEn,
        zonaHoraria: 'America/Bogota',
        inicioDiaOperativo: '06:00',
      }),
    );
  });

  it('no verifica vehículos sin permanencia activa', async () => {
    findMany.mockResolvedValue([]);

    await servicio.verificarCambioDeDia();

    expect(garantizarCobros).not.toHaveBeenCalled();
  });

  it('continúa con otros vehículos si uno falla', async () => {
    findMany.mockResolvedValue([
      permanencia,
      {
        ...permanencia,
        id: 'permanencia-2',
        vehiculoId: 'vehiculo-2',
        vehiculo: {
          placa: 'DEF456',
          tipo: 'CARRO',
        },
      },
    ]);

    garantizarCobros
      .mockRejectedValueOnce(new Error('Error de prueba'))
      .mockResolvedValueOnce(undefined);

    await servicio.verificarCambioDeDia();

    expect(garantizarCobros).toHaveBeenCalledTimes(2);
  });

  it('evita ejecuciones simultáneas dentro de la instancia', async () => {
    let liberar!: () => void;

    findMany.mockImplementation(
      () =>
        new Promise((resolve) => {
          liberar = () => resolve([permanencia]);
        }),
    );

    const primera = servicio.verificarCambioDeDia();
    const segunda = servicio.verificarCambioDeDia();

    await segunda;

    expect(findMany).toHaveBeenCalledTimes(1);

    liberar();
    await primera;

    expect(garantizarCobros).toHaveBeenCalledTimes(1);
  });
});
