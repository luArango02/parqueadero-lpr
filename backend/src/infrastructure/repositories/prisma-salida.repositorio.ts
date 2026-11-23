import { Injectable } from '@nestjs/common';
import {
  CobroDelDia,
  SedeOperativa,
} from '../../application/accesos/ingreso.repositorio';
import {
  DatosSalida,
  DatosSalidaDenegada,
  PermanenciaActiva,
  SalidaRepositorio,
} from '../../application/accesos/salida.repositorio';
import { PrismaService } from '../database/prisma.service';
import {
  aCobroDelDia,
  buscarCarril,
  buscarSedeOperativa,
} from './consultas-comunes';

@Injectable()
export class PrismaSalidaRepositorio implements SalidaRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  sedeOperativa(): Promise<SedeOperativa> {
    return buscarSedeOperativa(this.prisma);
  }

  carrilDeSalida(sedeId: string, carrilId?: string): Promise<string> {
    return buscarCarril(this.prisma, sedeId, 'SALIDA', carrilId);
  }

  async permanenciaActiva(placa: string): Promise<PermanenciaActiva | null> {
    const permanencia = await this.prisma.permanencia.findFirst({
      where: { vehiculo: { placa }, vehiculoActivoId: { not: null } },
      include: { vehiculo: true, espacio: true },
    });
    if (!permanencia) return null;
    return {
      id: permanencia.id,
      vehiculoId: permanencia.vehiculoId,
      tipo: permanencia.vehiculo.tipo,
      espacioId: permanencia.espacioId,
      espacioCodigo: permanencia.espacio.codigo,
      ingresoEn: permanencia.ingresoEn,
    };
  }

  async cobrosPendientes(
    placa: string,
    sedeId: string,
  ): Promise<CobroDelDia[]> {
    const cobros = await this.prisma.cobro.findMany({
      where: { placa, sedeId, estado: 'PENDIENTE' },
      orderBy: { diaOperativo: 'asc' },
    });
    return cobros.map(aCobroDelDia);
  }

  registrarSalida(datos: DatosSalida): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const evento = await tx.eventoAcceso.create({
        data: {
          sedeId: datos.sedeId,
          carrilId: datos.carrilId,
          placa: datos.placa,
          vehiculoId: datos.permanencia.vehiculoId,
          tipo: 'SALIDA',
          espacioId: datos.permanencia.espacioId,
          ocurridoEn: datos.ocurridoEn,
        },
      });

      // Se filtra por vehiculoActivoId para que dos lecturas seguidas no cierren la misma permanencia.
      const cerrada = await tx.permanencia.updateMany({
        where: { id: datos.permanencia.id, vehiculoActivoId: { not: null } },
        data: {
          salidaEn: datos.ocurridoEn,
          eventoSalidaId: evento.id,
          vehiculoActivoId: null,
          espacioActivoId: null,
        },
      });
      if (cerrada.count === 0) {
        await tx.eventoAcceso.delete({ where: { id: evento.id } });
        return false;
      }

      await tx.espacio.update({
        where: { id: datos.permanencia.espacioId },
        data: { estado: 'DISPONIBLE' },
      });
      return true;
    });
  }

  async registrarSalidaDenegada(datos: DatosSalidaDenegada): Promise<void> {
    await this.prisma.eventoAcceso.create({
      data: {
        sedeId: datos.sedeId,
        carrilId: datos.carrilId,
        placa: datos.placa,
        tipo: 'SALIDA_DENEGADA',
        motivo: datos.motivo,
        ocurridoEn: datos.ocurridoEn,
      },
    });
  }
}
