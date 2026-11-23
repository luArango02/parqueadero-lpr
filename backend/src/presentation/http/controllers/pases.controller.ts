
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

@ApiTags('Pases')
@Controller('pases')
export class PasesController {
  constructor(
    private readonly consultarPase: ConsultarPaseVigenteUseCase,
  ) {}

  @Get(':placa')
  @Autenticado('ADMINISTRADOR', 'OPERADOR')
  @ApiOperation({
    summary: 'Consultar el pase vigente de un vehiculo por placa',
  })
  @ApiParam({
    name: 'placa',
    description: 'Placa del vehiculo, por ejemplo ABC123',
    example: 'ABC123',
  })
  @ApiOkResponse({
    description: 'Estado del pase para el dia operativo actual de la sede',
  })
  consultar(
    @Param('placa') placa: string,
  ): Promise<ResultadoConsultaPase> {
    return this.consultarPase.ejecutar(placa);
  }
}
