import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { ErrorHttpDto } from '../docs/respuestas/error-http.dto';
import { HealthRespuestaDto } from '../docs/respuestas/health-respuesta.dto';

export interface HealthResponse {
  status: 'ok';
  service: string;
  timestamp: string;
  database: 'ok';
}

// Responde 503 si la base de datos no responde, para que el healthcheck de Docker marque el servicio como no sano.
@ApiTags('Salud')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: 'Estado del backend y de la base de datos',
    description:
      'Comprueba la disponibilidad de la base de datos. Este endpoint no requiere autenticación y se encuentra fuera del prefijo /api.',
  })
  @ApiOkResponse({
    description: 'Backend y base de datos disponibles',
    type: HealthRespuestaDto,
  })
  @ApiServiceUnavailableResponse({
    description: 'La base de datos no responde',
    type: ErrorHttpDto,
  })
  async check(): Promise<HealthResponse> {
    const baseDisponible = await this.prisma.estaDisponible();

    if (!baseDisponible) {
      throw new ServiceUnavailableException('La base de datos no responde');
    }

    return {
      status: 'ok',
      service: 'parqueadero-lpr-backend',
      timestamp: new Date().toISOString(),
      database: 'ok',
    };
  }
}
