import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  ConsultarPaseVigenteUseCase,
  type ResultadoConsultaPase,
} from '../../../application/pases/consultar-pase-vigente.use-case';
import { Autenticado } from '../auth/autenticado.decorator';
import { PaseVigenteRespuestaDto } from '../docs/respuestas/pase-respuesta.dto';

@ApiTags('Pases')
@Controller('pases')
export class PasesController {
  constructor(private readonly consultarPase: ConsultarPaseVigenteUseCase) {}

  @Get(':placa')
  @Autenticado('ADMINISTRADOR', 'OPERADOR')
  @ApiOperation({
    summary: 'Consultar el pase vigente de un vehículo',
    description:
      'Consulta el estado del cobro correspondiente al día operativo actual. Un pase vigente permite reingresar sin generar otro cobro, pero no garantiza la disponibilidad de un espacio.',
  })
  @ApiParam({
    name: 'placa',
    description: 'Placa del vehiculo, por ejemplo ABC123',
    example: 'ABC123',
  })
  @ApiOkResponse({
    description: 'Estado del pase para el día operativo actual',
    type: PaseVigenteRespuestaDto,
  })
  consultar(@Param('placa') placa: string): Promise<ResultadoConsultaPase> {
    return this.consultarPase.ejecutar(placa);
  }
}
