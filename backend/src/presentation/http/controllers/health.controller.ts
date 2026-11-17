import { Controller, Get } from '@nestjs/common';

export interface HealthResponse {
  status: 'ok';
  service: string;
  timestamp: string;
  database: 'pendiente';
}

/**
 * Endpoint de salud: sirve para comprobar que el backend está vivo.
 * Docker Compose y el despliegue en la nube lo usan para saber si el servicio arrancó.
 *
 * La verificación de la base de datos se agrega en ACT-005, cuando exista Prisma.
 */
@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      service: 'parqueadero-lpr-backend',
      timestamp: new Date().toISOString(),
      database: 'pendiente',
    };
  }
}
