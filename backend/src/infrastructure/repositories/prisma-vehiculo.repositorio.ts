import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  FiltroVehiculos,
  VehiculoConsultado,
  VehiculoRepositorio,
} from '../../application/vehiculos/vehiculo.repositorio';
import { estadoDe } from '../../domain/vehiculos/estado-vehiculo';
import { TipoVehiculo } from '../../domain/vehiculos/placa';
import { PrismaService } from '../database/prisma.service';

// Una permanencia sin cerrar es la que conserva vehiculoActivoId.
const SIN_CERRAR = { vehiculoActivoId: { not: null } } as const;

const INCLUIR_PERMANENCIA_ACTIVA = {
  permanencias: {
    where: SIN_CERRAR,
    include: { espacio: { select: { codigo: true } } },
    take: 1,
  },
} satisfies Prisma.VehiculoInclude;

type VehiculoConPermanencia = Prisma.VehiculoGetPayload<{
  include: typeof INCLUIR_PERMANENCIA_ACTIVA;
}>;

function aVehiculoConsultado(
  vehiculo: VehiculoConPermanencia,
): VehiculoConsultado {
  const activa = vehiculo.permanencias[0];
  const permanenciaActiva = activa
    ? {
        id: activa.id,
        espacio: activa.espacio.codigo,
        ingresoEn: activa.ingresoEn,
      }
    : null;
  return {
    id: vehiculo.id,
    placa: vehiculo.placa,
    tipo: vehiculo.tipo,
    creadoEn: vehiculo.creadoEn,
    estado: estadoDe(permanenciaActiva !== null),
    permanenciaActiva,
  };
}

@Injectable()
export class PrismaVehiculoRepositorio implements VehiculoRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorPlaca(placa: string): Promise<VehiculoConsultado | null> {
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { placa },
      include: INCLUIR_PERMANENCIA_ACTIVA,
    });
    return vehiculo ? aVehiculoConsultado(vehiculo) : null;
  }

  async listar(filtro: FiltroVehiculos): Promise<VehiculoConsultado[]> {
    const where: Prisma.VehiculoWhereInput = {
      ...(filtro.placa ? { placa: { contains: filtro.placa } } : {}),
      ...(filtro.tipo ? { tipo: filtro.tipo } : {}),
      ...(filtro.estado === 'DENTRO'
        ? { permanencias: { some: SIN_CERRAR } }
        : {}),
      ...(filtro.estado === 'FUERA'
        ? { permanencias: { none: SIN_CERRAR } }
        : {}),
    };
    const vehiculos = await this.prisma.vehiculo.findMany({
      where,
      include: INCLUIR_PERMANENCIA_ACTIVA,
      orderBy: { creadoEn: 'desc' },
      take: filtro.limite,
    });
    return vehiculos.map(aVehiculoConsultado);
  }

  async crear(
    placa: string,
    tipo: TipoVehiculo,
  ): Promise<VehiculoConsultado | null> {
    try {
      const vehiculo = await this.prisma.vehiculo.create({
        data: { placa, tipo },
        include: INCLUIR_PERMANENCIA_ACTIVA,
      });
      return aVehiculoConsultado(vehiculo);
    } catch (error) {
      // P2002: la placa ya existe (restricción única), también si dos peticiones llegan a la vez.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return null;
      }
      throw error;
    }
  }
}
