import { Injectable } from '@nestjs/common';
import { TIPOS_VEHICULO, TipoVehiculo } from '../../domain/vehiculos/placa';
import { PrismaService } from '../database/prisma.service';

export interface ConteoEspacios {
  total: number;
  disponibles: number;
  ocupados: number;
  fueraDeServicio: number;
}

export interface ResumenOcupacion extends ConteoEspacios {
  porTipo: Record<TipoVehiculo, ConteoEspacios>;
  actualizadoEn: string;
}

@Injectable()
export class ConsultaOcupacion {
  constructor(private readonly prisma: PrismaService) {}

  async resumen(): Promise<ResumenOcupacion> {
    const grupos = await this.prisma.espacio.groupBy({
      by: ['tipoCompatible', 'estado'],
      _count: { _all: true },
    });

    const contar = (tipo?: TipoVehiculo): ConteoEspacios => {
      const delTipo = grupos.filter((g) => !tipo || g.tipoCompatible === tipo);
      const cuantos = (estado: string) =>
        delTipo
          .filter((g) => g.estado === estado)
          .reduce((suma, g) => suma + g._count._all, 0);
      const disponibles = cuantos('DISPONIBLE');
      const ocupados = cuantos('OCUPADO');
      const fueraDeServicio = cuantos('FUERA_DE_SERVICIO');
      return {
        total: disponibles + ocupados + fueraDeServicio,
        disponibles,
        ocupados,
        fueraDeServicio,
      };
    };

    return {
      ...contar(),
      porTipo: Object.fromEntries(
        TIPOS_VEHICULO.map((tipo) => [tipo, contar(tipo)]),
      ) as Record<TipoVehiculo, ConteoEspacios>,
      actualizadoEn: new Date().toISOString(),
    };
  }
}
