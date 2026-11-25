import { protegerDatosAuditoria } from '../../application/auditoria/proteger-datos-auditoria';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  AuditoriaRepositorio,
  FiltrosAuditoria,
  ResultadoAuditoria,
} from '../../application/auditoria/auditoria.repositorio';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaAuditoriaRepositorio implements AuditoriaRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: FiltrosAuditoria): Promise<ResultadoAuditoria> {
    const where: Prisma.AuditoriaWhereInput = {
      usuarioId: filtros.usuarioId,
      entidadId: filtros.entidadId,
    };

    if (filtros.accion) {
      where.accion = {
        contains: filtros.accion,
        mode: 'insensitive',
      };
    }

    if (filtros.entidad) {
      where.entidad = {
        equals: filtros.entidad,
        mode: 'insensitive',
      };
    }

    if (filtros.desde || filtros.hasta) {
      where.ocurridaEn = {
        gte: filtros.desde,
        lte: filtros.hasta,
      };
    }

    const [datos, total] = await this.prisma.$transaction([
      this.prisma.auditoria.findMany({
        where,
        select: {
          id: true,
          usuarioId: true,
          accion: true,
          entidad: true,
          entidadId: true,
          datosAnteriores: true,
          datosNuevos: true,
          ocurridaEn: true,
          usuario: {
            select: {
              id: true,
              nombre: true,
              rol: true,
            },
          },
        },
        orderBy: [{ ocurridaEn: 'desc' }, { id: 'asc' }],
        skip: (filtros.pagina - 1) * filtros.limite,
        take: filtros.limite,
      }),
      this.prisma.auditoria.count({ where }),
    ]);

    return {
      datos: datos.map((registro) => ({
        ...registro,
        datosAnteriores: protegerDatosAuditoria(
          registro.entidad,
          registro.datosAnteriores,
        ),
        datosNuevos: protegerDatosAuditoria(
          registro.entidad,
          registro.datosNuevos,
        ),
      })),
      total,
      pagina: filtros.pagina,
      limite: filtros.limite,
      totalPaginas: Math.ceil(total / filtros.limite),
    };
  }
}
