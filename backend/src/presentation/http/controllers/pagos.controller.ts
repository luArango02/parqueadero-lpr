import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { SesionUsuario } from '../../../application/auth/emisor-token';
import { RegistrarPagoEfectivoUseCase } from '../../../application/pagos/registrar-pago-efectivo.use-case';
import { Autenticado } from '../auth/autenticado.decorator';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import { RegistrarPagoEfectivoDto } from '../dto/pagos/registrar-pago-efectivo.dto';
import { ErrorHttpDto } from '../docs/respuestas/error-http.dto';
import { PagoEfectivoRespuestaDto } from '../docs/respuestas/pago-respuesta.dto';

@ApiTags('Pagos')
@Controller('pagos')
export class PagosController {
  constructor(
    private readonly registrarPagoEfectivo: RegistrarPagoEfectivoUseCase,
  ) {}

  @Post('efectivo')
  @HttpCode(HttpStatus.OK)
  @Autenticado('ADMINISTRADOR', 'OPERADOR')
  @ApiOperation({
    summary: 'Registrar un pago en efectivo',
    description:
      'Registra un pago en efectivo, actualiza el estado del cobro y genera auditoría. Una solicitud idempotente recupera el pago previamente registrado.',
  })
  @ApiOkResponse({
    description: 'Pago registrado o recuperado correctamente',
    type: PagoEfectivoRespuestaDto,
  })
  @ApiBadRequestResponse({
    description: 'Identificador del cobro o referencia inválidos',
    type: ErrorHttpDto,
  })
  @ApiNotFoundResponse({
    description: 'El cobro indicado no existe',
    type: ErrorHttpDto,
  })
  @ApiConflictResponse({
    description:
      'El cobro no está pendiente, ya fue pagado o la referencia está en uso',
    type: ErrorHttpDto,
  })
  registrarEfectivo(
    @Body() dto: RegistrarPagoEfectivoDto,
    @UsuarioActual() sesion: SesionUsuario,
  ) {
    return this.registrarPagoEfectivo.ejecutar({
      cobroId: dto.cobroId,
      referencia: dto.referencia,
      registradoPorId: sesion.sub,
    });
  }
}
