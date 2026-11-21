import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import {
  TARIFA_REPOSITORY,
  type TarifaRepository,
  type TarifaRegistrada,
  type ResultadoVersionTarifa,
} from '../../domain/tarifas/tarifa.repository';

import {
  TarifaInvalidaError,
  validarRelacionTarifas,
  type TipoVehiculoTarifa,
} from '../../domain/tarifas/tarifa.rules';

export interface ActualizarTarifasInput {
  sedeId: string;
  tipoVehiculo: TipoVehiculoTarifa;
  valorDiurno: number;
  valorNocturno: number;
}

@Injectable()
export class TarifasService {
  constructor(
    @Inject(TARIFA_REPOSITORY)
    private readonly repositorio: TarifaRepository,
  ) {}

  async listar(sedeId: string): Promise<TarifaRegistrada[]> {
    this.validarSedeId(sedeId);
    return this.repositorio.listar(sedeId);
  }

  async buscarPorId(id: string): Promise<TarifaRegistrada> {
    if (!id?.trim()) {
      throw new BadRequestException('El ID de la tarifa es obligatorio.');
    }

    const tarifa = await this.repositorio.buscarPorId(id);

    if (!tarifa) {
      throw new NotFoundException('La tarifa no existe.');
    }

    return tarifa;
  }

  async listarVigentes(
    sedeId: string,
    fecha: Date = new Date(),
  ): Promise<TarifaRegistrada[]> {
    this.validarSedeId(sedeId);

    if (Number.isNaN(fecha.getTime())) {
      throw new BadRequestException('La fecha es inválida.');
    }

    return this.repositorio.listarVigentes(sedeId, fecha);
  }

  async actualizarTarifas(
    datos: ActualizarTarifasInput,
  ): Promise<ResultadoVersionTarifa> {
    this.validarSedeId(datos.sedeId);

    if (datos.tipoVehiculo !== 'CARRO' && datos.tipoVehiculo !== 'MOTO') {
      throw new BadRequestException(
        'El tipo de vehículo debe ser CARRO o MOTO.',
      );
    }

    try {
      validarRelacionTarifas({
        tipoVehiculo: datos.tipoVehiculo,
        valorDiurno: datos.valorDiurno,
        valorNocturno: datos.valorNocturno,
      });
    } catch (error: unknown) {
      if (error instanceof TarifaInvalidaError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    return this.repositorio.crearVersion({
      sedeId: datos.sedeId,
      tipoVehiculo: datos.tipoVehiculo,
      valorDiurno: datos.valorDiurno.toFixed(2),
      valorNocturno: datos.valorNocturno.toFixed(2),
    });
  }

  private validarSedeId(sedeId: string): void {
    if (typeof sedeId !== 'string' || !sedeId.trim()) {
      throw new BadRequestException('El ID de la sede es obligatorio.');
    }
  }
}
