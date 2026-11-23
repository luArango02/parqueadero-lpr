import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DatosDeteccion,
  DatosDiscrepancia,
  DeteccionGuardada,
  DeteccionRepositorio,
  SedeDeLectura,
} from '../../application/detecciones/deteccion.repositorio';
import { TipoVehiculo } from '../../domain/vehiculos/placa';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaDeteccionRepositorio implements DeteccionRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async sedeDeLectura(): Promise<SedeDeLectura> {
    const sede = await this.prisma.sede.findFirst({
      orderBy: { nombre: 'asc' },
    });
    if (!sede) {
      throw new NotFoundException('No hay sede configurada: ejecute el seed');
    }
    return { id: sede.id, umbralConfianza: sede.umbralConfianza };
  }

  async carrilDeLectura(sedeId: string, carrilId?: string): Promise<string> {
    const carril = await this.prisma.carril.findFirst({
      where: carrilId
        ? { sedeId, id: carrilId }
        : { sedeId, sentido: 'ENTRADA' },
      orderBy: { nombre: 'asc' },
    });
    if (!carril) {
      throw new NotFoundException('Carril no encontrado');
    }
    return carril.id;
  }

  async tipoRegistrado(placa: string): Promise<TipoVehiculo | null> {
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { placa },
      select: { tipo: true },
    });
    return vehiculo?.tipo ?? null;
  }

  guardar(
    datos: DatosDeteccion,
    discrepancia: DatosDiscrepancia | null,
  ): Promise<DeteccionGuardada> {
    // La detección y su alerta se guardan juntas: la alerta apunta a la detección como evidencia.
    return this.prisma.$transaction(async (tx): Promise<DeteccionGuardada> => {
      const deteccion = await tx.deteccion.create({ data: datos });
      const alerta = discrepancia
        ? await tx.alerta.create({
            data: {
              sedeId: discrepancia.sedeId,
              tipo: 'DISCREPANCIA_TIPO',
              placa: discrepancia.placa,
              detalle: discrepancia.detalle,
              deteccionId: deteccion.id,
            },
            select: { id: true },
          })
        : null;
      return {
        id: deteccion.id,
        carrilId: deteccion.carrilId,
        placaLeida: deteccion.placaLeida,
        confianza: deteccion.confianza,
        tipoVisual: deteccion.tipoVisual,
        origen: deteccion.origen,
        estado: deteccion.estado,
        ocurridaEn: deteccion.ocurridaEn,
        alertaId: alerta?.id ?? null,
      };
    });
  }
}
