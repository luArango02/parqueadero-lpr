import { Controller, Get } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ConsultarSedeActualUseCase } from '../../../application/espacios/consultar-sede-actual.use-case';
import { SedeActual } from '../../../application/espacios/espacio.repositorio';

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
  @ApiOkResponse({ description: 'Sede, carriles y resumen de espacios' })
  @ApiNotFoundResponse({ description: 'No hay sede configurada' })
  actual(): Promise<SedeActual> {
    return this.consultarSedeActual.ejecutar();
  }
}
