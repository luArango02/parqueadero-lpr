import {
  CallHandler,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from, mergeMap } from 'rxjs';
import { ConsultaOcupacion } from './consulta-ocupacion';
import { EVENTOS, EventosGateway } from './eventos.gateway';

// Después de crear o cambiar un espacio, el mapa y el panel reciben la ocupación nueva.
@Injectable()
export class NotificarOcupacionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(NotificarOcupacionInterceptor.name);

  constructor(
    private readonly gateway: EventosGateway,
    private readonly ocupacion: ConsultaOcupacion,
  ) {}

  intercept(_contexto: unknown, siguiente: CallHandler): Observable<unknown> {
    return siguiente
      .handle()
      .pipe(mergeMap((respuesta: unknown) => from(this.notificar(respuesta))));
  }

  private async notificar(respuesta: unknown): Promise<unknown> {
    try {
      this.gateway.emitir(EVENTOS.ocupacion, await this.ocupacion.resumen());
    } catch (error) {
      this.logger.warn(`No se pudo emitir la ocupación: ${String(error)}`);
    }
    return respuesta;
  }
}
