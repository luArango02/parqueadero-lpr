import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { normalizarPlaca } from '../../domain/vehiculos/placa';
import { VEHICULO_REPOSITORIO } from './vehiculo.repositorio';
import type {
  VehiculoConsultado,
  VehiculoRepositorio,
} from './vehiculo.repositorio';

@Injectable()
export class BuscarVehiculoUseCase {
  constructor(
    @Inject(VEHICULO_REPOSITORIO)
    private readonly repositorio: VehiculoRepositorio,
  ) {}

  async ejecutar(placaConsultada: string): Promise<VehiculoConsultado> {
    const placa = normalizarPlaca(placaConsultada);
    const vehiculo = await this.repositorio.buscarPorPlaca(placa);
    if (!vehiculo) {
      throw new NotFoundException(
        `No hay un vehículo registrado con la placa ${placa}`,
      );
    }
    return vehiculo;
  }
}
