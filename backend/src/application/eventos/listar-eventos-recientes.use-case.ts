import { Inject, Injectable } from '@nestjs/common';
import {
  EventoReciente,
  unirRecientes,
} from '../../domain/eventos/evento-reciente';
import { EVENTO_RECIENTE_REPOSITORIO } from './evento-reciente.repositorio';
import type { EventoRecienteRepositorio } from './evento-reciente.repositorio';

export const LIMITE_EVENTOS_POR_DEFECTO = 20;

@Injectable()
export class ListarEventosRecientesUseCase {
  constructor(
    @Inject(EVENTO_RECIENTE_REPOSITORIO)
    private readonly repositorio: EventoRecienteRepositorio,
  ) {}

  async ejecutar(
    limite: number = LIMITE_EVENTOS_POR_DEFECTO,
  ): Promise<EventoReciente[]> {
    // Cada fuente aporta hasta `limite`: así los `limite` más recientes del total siempre están entre ellas.
    const [accesos, pagos, alertas] = await Promise.all([
      this.repositorio.accesos(limite),
      this.repositorio.pagos(limite),
      this.repositorio.alertas(limite),
    ]);
    return unirRecientes([accesos, pagos, alertas], limite);
  }
}
