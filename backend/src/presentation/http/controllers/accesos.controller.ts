import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  RegistrarIngresoUseCase,
  ResultadoIngreso,
} from '../../../application/accesos/registrar-ingreso.use-case';
import { RegistrarIngresoDto } from '../dto/registrar-ingreso.dto';

@ApiTags('Accesos')
@Controller('accesos')
export class AccesosController {
  constructor(private readonly registrarIngreso: RegistrarIngresoUseCase) {}

  // Responde 200 tanto si se autoriza como si se niega: la decisión va en el cuerpo para que el carril la muestre.
  @Post('ingreso')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar el ingreso de un vehículo por su placa' })
  @ApiOkResponse({
    description: 'Decisión del carril: barrera ABIERTA o CERRADA con su motivo',
  })
  ingreso(@Body() dto: RegistrarIngresoDto): Promise<ResultadoIngreso> {
    return this.registrarIngreso.ejecutar(dto);
  }
}
