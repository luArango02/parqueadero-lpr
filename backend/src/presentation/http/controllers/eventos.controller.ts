import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ListarEventosRecientesUseCase } from '../../../application/eventos/listar-eventos-recientes.use-case';
import { EventoReciente } from '../../../domain/eventos/evento-reciente';
import { ListarEventosRecientesQueryDto } from '../dto/listar-eventos-recientes.query.dto';
import { ErrorHttpDto } from '../docs/respuestas/error-http.dto';
import { EventoRecienteRespuestaDto } from '../docs/respuestas/evento-respuesta.dto';

@ApiTags('Eventos')
@Controller('eventos')
export class EventosController {
  constructor(
    private readonly listarRecientes: ListarEventosRecientesUseCase,
  ) {}

  @Get('recientes')
  @ApiOperation({
    summary: 'Historial reciente del parqueadero',
    description:
      'Mezcla ingresos, salidas, intentos denegados, pagos y alertas, el más reciente primero. `tipo` es INGRESO, SALIDA, INGRESO_DENEGADO, SALIDA_DENEGADA, PAGO o ALERTA.',
  })
  @ApiOkResponse({
    description:
      'Eventos recientes de accesos, pagos y alertas, ordenados del más reciente al más antiguo',
    type: EventoRecienteRespuestaDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: 'Límite inválido. Debe estar entre 1 y 50',
    type: ErrorHttpDto,
  })
  recientes(
    @Query() query: ListarEventosRecientesQueryDto,
  ): Promise<EventoReciente[]> {
    return this.listarRecientes.ejecutar(query.limite);
  }
}
