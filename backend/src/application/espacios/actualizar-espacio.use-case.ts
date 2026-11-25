import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoAsignable } from '../../domain/espacios/espacio';
import { TipoVehiculo } from '../../domain/vehiculos/placa';
import { ESPACIO_REPOSITORIO } from './espacio.repositorio';
import type {
  EspacioRegistrado,
  EspacioRepositorio,
} from './espacio.repositorio';

export interface SolicitudCambioEspacio {
  id: string;
  estado?: EstadoAsignable;
  tipoCompatible?: TipoVehiculo;
}

@Injectable()
export class ActualizarEspacioUseCase {
  constructor(
    @Inject(ESPACIO_REPOSITORIO)
    private readonly repositorio: EspacioRepositorio,
  ) {}

  async ejecutar(
    solicitud: SolicitudCambioEspacio,
    usuarioId?: string,
  ): Promise<EspacioRegistrado> {
    if (
      solicitud.estado === undefined &&
      solicitud.tipoCompatible === undefined
    ) {
      throw new BadRequestException(
        'Indique el estado o el tipo compatible que desea cambiar',
      );
    }

    const actual = await this.repositorio.buscar(solicitud.id);
    if (!actual) {
      throw new NotFoundException('Espacio no encontrado');
    }
    if (actual.estado === 'OCUPADO') {
      throw new ConflictException(
        `El espacio ${actual.codigo} está ocupado: no se puede modificar mientras haya un vehículo dentro`,
      );
    }

    const cambios = {
      estado: solicitud.estado,
      tipoCompatible: solicitud.tipoCompatible,
    };

    const actualizado = usuarioId
      ? await this.repositorio.actualizar(solicitud.id, cambios, usuarioId)
      : await this.repositorio.actualizar(solicitud.id, cambios);
    // Un ingreso pudo ocupar el espacio entre la consulta y la escritura.
    if (!actualizado) {
      throw new ConflictException(
        `El espacio ${actual.codigo} fue ocupado mientras se modificaba`,
      );
    }
    return actualizado;
  }
}
