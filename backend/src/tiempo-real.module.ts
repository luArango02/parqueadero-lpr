import { Global, Module } from '@nestjs/common';
import { NOTIFICADOR_ACCESOS } from './application/accesos/notificador-accesos';
import { ConsultaOcupacion } from './infrastructure/tiempo-real/consulta-ocupacion';
import { SocketIoNotificadorAccesos } from './infrastructure/tiempo-real/socket-io-notificador-accesos';
import { EventosGateway } from './infrastructure/tiempo-real/eventos.gateway';
import { NotificarOcupacionInterceptor } from './infrastructure/tiempo-real/notificar-ocupacion.interceptor';

// Global para que otros módulos (por ejemplo espacios) puedan emitir con el mismo gateway.
@Global()
@Module({
  providers: [
    EventosGateway,
    ConsultaOcupacion,
    NotificarOcupacionInterceptor,
    { provide: NOTIFICADOR_ACCESOS, useClass: SocketIoNotificadorAccesos },
  ],
  exports: [
    EventosGateway,
    ConsultaOcupacion,
    NotificarOcupacionInterceptor,
    NOTIFICADOR_ACCESOS,
  ],
})
export class TiempoRealModule {}
