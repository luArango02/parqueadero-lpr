import { Injectable } from '@nestjs/common';
import { CupoRepositorio } from '../../application/espacios/cupo.repositorio';
import { ConteoPorEstado } from '../../domain/espacios/cupos';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaCupoRepositorio implements CupoRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async contarEspacios(): Promise<ConteoPorEstado[] | null> {
    const sede = await this.prisma.sede.findFirst({
      orderBy: { nombre: 'asc' },
      select: { id: true },
    });
    if (!sede) return null;

    // Se cuenta en el momento sobre los espacios individuales: no hay contadores que mantener.
    const grupos = await this.prisma.espacio.groupBy({
      by: ['zona', 'tipoCompatible', 'estado'],
      where: { sedeId: sede.id },
      _count: { _all: true },
    });
    return grupos.map((g) => ({
      zona: g.zona,
      tipo: g.tipoCompatible,
      estado: g.estado,
      cantidad: g._count._all,
    }));
  }
}
