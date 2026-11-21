import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  codigoDeEspacio,
  esZonaValida,
  normalizarZona,
} from '../../domain/espacios/espacio';
import { TipoVehiculo } from '../../domain/vehiculos/placa';
import { ESPACIO_REPOSITORIO } from './espacio.repositorio';
import type {
  EspacioRegistrado,
  EspacioRepositorio,
} from './espacio.repositorio';

export interface SolicitudEspacio {
  zona: string;
  numero: number;
  tipoCompatible: TipoVehiculo;
}

@Injectable()
export class CrearEspacioUseCase {
  constructor(
    @Inject(ESPACIO_REPOSITORIO)
    private readonly repositorio: EspacioRepositorio,
  ) {}

  async ejecutar(solicitud: SolicitudEspacio): Promise<EspacioRegistrado> {
    const zona = normalizarZona(solicitud.zona);
    if (!esZonaValida(zona)) {
      throw new BadRequestException(
        'La zona debe ser una letra de la A a la Z',
      );
    }

    const sedeId = await this.repositorio.idSedeActual();
    if (!sedeId) {
      throw new NotFoundException('No hay sede configurada: ejecute el seed');
    }

    const codigo = codigoDeEspacio(zona, solicitud.numero);
    // La unicidad la garantiza la base de datos: crear devuelve null si el código ya existe.
    const espacio = await this.repositorio.crear(sedeId, {
      codigo,
      zona,
      tipoCompatible: solicitud.tipoCompatible,
    });
    if (!espacio) {
      throw new ConflictException(`El código ${codigo} ya existe en la sede`);
    }
    return espacio;
  }
}
