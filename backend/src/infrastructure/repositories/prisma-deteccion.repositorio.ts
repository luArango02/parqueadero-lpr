import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DatosDeteccion,
  DeteccionRegistrada,
  DeteccionRepositorio,
  SedeDeLectura,
} from '../../application/detecciones/deteccion.repositorio';
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

  async guardar(datos: DatosDeteccion): Promise<DeteccionRegistrada> {
    const deteccion = await this.prisma.deteccion.create({ data: datos });
    return {
      id: deteccion.id,
      carrilId: deteccion.carrilId,
      placaLeida: deteccion.placaLeida,
      confianza: deteccion.confianza,
      tipoVisual: deteccion.tipoVisual,
      origen: deteccion.origen,
      estado: deteccion.estado,
      ocurridaEn: deteccion.ocurridaEn,
    };
  }
}
