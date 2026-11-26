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
import { Auditar } from '../auditoria/auditar.decorator';
import { Autenticado } from '../auth/autenticado.decorator';
import { LecturaManualDto } from '../dto/lectura-manual.dto';
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

  // RN-14: el operador confirma o corrige la placa; queda auditado con su usuario.
  @Post('ingreso/manual')
  @HttpCode(HttpStatus.OK)
  @Autenticado('OPERADOR', 'ADMINISTRADOR')
  @Auditar('INGRESO_LECTURA_MANUAL', 'EventoAcceso')
  @ApiOperation({ summary: 'Ingreso con placa confirmada por el operador' })
  ingresoManual(@Body() dto: LecturaManualDto): Promise<ResultadoIngreso> {
    return this.registrarIngreso.ejecutar({ ...dto, lecturaManual: true });
  }

  @Post('salida/manual')
  @HttpCode(HttpStatus.OK)
  @Autenticado('OPERADOR', 'ADMINISTRADOR')
  @Auditar('SALIDA_LECTURA_MANUAL', 'EventoAcceso')
  @ApiOperation({ summary: 'Salida con placa confirmada por el operador' })
  salidaManual(@Body() dto: LecturaManualDto): Promise<ResultadoSalida> {
    return this.registrarSalida.ejecutar({
      placa: dto.placa,
      lecturaManual: true,
    });
  }
}
