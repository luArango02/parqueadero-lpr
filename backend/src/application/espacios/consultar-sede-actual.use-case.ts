import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ESPACIO_REPOSITORIO } from './espacio.repositorio';
import type { EspacioRepositorio, SedeActual } from './espacio.repositorio';

@Injectable()
export class ConsultarSedeActualUseCase {
  constructor(
    @Inject(ESPACIO_REPOSITORIO)
    private readonly repositorio: EspacioRepositorio,
  ) {}

  async ejecutar(): Promise<SedeActual> {
    const sede = await this.repositorio.sedeActual();
    if (!sede) {
      throw new NotFoundException('No hay sede configurada: ejecute el seed');
    }
    return sede;
  }
}
