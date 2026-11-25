import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CambiosEspacio,
  DatosEspacio,
  EspacioConPlaca,
  EspacioRegistrado,
  EspacioRepositorio,
  FiltroEspacios,
  SedeActual,
} from '../../application/espacios/espacio.repositorio';
import { EstadoEspacio } from '../../domain/espacios/espacio';
import { PrismaService } from '../database/prisma.service';
import { protegerDatosAuditoria } from '../../application/auditoria/proteger-datos-auditoria';

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

  async listar(
    sedeId: string,
    filtro: FiltroEspacios,
  ): Promise<EspacioConPlaca[]> {
    const espacios = await this.prisma.espacio.findMany({
      where: {
        sedeId,
        ...(filtro.zona ? { zona: filtro.zona } : {}),
        ...(filtro.tipo ? { tipoCompatible: filtro.tipo } : {}),
        ...(filtro.estado ? { estado: filtro.estado } : {}),
      },
      select: {
        ...CAMPOS_ESPACIO,
        // La permanencia sin salida es el vehículo que está adentro (a lo sumo una por espacio).
        permanencias: {
          where: { salidaEn: null },
          select: { vehiculo: { select: { placa: true } } },
          take: 1,
        },
      },
      orderBy: [{ zona: 'asc' }, { codigo: 'asc' }],
    });
    return espacios.map(({ permanencias, ...espacio }) => ({
      ...espacio,
      placa: permanencias[0]?.vehiculo.placa ?? null,
    }));
  }

  async crear(
    sedeId: string,
    datos: DatosEspacio,
    usuarioId?: string,
  ): Promise<EspacioRegistrado | null> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const espacio = await tx.espacio.create({
          data: { ...datos, sedeId },
          select: CAMPOS_ESPACIO,
        });

        if (usuarioId) {
          const datosNuevos = protegerDatosAuditoria('Espacio', espacio);

          await tx.auditoria.create({
            data: {
              usuarioId,
              accion: 'CREAR_ESPACIO',
              entidad: 'Espacio',
              entidadId: espacio.id,
              datosAnteriores: Prisma.JsonNull,
              datosNuevos: datosNuevos ?? Prisma.JsonNull,
            },
          });
        }

        return espacio;
      });
    } catch (error) {
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
    usuarioId?: string,
  ): Promise<EspacioRegistrado | null> {
    return this.prisma.$transaction(
      async (tx): Promise<EspacioRegistrado | null> => {
        // Bloquea el registro durante la modificación.
        const registros = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM espacios
        WHERE id = ${id}
        FOR UPDATE
      `;

        if (registros.length === 0) {
          return null;
        }

        const anterior = await tx.espacio.findUnique({
          where: { id },
          select: CAMPOS_ESPACIO,
        });

        if (!anterior || anterior.estado === 'OCUPADO') {
          return null;
        }

        // Conserva la protección contra ingresos concurrentes.
        const { count } = await tx.espacio.updateMany({
          where: {
            id,
            estado: { not: 'OCUPADO' },
          },
          data: cambios,
        });

        if (count === 0) {
          return null;
        }

        const actualizado = await tx.espacio.findUniqueOrThrow({
          where: { id },
          select: CAMPOS_ESPACIO,
        });

        if (usuarioId) {
          const datosAnteriores = protegerDatosAuditoria('Espacio', anterior);

          const datosNuevos = protegerDatosAuditoria('Espacio', actualizado);

          await tx.auditoria.create({
            data: {
              usuarioId,
              accion: 'MODIFICAR_ESPACIO',
              entidad: 'Espacio',
              entidadId: actualizado.id,
              datosAnteriores: datosAnteriores ?? Prisma.JsonNull,
              datosNuevos: datosNuevos ?? Prisma.JsonNull,
            },
          });
        }

        return actualizado;
      },
    );
  }
}
