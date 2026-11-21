import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  COBRO_CONSULTAS_REPOSITORY,
  type CobroConsultasRepository,
} from './cobro-consultas.repository';
import {
  calcularDiaOperativo,
  calcularFranja,
} from '../../domain/tiempo/reglas-horario';
import type { ResultadoCalculoCobro } from '../../domain/cobros/cobro-strategy.interface';
import { CobroCarroStrategy } from '../../domain/cobros/estrategias/cobro-carro.strategy';
import { CobroMotoStrategy } from '../../domain/cobros/estrategias/cobro-moto.strategy';

export interface SolicitudCalculoCobro {
  sedeId: string;
  vehiculoId: string;
  fechaIngreso: Date;
}

@Injectable()
export class CalcularCobroService {
  private readonly carroStrategy = new CobroCarroStrategy();
  private readonly motoStrategy = new CobroMotoStrategy();

  constructor(
    @Inject(COBRO_CONSULTAS_REPOSITORY)
    private readonly consultas: CobroConsultasRepository,
  ) {}

  async ejecutar(
    solicitud: SolicitudCalculoCobro,
  ): Promise<ResultadoCalculoCobro> {
    const sede = await this.consultas.buscarSede(solicitud.sedeId);

    if (!sede) {
      throw new NotFoundException('La sede no existe.');
    }

    const vehiculo = await this.consultas.buscarVehiculo(solicitud.vehiculoId);

    if (!vehiculo) {
      throw new NotFoundException('El vehículo no existe.');
    }

    const franja = calcularFranja(solicitud.fechaIngreso, sede.horario);

    const diaOperativo = calcularDiaOperativo(
      solicitud.fechaIngreso,
      sede.horario,
    );

    if (vehiculo.tipo === 'MOTO') {
      return this.motoStrategy.calcular({
        tipoVehiculo: 'MOTO',
        franja,
        diaOperativo,
        tarifaId: null,
        tarifaVersion: null,
        valorTarifa: '0.00',
      });
    }

    const tarifa = await this.consultas.buscarTarifaVigente(
      sede.id,
      vehiculo.tipo,
      franja,
      solicitud.fechaIngreso,
    );

    if (!tarifa) {
      throw new NotFoundException(
        'No existe una tarifa vigente para el vehículo y la franja.',
      );
    }

    return this.carroStrategy.calcular({
      tipoVehiculo: vehiculo.tipo,
      franja,
      diaOperativo,
      tarifaId: tarifa.id,
      tarifaVersion: tarifa.version,
      valorTarifa: tarifa.valor,
    });
  }
}
