import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  RegistrarDeteccionUseCase,
  ResultadoDeteccion,
} from '../../../application/detecciones/registrar-deteccion.use-case';
import { RegistrarDeteccionDto } from '../dto/registrar-deteccion.dto';

@ApiTags('Detecciones')
@Controller('detecciones')
export class DeteccionesController {
  constructor(private readonly registrarDeteccion: RegistrarDeteccionUseCase) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar una lectura simulada de placa',
    description:
      'Simula lo que enviaría una cámara LPR. Una lectura bajo el umbral de confianza de la sede queda en PENDIENTE_REVISION. No hay OCR real: el origen se guarda como SIMULADOR.',
  })
  @ApiCreatedResponse({ description: 'Lectura registrada con su estado' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiNotFoundResponse({ description: 'Sede o carril no encontrado' })
  registrar(@Body() dto: RegistrarDeteccionDto): Promise<ResultadoDeteccion> {
    return this.registrarDeteccion.ejecutar(dto);
  }
}
