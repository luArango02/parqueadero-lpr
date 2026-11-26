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
import { ErrorHttpDto } from '../docs/respuestas/error-http.dto';
import {
  CupoPorTipoRespuestaDto,
  CupoPorZonaRespuestaDto,
} from '../docs/respuestas/cupo-respuesta.dto';

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
  @ApiOkResponse({
    description: 'Disponibilidad de espacios por tipo de vehículo',
    type: CupoPorTipoRespuestaDto,
    isArray: true,
  })
  @ApiNotFoundResponse({
    description: 'No hay sede configurada',
    type: ErrorHttpDto,
  })
  cupos(): Promise<CupoPorTipo[]> {
    return this.consultarCupos.ejecutar();
  }

  @Get('espacios/disponibilidad')
  @ApiOperation({
    summary: 'Disponibilidad de espacios por zona',
    description:
      'Total, disponibles, ocupados y fuera de servicio de cada zona, con su tipo y el indicador de lleno.',
  })
  @ApiOkResponse({
    description: 'Disponibilidad de espacios agrupada por zona y tipo',
    type: CupoPorZonaRespuestaDto,
    isArray: true,
  })
  @ApiNotFoundResponse({
    description: 'No hay sede configurada',
    type: ErrorHttpDto,
  })
  disponibilidad(): Promise<CupoPorZona[]> {
    return this.consultarDisponibilidad.ejecutar();
  }
}
