import { Injectable } from '@nestjs/common';
import {
  DatosValidacion,
  DeteccionPorValidar,
  DeteccionValidada,
  ValidacionDeteccionRepositorio,
} from '../../application/detecciones/validacion-deteccion.repositorio';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaValidacionDeteccionRepositorio implements ValidacionDeteccionRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  buscarDeteccion(id: string): Promise<DeteccionPorValidar | null> {
    return this.prisma.deteccion.findUnique({
      where: { id },
      select: {
        id: true,
        placaLeida: true,
        placaFinal: true,
        confianza: true,
        estado: true,
      },
    });
  }

  registrarValidacion(
    datos: DatosValidacion,
  ): Promise<DeteccionValidada | null> {
    // La corrección y su auditoría se guardan juntas o no se guarda ninguna.
    return this.prisma.$transaction(
      async (tx): Promise<DeteccionValidada | null> => {
        // Solo actualiza si la lectura sigue pendiente: evita pisar otra validación.
        const { count } = await tx.deteccion.updateMany({
          where: { id: datos.deteccionId, estado: 'PENDIENTE_REVISION' },
          data: {
            placaFinal: datos.placaFinal,
            estado: datos.estado,
            lecturaManual: true,
            corregidaPorId: datos.usuarioId,
            motivoCorreccion: datos.motivo,
          },
        });
        if (count === 0) return null;

        await tx.auditoria.create({
          data: {
            usuarioId: datos.usuarioId,
            accion: 'VALIDAR_LECTURA',
            entidad: 'Deteccion',
            entidadId: datos.deteccionId,
            datosAnteriores: {
              placaLeida: datos.anterior.placaLeida,
              placaFinal: datos.anterior.placaFinal,
              estado: datos.anterior.estado,
              lecturaManual: false,
            },
            datosNuevos: {
              placaLeida: datos.anterior.placaLeida,
              placaFinal: datos.placaFinal,
              estado: datos.estado,
              lecturaManual: true,
              motivo: datos.motivo,
            },
          },
        });

        return tx.deteccion.findUniqueOrThrow({
          where: { id: datos.deteccionId },
          select: {
            id: true,
            placaLeida: true,
            placaFinal: true,
            confianza: true,
            estado: true,
            lecturaManual: true,
            corregidaPorId: true,
            motivoCorreccion: true,
          },
        });
      },
    );
  }
}
