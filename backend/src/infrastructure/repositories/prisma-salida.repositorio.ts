import { Injectable } from '@nestjs/common';
import {
  CobroDelDia,
  SedeOperativa,
} from '../../application/accesos/ingreso.repositorio';
import {
  DatosSalida,
  DatosSalidaDenegada,
  DatosVerificacionCobros,
  PermanenciaActiva,
  SalidaRepositorio,
} from '../../application/accesos/salida.repositorio';
import { PrismaService } from '../database/prisma.service';
import {
  aCobroDelDia,
  aFecha,
  buscarCarril,
  buscarSedeOperativa,
} from './consultas-comunes';
import { Prisma } from '@prisma/client';
import { diasOperativosTranscurridos } from '../../domain/tiempo/dias-operativos-transcurridos';
import { instanteDesdeHoraLocal } from '../../domain/tiempo/reglas-horario';

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

  async garantizarCobrosPorCambioDeDia(
    datos: DatosVerificacionCobros,
  ): Promise<void> {
    // Las motocicletas están exentas de cobro.
    if (datos.tipo === 'MOTO') {
      return;
    }

    const horario = {
      zonaHoraria: datos.zonaHoraria,
      inicioDiaOperativo: datos.inicioDiaOperativo,
      inicioFranjaDiurna: datos.inicioFranjaDiurna,
      inicioFranjaNocturna: datos.inicioFranjaNocturna,
    };

    const dias = diasOperativosTranscurridos(
      datos.ingresoEn,
      datos.verificadoEn,
      horario,
    );

    for (const diaOperativo of dias) {
      const fechaDia = aFecha(diaOperativo);

      // Si el cobro ya existe, se conserva sin modificarlo.
      const existente = await this.prisma.cobro.findUnique({
        where: {
          placa_sedeId_diaOperativo: {
            placa: datos.placa,
            sedeId: datos.sedeId,
            diaOperativo: fechaDia,
          },
        },
      });

      if (existente) {
        continue;
      }

      // El instante del cambio de día en Colombia (06:00).
      // ACT-020 se implementa para la sede America/Bogota.
      const inicioNuevoDia = instanteDesdeHoraLocal(
        diaOperativo,
        datos.inicioDiaOperativo,
        datos.zonaHoraria,
      );

      const tarifa = await this.prisma.tarifa.findFirst({
        where: {
          sedeId: datos.sedeId,
          tipoVehiculo: datos.tipo,
          franja: 'DIURNA',
          vigenteDesde: { lte: inicioNuevoDia },
          OR: [
            { vigenteHasta: null },
            { vigenteHasta: { gt: inicioNuevoDia } },
          ],
        },
        orderBy: { version: 'desc' },
      });

      if (!tarifa) {
        throw new Error(
          `No existe tarifa diurna vigente para ${datos.tipo} ` +
            `en el día operativo ${diaOperativo}`,
        );
      }

      if (tarifa.valor.lte(0)) {
        continue;
      }

      try {
        await this.prisma.$transaction(async (tx) => {
          const cobro = await tx.cobro.create({
            data: {
              sedeId: datos.sedeId,
              vehiculoId: datos.vehiculoId,
              placa: datos.placa,
              diaOperativo: fechaDia,
              franja: 'DIURNA',
              tarifaId: tarifa.id,
              valor: tarifa.valor,
              generadoEn: datos.verificadoEn,
            },
          });

          await tx.auditoria.create({
            data: {
              accion: 'COBRO_CAMBIO_DIA_OPERATIVO',
              entidad: 'Cobro',
              entidadId: cobro.id,
              datosNuevos: {
                placa: datos.placa,
                sedeId: datos.sedeId,
                diaOperativo,
                franja: 'DIURNA',
                tarifaId: tarifa.id,
                valor: tarifa.valor.toString(),
              },
              ocurridaEn: datos.verificadoEn,
            },
          });
        });
      } catch (error) {
        // Dos solicitudes concurrentes pueden intentar generar
        // el mismo cobro. La restricción única impide duplicarlo.
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          const creadoPorOtraSolicitud = await this.prisma.cobro.findUnique({
            where: {
              placa_sedeId_diaOperativo: {
                placa: datos.placa,
                sedeId: datos.sedeId,
                diaOperativo: fechaDia,
              },
            },
          });

          if (creadoPorOtraSolicitud) {
            continue;
          }
        }

        throw error;
      }
    }
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
