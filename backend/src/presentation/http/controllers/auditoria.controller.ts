import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ListarAuditoriaUseCase } from '../../../application/auditoria/listar-auditoria.use-case';
import type { ResultadoAuditoria } from '../../../application/auditoria/auditoria.repositorio';
import { Autenticado } from '../auth/autenticado.decorator';
import { ListarAuditoriaQueryDto } from '../dto/listar-auditoria.query.dto';

@ApiTags('Auditoria')
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly listarAuditoria: ListarAuditoriaUseCase) {}

  @Get()
  @Autenticado('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Consultar registros de auditoria',
    description:
      'Consulta paginada de operaciones auditadas, con filtros por usuario, accion, entidad y fecha. Solo administradores.',
  })
  @ApiOkResponse({
    description: 'Registros de auditoria obtenidos correctamente.',
  })
  @ApiBadRequestResponse({
    description: 'Filtros o paginacion invalidos.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o invalido.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene permisos de administrador.',
  })
  listar(@Query() query: ListarAuditoriaQueryDto): Promise<ResultadoAuditoria> {
    return this.listarAuditoria.ejecutar(query);
  }
}
