import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AlertaRegistrada,
  AlertaRepositorio,
  DatosResolucion,
  FiltroAlertas,
} from '../../application/alertas/alerta.repositorio';
import { PrismaService } from '../database/prisma.service';

const INCLUIR_RELACIONES = {
  resueltaPor: { select: { id: true, nombre: true } },
  deteccion: {
    select: {
      id: true,
      placaLeida: true,
      confianza: true,
      tipoVisual: true,
      origen: true,
      ocurridaEn: true,
    },
  },
} satisfies Prisma.AlertaInclude;

type AlertaConRelaciones = Prisma.AlertaGetPayload<{
  include: typeof INCLUIR_RELACIONES;
}>;

function aAlertaRegistrada(alerta: AlertaConRelaciones): AlertaRegistrada {
  return {
    id: alerta.id,
    tipo: alerta.tipo,
    estado: alerta.estado,
    placa: alerta.placa,
    detalle: alerta.detalle,
    creadaEn: alerta.creadaEn,
    resueltaEn: alerta.resueltaEn,
    resolucion: alerta.resolucion,
    resueltaPor: alerta.resueltaPor,
    deteccion: alerta.deteccion,
  };
}

@Injectable()
export class PrismaAlertaRepositorio implements AlertaRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtro: FiltroAlertas): Promise<AlertaRegistrada[]> {
    const alertas = await this.prisma.alerta.findMany({
      where: {
        ...(filtro.estado ? { estado: filtro.estado } : {}),
        ...(filtro.tipo ? { tipo: filtro.tipo } : {}),
        ...(filtro.placa ? { placa: { contains: filtro.placa } } : {}),
      },
      include: INCLUIR_RELACIONES,
      orderBy: { creadaEn: 'desc' },
      take: filtro.limite,
    });
    return alertas.map(aAlertaRegistrada);
  }

  async buscar(id: string): Promise<AlertaRegistrada | null> {
    const alerta = await this.prisma.alerta.findUnique({
      where: { id },
      include: INCLUIR_RELACIONES,
    });
    return alerta ? aAlertaRegistrada(alerta) : null;
  }

  resolver(datos: DatosResolucion): Promise<AlertaRegistrada | null> {
    // La resolución, el tipo confirmado y la auditoría se guardan juntos o no se guarda ninguno.
    return this.prisma.$transaction(
      async (tx): Promise<AlertaRegistrada | null> => {
        // Solo resuelve si sigue abierta: evita que dos operadores la resuelvan a la vez.
        const { count } = await tx.alerta.updateMany({
          where: { id: datos.alertaId, estado: 'ABIERTA' },
          data: {
            estado: 'RESUELTA',
            resueltaPorId: datos.usuarioId,
            resolucion: datos.resolucion,
            resueltaEn: datos.resueltaEn,
          },
        });
        if (count === 0) return null;

        const placa = datos.anterior.placa;
        if (datos.tipoConfirmado && placa) {
          // El tipo que confirma el operador queda como tipo registrado: el ingreso usa un espacio compatible.
          await tx.vehiculo.upsert({
            where: { placa },
            create: { placa, tipo: datos.tipoConfirmado },
            update: { tipo: datos.tipoConfirmado },
          });
        }

        await tx.auditoria.create({
          data: {
            usuarioId: datos.usuarioId,
            accion: 'RESOLVER_ALERTA',
            entidad: 'Alerta',
            entidadId: datos.alertaId,
            datosAnteriores: {
              estado: datos.anterior.estado,
              tipo: datos.anterior.tipo,
              placa: datos.anterior.placa,
            },
            datosNuevos: {
              estado: 'RESUELTA',
              resolucion: datos.resolucion,
              tipoConfirmado: datos.tipoConfirmado,
            },
          },
        });

        const alerta = await tx.alerta.findUniqueOrThrow({
          where: { id: datos.alertaId },
          include: INCLUIR_RELACIONES,
        });
        return aAlertaRegistrada(alerta);
      },
    );
  }
}
