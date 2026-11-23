import { TipoAlerta } from '../../domain/alertas/alerta';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CobroDelDia,
  DatosDenegado,
  DatosIngreso,
  IngresoRegistrado,
  IngresoRepositorio,
  SedeOperativa,
  TarifaVigente,
} from '../../application/accesos/ingreso.repositorio';
import { Franja } from '../../domain/tiempo/reglas-horario';
import { TipoVehiculo } from '../../domain/vehiculos/placa';
import { PrismaService } from '../database/prisma.service';
import {
  aCobroDelDia,
  aFecha,
  buscarCarril,
  buscarSedeOperativa,
} from './consultas-comunes';

@Injectable()
export class PrismaIngresoRepositorio implements IngresoRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  sedeOperativa(): Promise<SedeOperativa> {
    return buscarSedeOperativa(this.prisma);
  }

  carrilDeEntrada(sedeId: string, carrilId?: string): Promise<string> {
    return buscarCarril(this.prisma, sedeId, 'ENTRADA', carrilId);
  }

  async tipoRegistrado(placa: string): Promise<TipoVehiculo | null> {
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { placa },
    });
    return vehiculo?.tipo ?? null;
  }

  async estaAdentro(placa: string): Promise<boolean> {
    const activa = await this.prisma.permanencia.findFirst({
      where: { vehiculo: { placa }, vehiculoActivoId: { not: null } },
    });
    return activa !== null;
  }

  async alertaAbierta(placa: string, tipo: TipoAlerta): Promise<boolean> {
    const alerta = await this.prisma.alerta.findFirst({
      where: { placa, tipo, estado: 'ABIERTA' },
      select: { id: true },
    });
    return alerta !== null;
  }

  async cobroDelDia(
    placa: string,
    sedeId: string,
    diaOperativo: string,
  ): Promise<CobroDelDia | null> {
    const cobro = await this.prisma.cobro.findUnique({
      where: {
        placa_sedeId_diaOperativo: {
          placa,
          sedeId,
          diaOperativo: aFecha(diaOperativo),
        },
      },
    });
    return cobro ? aCobroDelDia(cobro) : null;
  }

  async tarifaVigente(
    sedeId: string,
    tipo: TipoVehiculo,
    franja: Franja,
    instante: Date,
  ): Promise<TarifaVigente> {
    const tarifa = await this.prisma.tarifa.findFirst({
      where: {
        sedeId,
        tipoVehiculo: tipo,
        franja,
        vigenteDesde: { lte: instante },
        OR: [{ vigenteHasta: null }, { vigenteHasta: { gt: instante } }],
      },
      orderBy: { version: 'desc' },
    });
    if (!tarifa) {
      throw new NotFoundException(
        `No hay tarifa vigente para ${tipo} ${franja}`,
      );
    }
    return { id: tarifa.id, valor: tarifa.valor.toNumber() };
  }

  async registrarIngreso(
    datos: DatosIngreso,
  ): Promise<IngresoRegistrado | null> {
    try {
      return await this.intentarIngreso(datos);
    } catch (error) {
      // Otro vehículo tomó el mismo espacio al mismo tiempo: se reintenta una vez con el siguiente.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return this.intentarIngreso(datos);
      }
      throw error;
    }
  }

  private intentarIngreso(
    datos: DatosIngreso,
  ): Promise<IngresoRegistrado | null> {
    return this.prisma.$transaction(async (tx) => {
      const espacio = await tx.espacio.findFirst({
        where: {
          sedeId: datos.sedeId,
          tipoCompatible: datos.tipo,
          estado: 'DISPONIBLE',
        },
        orderBy: [{ zona: 'asc' }, { codigo: 'asc' }],
      });
      if (!espacio) {
        return null;
      }

      const vehiculo = await tx.vehiculo.upsert({
        where: { placa: datos.placa },
        update: {},
        create: { placa: datos.placa, tipo: datos.tipo },
      });

      const evento = await tx.eventoAcceso.create({
        data: {
          sedeId: datos.sedeId,
          carrilId: datos.carrilId,
          placa: datos.placa,
          vehiculoId: vehiculo.id,
          tipo: 'INGRESO',
          espacioId: espacio.id,
          ocurridoEn: datos.ocurridoEn,
        },
      });

      await tx.permanencia.create({
        data: {
          vehiculoId: vehiculo.id,
          espacioId: espacio.id,
          eventoIngresoId: evento.id,
          ingresoEn: datos.ocurridoEn,
          vehiculoActivoId: vehiculo.id,
          espacioActivoId: espacio.id,
        },
      });

      await tx.espacio.update({
        where: { id: espacio.id },
        data: { estado: 'OCUPADO' },
      });

      const cobro = datos.cobroNuevo
        ? await tx.cobro.create({
            data: {
              sedeId: datos.sedeId,
              vehiculoId: vehiculo.id,
              placa: datos.placa,
              diaOperativo: aFecha(datos.cobroNuevo.diaOperativo),
              franja: datos.cobroNuevo.franja,
              tarifaId: datos.cobroNuevo.tarifaId,
              valor: datos.cobroNuevo.valor,
              generadoEn: datos.ocurridoEn,
            },
          })
        : null;

      return {
        espacioCodigo: espacio.codigo,
        cobro: cobro ? aCobroDelDia(cobro) : null,
      };
    });
  }

  async registrarDenegado(datos: DatosDenegado): Promise<void> {
    await this.prisma.eventoAcceso.create({
      data: {
        sedeId: datos.sedeId,
        carrilId: datos.carrilId,
        placa: datos.placa,
        tipo: 'INGRESO_DENEGADO',
        motivo: datos.motivo,
        ocurridoEn: datos.ocurridoEn,
      },
    });
    if (datos.alertaAntiPassback) {
      await this.prisma.alerta.create({
        data: {
          sedeId: datos.sedeId,
          tipo: 'ANTI_PASSBACK',
          placa: datos.placa,
          detalle: 'Intento de ingreso de una placa que ya figura adentro',
        },
      });
    }
  }
}
