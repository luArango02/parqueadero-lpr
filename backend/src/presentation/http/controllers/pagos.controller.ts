
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { SesionUsuario } from '../../../application/auth/emisor-token';
import { RegistrarPagoEfectivoUseCase } from '../../../application/pagos/registrar-pago-efectivo.use-case';
import { Autenticado } from '../auth/autenticado.decorator';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import { RegistrarPagoEfectivoDto } from '../dto/pagos/registrar-pago-efectivo.dto';

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
      'Registra un pago en efectivo de forma idempotente, ' +
      'actualiza el cobro y genera auditoría.',
  })
  @ApiOkResponse({
    description: 'Pago registrado o solicitud idempotente recuperada.',
  })
  @ApiNotFoundResponse({
    description: 'El cobro no existe.',
  })
  @ApiConflictResponse({
    description:
      'El cobro no está pendiente, ya fue pagado o la referencia está en uso.',
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
