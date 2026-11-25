import { Controller, Get } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ConsultarSedeActualUseCase } from '../../../application/espacios/consultar-sede-actual.use-case';
import { SedeActual } from '../../../application/espacios/espacio.repositorio';
import { ErrorHttpDto } from '../docs/respuestas/error-http.dto';
import { SedeActualRespuestaDto } from '../docs/respuestas/sede-respuesta.dto';

@ApiTags('Sedes')
@Controller('sedes')
export class SedesController {
  constructor(
    private readonly consultarSedeActual: ConsultarSedeActualUseCase,
  ) {}

  @Get('actual')
  @ApiOperation({
    summary: 'Consultar la sede actual',
    description:
      'Devuelve la sede con sus carriles de entrada y salida y un resumen de sus espacios por estado.',
  })
  @ApiOkResponse({
    description: 'Sede actual, carriles y resumen de espacios',
    type: SedeActualRespuestaDto,
  })
  @ApiNotFoundResponse({
    description: 'No hay sede configurada',
    type: ErrorHttpDto,
  })
  actual(): Promise<SedeActual> {
    return this.consultarSedeActual.ejecutar();
  }
}
