import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

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
  @ApiOperation({ summary: 'Estado del backend y de la base de datos' })
  @ApiOkResponse({ description: 'Backend y base de datos disponibles' })
  @ApiServiceUnavailableResponse({
    description: 'La base de datos no responde',
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
