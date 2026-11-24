import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoEspacio, normalizarZona } from '../../domain/espacios/espacio';
import { TipoVehiculo } from '../../domain/vehiculos/placa';
import { ESPACIO_REPOSITORIO } from './espacio.repositorio';
import type {
  EspacioConPlaca,
  EspacioRepositorio,
} from './espacio.repositorio';

export interface ConsultaEspacios {
  zona?: string;
  tipo?: TipoVehiculo;
  estado?: EstadoEspacio;
}

@Injectable()
export class ListarEspaciosUseCase {
  constructor(
    @Inject(ESPACIO_REPOSITORIO)
    private readonly repositorio: EspacioRepositorio,
  ) {}

  async ejecutar(consulta: ConsultaEspacios): Promise<EspacioConPlaca[]> {
    const sedeId = await this.repositorio.idSedeActual();
    if (!sedeId) {
      throw new NotFoundException('No hay sede configurada: ejecute el seed');
    }
    return this.repositorio.listar(sedeId, {
      zona: consulta.zona ? normalizarZona(consulta.zona) : undefined,
      tipo: consulta.tipo,
      estado: consulta.estado,
    });
  }
}
