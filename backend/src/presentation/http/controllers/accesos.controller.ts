import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  RegistrarIngresoUseCase,
  ResultadoIngreso,
} from '../../../application/accesos/registrar-ingreso.use-case';
import {
  RegistrarSalidaUseCase,
  ResultadoSalida,
} from '../../../application/accesos/registrar-salida.use-case';
import { LecturaPlacaDto } from '../dto/lectura-placa.dto';

// Ambos endpoints responden 200 aunque nieguen el paso: la decisión va en el cuerpo para que el carril la muestre.
@ApiTags('Accesos')
@Controller('accesos')
export class AccesosController {
  constructor(
    private readonly registrarIngreso: RegistrarIngresoUseCase,
    private readonly registrarSalida: RegistrarSalidaUseCase,
  ) {}

  @Post('ingreso')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar el ingreso de un vehículo por su placa' })
  @ApiOkResponse({
    description: 'Decisión del carril: barrera ABIERTA o CERRADA con su motivo',
  })
  ingreso(@Body() dto: LecturaPlacaDto): Promise<ResultadoIngreso> {
    return this.registrarIngreso.ejecutar(dto);
  }

  @Post('salida')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar la salida de un vehículo y liberar su espacio',
  })
  @ApiOkResponse({
    description:
      'Barrera ABIERTA si no tiene cobros pendientes; CERRADA con el motivo si no',
  })
  salida(@Body() dto: LecturaPlacaDto): Promise<ResultadoSalida> {
    return this.registrarSalida.ejecutar(dto);
  }
}
