import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  RegistrarIngresoUseCase,
  ResultadoIngreso,
} from '../../../application/accesos/registrar-ingreso.use-case';
import {
  RegistrarSalidaUseCase,
  ResultadoSalida,
} from '../../../application/accesos/registrar-salida.use-case';
import { LecturaPlacaDto } from '../dto/lectura-placa.dto';
import {
  IngresoRespuestaDto,
  SalidaRespuestaDto,
} from '../docs/respuestas/acceso-respuesta.dto';
import { ErrorHttpDto } from '../docs/respuestas/error-http.dto';

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
  @ApiOperation({
    summary: 'Registrar el ingreso de un vehículo por su placa',
    description:
      'Valida la lectura, el tipo de vehículo, la disponibilidad de espacios y el cobro del día operativo. Si existe un pase vigente, permite el reingreso sin generar otro cobro, siempre que exista disponibilidad.',
  })
  @ApiOkResponse({
    description:
      'Decisión de ingreso. Puede autorizar o denegar el acceso mediante el campo autorizado.',
    type: IngresoRespuestaDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos de lectura inválidos',
    type: ErrorHttpDto,
  })
  ingreso(@Body() dto: LecturaPlacaDto): Promise<ResultadoIngreso> {
    return this.registrarIngreso.ejecutar(dto);
  }

  @Post('salida')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar la salida de un vehículo',
    description:
      'Verifica la permanencia activa y los cobros pendientes. Si la salida es autorizada, registra el evento y libera el espacio ocupado.',
  })
  @ApiOkResponse({
    description:
      'Decisión de salida. Si existen cobros pendientes, la barrera permanece cerrada y el espacio continúa ocupado.',
    type: SalidaRespuestaDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos de lectura inválidos',
    type: ErrorHttpDto,
  })
  salida(@Body() dto: LecturaPlacaDto): Promise<ResultadoSalida> {
    return this.registrarSalida.ejecutar(dto);
  }
}
