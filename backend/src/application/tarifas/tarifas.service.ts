import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
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

export interface ModificarTarifaInput {
  valor: number;
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

  async modificarTarifa(
    id: string,
    datos: ModificarTarifaInput,
  ): Promise<ResultadoVersionTarifa> {
    const tarifa = await this.buscarPorId(id);

    const vigentes = await this.listarVigentes(tarifa.sedeId);

    const tarifaActual = vigentes.find(
      (item) =>
        item.tipoVehiculo === tarifa.tipoVehiculo &&
        item.franja === tarifa.franja,
    );

    if (!tarifaActual || tarifaActual.id !== tarifa.id) {
      throw new ConflictException('Solo se pueden modificar tarifas vigentes.');
    }

    const diurna = vigentes.find(
      (item) =>
        item.tipoVehiculo === tarifa.tipoVehiculo && item.franja === 'DIURNA',
    );

    const nocturna = vigentes.find(
      (item) =>
        item.tipoVehiculo === tarifa.tipoVehiculo && item.franja === 'NOCTURNA',
    );

    if (!diurna || !nocturna) {
      throw new ConflictException(
        'No existe el par completo de tarifas vigentes.',
      );
    }

    const valorDiurno =
      tarifa.franja === 'DIURNA' ? datos.valor : Number(diurna.valor);

    const valorNocturno =
      tarifa.franja === 'NOCTURNA' ? datos.valor : Number(nocturna.valor);

    try {
      validarRelacionTarifas({
        tipoVehiculo: tarifa.tipoVehiculo,
        valorDiurno,
        valorNocturno,
      });
    } catch (error: unknown) {
      if (error instanceof TarifaInvalidaError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    return this.repositorio.crearVersion({
      sedeId: tarifa.sedeId,
      tipoVehiculo: tarifa.tipoVehiculo,
      valorDiurno: valorDiurno.toFixed(2),
      valorNocturno: valorNocturno.toFixed(2),
      tarifaEsperadaId: tarifa.id,
    });
  }

  private validarSedeId(sedeId: string): void {
    if (typeof sedeId !== 'string' || !sedeId.trim()) {
      throw new BadRequestException('El ID de la sede es obligatorio.');
    }
  }
}
