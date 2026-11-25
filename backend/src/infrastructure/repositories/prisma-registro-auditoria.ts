import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CambioAuditado,
  RegistroAuditoria,
} from '../../application/auditoria/registro-auditoria';
import { protegerDatosAuditoria } from '../../application/auditoria/proteger-datos-auditoria';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaRegistroAuditoria implements RegistroAuditoria {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(cambio: CambioAuditado): Promise<void> {
    const datosAnteriores = protegerDatosAuditoria(
      cambio.entidad,
      cambio.datosAnteriores,
    );

    const datosNuevos = protegerDatosAuditoria(
      cambio.entidad,
      cambio.datosNuevos,
    );

    await this.prisma.auditoria.create({
      data: {
        usuarioId: cambio.usuarioId,
        accion: cambio.accion,
        entidad: cambio.entidad,
        entidadId: cambio.entidadId,
        datosAnteriores: datosAnteriores ?? Prisma.JsonNull,
        datosNuevos: datosNuevos ?? Prisma.JsonNull,
      },
    });
  }
}
