import { Autenticado } from '../auth/autenticado.decorator';
import { ListarHistorialEventosUseCase } from '../../../application/eventos/listar-historial-eventos.use-case';
import type { ResultadoHistorial } from '../../../application/eventos/historial-eventos.repositorio';
import { HistorialEventosQueryDto } from '../dto/historial-eventos.query.dto';
import { ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
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
    private readonly listarHistorial: ListarHistorialEventosUseCase,
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

  @Get('historial')
  @Autenticado('ADMINISTRADOR', 'OPERADOR')
  @ApiOperation({
    summary: 'Consultar historial de eventos',
    description:
      'Consulta paginada de accesos, pagos y alertas. Permite filtrar por placa, tipo, estado e intervalo de fechas. En pagos, estado corresponde al cobro relacionado.',
  })
  @ApiOkResponse({
    description: 'Historial paginado y ordenado por fecha descendente.',
  })
  @ApiBadRequestResponse({
    description: 'Filtros, fechas o paginacion invalidos.',
  })
  @ApiUnauthorizedResponse({
    description: 'Autenticacion requerida.',
  })
  @ApiForbiddenResponse({
    description: 'Rol sin permisos para consultar el historial.',
  })
  historial(
    @Query() query: HistorialEventosQueryDto,
  ): Promise<ResultadoHistorial> {
    return this.listarHistorial.ejecutar(query);
  }
}
