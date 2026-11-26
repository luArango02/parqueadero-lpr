import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ListarAuditoriaUseCase } from '../../../application/auditoria/listar-auditoria.use-case';
import type { ResultadoAuditoria } from '../../../application/auditoria/auditoria.repositorio';
import { Autenticado } from '../auth/autenticado.decorator';
import { ListarAuditoriaQueryDto } from '../dto/listar-auditoria.query.dto';
import { ErrorHttpDto } from '../docs/respuestas/error-http.dto';
import { AuditoriaRespuestaDto } from '../docs/respuestas/auditoria-respuesta.dto';

@ApiTags('Auditoria')
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly listarAuditoria: ListarAuditoriaUseCase) {}

  @Get()
  @Autenticado('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Consultar registros de auditoría',
    description:
      'Consulta paginada de operaciones auditadas. Permite filtrar por usuario, acción, entidad, identificador de entidad e intervalo inclusivo de fechas. Solo disponible para administradores.',
  })
  @ApiOkResponse({
    description: 'Registros de auditoría obtenidos correctamente',
    type: AuditoriaRespuestaDto,
  })
  @ApiBadRequestResponse({
    description: 'Filtros, fechas o paginación inválidos',
    type: ErrorHttpDto,
  })
  listar(@Query() query: ListarAuditoriaQueryDto): Promise<ResultadoAuditoria> {
    return this.listarAuditoria.ejecutar(query);
  }
}
