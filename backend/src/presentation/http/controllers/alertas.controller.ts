import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { SesionUsuario } from '../../../application/auth/emisor-token';
import { AlertaRegistrada } from '../../../application/alertas/alerta.repositorio';
import { ListarAlertasUseCase } from '../../../application/alertas/listar-alertas.use-case';
import { ResolverAlertaUseCase } from '../../../application/alertas/resolver-alerta.use-case';
import { Autenticado } from '../auth/autenticado.decorator';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import { CambiarEstadoAlertaDto } from '../dto/cambiar-estado-alerta.dto';
import { ListarAlertasQueryDto } from '../dto/listar-alertas.query.dto';

@ApiTags('Alertas')
@Controller('alertas')
export class AlertasController {
  constructor(
    private readonly listarAlertas: ListarAlertasUseCase,
    private readonly resolverAlerta: ResolverAlertaUseCase,
  ) {}

  @Get()
  @Autenticado('OPERADOR', 'ADMINISTRADOR')
  @ApiOperation({
    summary: 'Listar alertas operativas',
    description:
      'Más recientes primero, con filtros por estado, tipo y placa. Cada alerta trae su evidencia (la detección que la originó) y, si ya se resolvió, quién la resolvió, cuándo y el motivo.',
  })
  @ApiOkResponse({ description: 'Alertas con su evidencia' })
  @ApiBadRequestResponse({ description: 'Filtro inválido' })
  listar(@Query() query: ListarAlertasQueryDto): Promise<AlertaRegistrada[]> {
    return this.listarAlertas.ejecutar(query);
  }

  @Patch(':id/estado')
  @Autenticado('OPERADOR')
  @ApiOperation({
    summary: 'Resolver una alerta (solo operador)',
    description:
      'El operador revisa la alerta y la pasa a RESUELTA, con el motivo. En una discrepancia de tipo debe confirmar el tipo real del vehículo (CARRO o MOTO), que queda como tipo registrado; mientras la alerta siga abierta, el ingreso de esa placa se bloquea.',
  })
  @ApiOkResponse({ description: 'Alerta resuelta' })
  @ApiBadRequestResponse({
    description: 'Id, motivo o tipo confirmado inválidos',
  })
  @ApiNotFoundResponse({ description: 'Alerta no encontrada' })
  @ApiConflictResponse({ description: 'La alerta ya estaba resuelta' })
  cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CambiarEstadoAlertaDto,
    @UsuarioActual() sesion: SesionUsuario,
  ): Promise<AlertaRegistrada> {
    return this.resolverAlerta.ejecutar({
      alertaId: id,
      usuarioId: sesion.sub,
      resolucion: dto.resolucion,
      tipoConfirmado: dto.tipoConfirmado,
    });
  }
}
