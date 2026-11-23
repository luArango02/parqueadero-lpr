import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CupoPorZona,
  disponibilidadPorZona,
} from '../../domain/espacios/cupos';
import { CUPO_REPOSITORIO } from './cupo.repositorio';
import type { CupoRepositorio } from './cupo.repositorio';

@Injectable()
export class ConsultarDisponibilidadUseCase {
  constructor(
    @Inject(CUPO_REPOSITORIO) private readonly repositorio: CupoRepositorio,
  ) {}

  async ejecutar(): Promise<CupoPorZona[]> {
    const conteos = await this.repositorio.contarEspacios();
    if (!conteos) {
      throw new NotFoundException('No hay sede configurada: ejecute el seed');
    }
    return disponibilidadPorZona(conteos);
  }
}
