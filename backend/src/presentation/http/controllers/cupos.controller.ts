import { Controller, Get } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ConsultarCuposUseCase } from '../../../application/espacios/consultar-cupos.use-case';
import { ConsultarDisponibilidadUseCase } from '../../../application/espacios/consultar-disponibilidad.use-case';
import { CupoPorTipo, CupoPorZona } from '../../../domain/espacios/cupos';

@ApiTags('Cupos')
@Controller()
export class CuposController {
  constructor(
    private readonly consultarCupos: ConsultarCuposUseCase,
    private readonly consultarDisponibilidad: ConsultarDisponibilidadUseCase,
  ) {}

  @Get('cupos')
  @ApiOperation({
    summary: 'Cupos por tipo de vehículo',
    description:
      'Se calculan en el momento contando los espacios individuales; no hay contadores manuales. `lleno` es true solo para el tipo que no tiene espacios disponibles, y el ingreso de ese tipo se bloquea aunque el vehículo tenga pase pagado.',
  })
  @ApiOkResponse({ description: 'Un elemento por tipo (CARRO y MOTO)' })
  @ApiNotFoundResponse({ description: 'No hay sede configurada' })
  cupos(): Promise<CupoPorTipo[]> {
    return this.consultarCupos.ejecutar();
  }

  @Get('espacios/disponibilidad')
  @ApiOperation({
    summary: 'Disponibilidad de espacios por zona',
    description:
      'Total, disponibles, ocupados y fuera de servicio de cada zona, con su tipo y el indicador de lleno.',
  })
  @ApiOkResponse({ description: 'Un elemento por zona y tipo' })
  @ApiNotFoundResponse({ description: 'No hay sede configurada' })
  disponibilidad(): Promise<CupoPorZona[]> {
    return this.consultarDisponibilidad.ejecutar();
  }
}
