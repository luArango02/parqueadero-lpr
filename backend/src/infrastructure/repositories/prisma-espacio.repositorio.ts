import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CambiosEspacio,
  DatosEspacio,
  EspacioRegistrado,
  EspacioRepositorio,
  FiltroEspacios,
  SedeActual,
} from '../../application/espacios/espacio.repositorio';
import { EstadoEspacio } from '../../domain/espacios/espacio';
import { PrismaService } from '../database/prisma.service';

const CAMPOS_ESPACIO = {
  id: true,
  codigo: true,
  zona: true,
  tipoCompatible: true,
  estado: true,
} as const;

@Injectable()
export class PrismaEspacioRepositorio implements EspacioRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async idSedeActual(): Promise<string | null> {
    const sede = await this.prisma.sede.findFirst({
      orderBy: { nombre: 'asc' },
      select: { id: true },
    });
    return sede?.id ?? null;
  }

  async sedeActual(): Promise<SedeActual | null> {
    const sede = await this.prisma.sede.findFirst({
      orderBy: { nombre: 'asc' },
      include: {
        carriles: {
          select: { id: true, nombre: true, sentido: true },
          orderBy: { nombre: 'asc' },
        },
      },
    });
    if (!sede) return null;

    const grupos = await this.prisma.espacio.groupBy({
      by: ['estado'],
      where: { sedeId: sede.id },
      _count: { _all: true },
    });
    const cuantos = (estado: EstadoEspacio): number =>
      grupos.find((g) => g.estado === estado)?._count._all ?? 0;
    const disponibles = cuantos('DISPONIBLE');
    const ocupados = cuantos('OCUPADO');
    const fueraDeServicio = cuantos('FUERA_DE_SERVICIO');

    return {
      id: sede.id,
      nombre: sede.nombre,
      zonaHoraria: sede.zonaHoraria,
      inicioDiaOperativo: sede.inicioDiaOperativo,
      inicioFranjaDiurna: sede.inicioFranjaDiurna,
      inicioFranjaNocturna: sede.inicioFranjaNocturna,
      umbralConfianza: sede.umbralConfianza,
      carriles: sede.carriles,
      resumenEspacios: {
        total: disponibles + ocupados + fueraDeServicio,
        disponibles,
        ocupados,
        fueraDeServicio,
      },
    };
  }

  listar(sedeId: string, filtro: FiltroEspacios): Promise<EspacioRegistrado[]> {
    return this.prisma.espacio.findMany({
      where: {
        sedeId,
        ...(filtro.zona ? { zona: filtro.zona } : {}),
        ...(filtro.tipo ? { tipoCompatible: filtro.tipo } : {}),
        ...(filtro.estado ? { estado: filtro.estado } : {}),
      },
      select: CAMPOS_ESPACIO,
      orderBy: [{ zona: 'asc' }, { codigo: 'asc' }],
    });
  }

  async crear(
    sedeId: string,
    datos: DatosEspacio,
  ): Promise<EspacioRegistrado | null> {
    try {
      return await this.prisma.espacio.create({
        data: { ...datos, sedeId },
        select: CAMPOS_ESPACIO,
      });
    } catch (error) {
      // P2002: el código ya existe en la sede (restricción única), también si dos peticiones llegan a la vez.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return null;
      }
      throw error;
    }
  }

  buscar(id: string): Promise<EspacioRegistrado | null> {
    return this.prisma.espacio.findUnique({
      where: { id },
      select: CAMPOS_ESPACIO,
    });
  }

  actualizar(
    id: string,
    cambios: CambiosEspacio,
  ): Promise<EspacioRegistrado | null> {
    return this.prisma.$transaction(
      async (tx): Promise<EspacioRegistrado | null> => {
        // Solo actualiza si no está ocupado: evita pisar a un ingreso que lo tome al mismo tiempo.
        const { count } = await tx.espacio.updateMany({
          where: { id, estado: { not: 'OCUPADO' } },
          data: cambios,
        });
        if (count === 0) return null;
        return tx.espacio.findUniqueOrThrow({
          where: { id },
          select: CAMPOS_ESPACIO,
        });
      },
    );
  }
}
