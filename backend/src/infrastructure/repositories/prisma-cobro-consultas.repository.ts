import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type {
  CobroConsultasRepository,
  SedeParaCobro,
  VehiculoParaCobro,
  TarifaParaCobro,
} from '../../application/cobros/cobro-consultas.repository';
import type { Franja } from '../../domain/tiempo/reglas-horario';
import type { TipoVehiculoCobro } from '../../domain/cobros/cobro-strategy.interface';

@Injectable()
export class PrismaCobroConsultasRepository implements CobroConsultasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarSede(sedeId: string): Promise<SedeParaCobro | null> {
    const sede = await this.prisma.sede.findUnique({
      where: { id: sedeId },
    });

    if (!sede) return null;

    return {
      id: sede.id,
      horario: {
        zonaHoraria: sede.zonaHoraria,
        inicioDiaOperativo: sede.inicioDiaOperativo,
        inicioFranjaDiurna: sede.inicioFranjaDiurna,
        inicioFranjaNocturna: sede.inicioFranjaNocturna,
      },
    };
  }

  async buscarVehiculo(vehiculoId: string): Promise<VehiculoParaCobro | null> {
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { id: vehiculoId },
    });

    if (!vehiculo) return null;

    return {
      id: vehiculo.id,
      placa: vehiculo.placa,
      tipo: vehiculo.tipo,
    };
  }

  async buscarTarifaVigente(
    sedeId: string,
    tipoVehiculo: TipoVehiculoCobro,
    franja: Franja,
    fecha: Date,
  ): Promise<TarifaParaCobro | null> {
    const tarifa = await this.prisma.tarifa.findFirst({
      where: {
        sedeId,
        tipoVehiculo,
        franja,
        vigenteDesde: { lte: fecha },
        OR: [{ vigenteHasta: null }, { vigenteHasta: { gt: fecha } }],
      },
      orderBy: [{ vigenteDesde: 'desc' }, { version: 'desc' }],
    });

    if (!tarifa) return null;

    return {
      id: tarifa.id,
      tipoVehiculo: tarifa.tipoVehiculo,
      franja: tarifa.franja,
      valor: tarifa.valor.toFixed(2),
      version: tarifa.version,
    };
  }
}
