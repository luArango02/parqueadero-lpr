import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  TipoVehiculo,
  clasificarPorFormato,
  esPlacaValida,
  normalizarPlaca,
} from '../../domain/vehiculos/placa';
import { VEHICULO_REPOSITORIO } from './vehiculo.repositorio';
import type {
  VehiculoConsultado,
  VehiculoRepositorio,
} from './vehiculo.repositorio';

export interface SolicitudRegistroVehiculo {
  placa: string;
  tipo?: TipoVehiculo;
}

@Injectable()
export class RegistrarVehiculoUseCase {
  constructor(
    @Inject(VEHICULO_REPOSITORIO)
    private readonly repositorio: VehiculoRepositorio,
  ) {}

  async ejecutar(
    solicitud: SolicitudRegistroVehiculo,
  ): Promise<VehiculoConsultado> {
    const placa = normalizarPlaca(solicitud.placa);
    if (!esPlacaValida(placa)) {
      throw new BadRequestException(
        'La placa debe tener entre 5 y 7 letras o números',
      );
    }

    const tipoPorFormato = clasificarPorFormato(placa);
    const tipo = solicitud.tipo ?? tipoPorFormato;
    if (!tipo) {
      throw new BadRequestException(
        'No se pudo clasificar la placa por su formato: indique el tipo de vehículo',
      );
    }
    if (tipoPorFormato && tipoPorFormato !== tipo) {
      throw new UnprocessableEntityException(
        `La placa ${placa} tiene formato de ${tipoPorFormato}, no de ${tipo}`,
      );
    }

    // La unicidad la garantiza la base de datos: crear devuelve null si la placa ya existe.
    const vehiculo = await this.repositorio.crear(placa, tipo);
    if (!vehiculo) {
      throw new ConflictException(`La placa ${placa} ya está registrada`);
    }
    return vehiculo;
  }
}
