import { Inject, Injectable } from '@nestjs/common';
import { EstadoVehiculo } from '../../domain/vehiculos/estado-vehiculo';
import { TipoVehiculo, normalizarPlaca } from '../../domain/vehiculos/placa';
import { VEHICULO_REPOSITORIO } from './vehiculo.repositorio';
import type {
  VehiculoConsultado,
  VehiculoRepositorio,
} from './vehiculo.repositorio';

export interface ConsultaVehiculos {
  placa?: string;
  tipo?: TipoVehiculo;
  estado?: EstadoVehiculo;
  limite?: number;
}

const LIMITE_POR_DEFECTO = 50;

@Injectable()
export class ListarVehiculosUseCase {
  constructor(
    @Inject(VEHICULO_REPOSITORIO)
    private readonly repositorio: VehiculoRepositorio,
  ) {}

  ejecutar(consulta: ConsultaVehiculos): Promise<VehiculoConsultado[]> {
    return this.repositorio.listar({
      placa: consulta.placa ? normalizarPlaca(consulta.placa) : undefined,
      tipo: consulta.tipo,
      estado: consulta.estado,
      limite: consulta.limite ?? LIMITE_POR_DEFECTO,
    });
  }
}
