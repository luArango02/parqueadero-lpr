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
  @ApiOkResponse({ description: 'Hasta `limite` eventos (20 por defecto)' })
  @ApiBadRequestResponse({ description: 'Límite inválido (1 a 50)' })
  recientes(
    @Query() query: ListarEventosRecientesQueryDto,
  ): Promise<EventoReciente[]> {
    return this.listarRecientes.ejecutar(query.limite);
  }
}
