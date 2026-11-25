import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CambioAuditado,
  RegistroAuditoria,
} from '../../application/auditoria/registro-auditoria';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaRegistroAuditoria implements RegistroAuditoria {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(cambio: CambioAuditado): Promise<void> {
    await this.prisma.auditoria.create({
      data: {
        usuarioId: cambio.usuarioId,
        accion: cambio.accion,
        entidad: cambio.entidad,
        entidadId: cambio.entidadId,
        // stringify convierte fechas y decimales a texto para la columna JSON.
        datosNuevos: JSON.parse(
          JSON.stringify(cambio.datosNuevos ?? null),
        ) as Prisma.InputJsonValue,
      },
    });
  }
}
