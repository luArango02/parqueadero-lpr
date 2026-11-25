import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CalcularCobroService } from '../../../application/cobros/calcular-cobro.service';
import { CalcularCobroDto } from '../dto/cobros/calcular-cobro.dto';
import { ErrorHttpDto } from '../docs/respuestas/error-http.dto';

@ApiTags('Cobros')
@Controller('cobros')
export class CobrosController {
  constructor(private readonly calcularCobro: CalcularCobroService) {}

  @Post('calcular')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calcular la tarifa aplicable a un ingreso',
    description:
      'Consulta la tarifa vigente y aplica Strategy según el tipo de vehículo. No registra cobros ni pagos.',
  })
  @ApiOkResponse({
    description: 'Resultado del cálculo.',
    schema: {
      example: {
        tipoVehiculo: 'CARRO',
        franja: 'NOCTURNA',
        diaOperativo: '2026-11-20',
        tarifaId: '550e8400-e29b-41d4-a716-446655440000',
        tarifaVersion: 2,
        valor: '5000.00',
        exento: false,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos.',
    type: ErrorHttpDto,
  })
  @ApiNotFoundResponse({
    description: 'Sede, vehículo o tarifa no encontrados.',
    type: ErrorHttpDto,
  })
  async calcular(@Body() dto: CalcularCobroDto) {
    return this.calcularCobro.ejecutar({
      sedeId: dto.sedeId,
      vehiculoId: dto.vehiculoId,
      fechaIngreso: new Date(dto.fechaIngreso),
    });
  }
}
