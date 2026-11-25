import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { SesionUsuario } from '../../../application/auth/emisor-token';
import {
  RegistrarDeteccionUseCase,
  ResultadoDeteccion,
} from '../../../application/detecciones/registrar-deteccion.use-case';
import { DeteccionValidada } from '../../../application/detecciones/validacion-deteccion.repositorio';
import { ValidarDeteccionUseCase } from '../../../application/detecciones/validar-deteccion.use-case';
import { Autenticado } from '../auth/autenticado.decorator';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import { RegistrarDeteccionDto } from '../dto/registrar-deteccion.dto';
import { ValidarDeteccionDto } from '../dto/validar-deteccion.dto';
import { ErrorHttpDto } from '../docs/respuestas/error-http.dto';
import {
  DeteccionRespuestaDto,
  DeteccionValidadaRespuestaDto,
} from '../docs/respuestas/deteccion-respuesta.dto';

@ApiTags('Detecciones')
@Controller('detecciones')
export class DeteccionesController {
  constructor(
    private readonly registrarDeteccion: RegistrarDeteccionUseCase,
    private readonly validarDeteccion: ValidarDeteccionUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar una lectura simulada de placa',
    description:
      'Simula lo que enviaría una cámara LPR. Una lectura bajo el umbral de confianza de la sede queda en PENDIENTE_REVISION. No hay OCR real: el origen se guarda como SIMULADOR.',
  })
  @ApiCreatedResponse({
    description: 'Lectura registrada con su estado y umbral aplicado',
    type: DeteccionRespuestaDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos',
    type: ErrorHttpDto,
  })
  @ApiNotFoundResponse({
    description: 'Sede o carril no encontrado',
    type: ErrorHttpDto,
  })
  registrar(@Body() dto: RegistrarDeteccionDto): Promise<ResultadoDeteccion> {
    return this.registrarDeteccion.ejecutar(dto);
  }

  @Patch(':id/validacion')
  @Autenticado('OPERADOR')
  @ApiOperation({
    summary: 'Validar o corregir una lectura dudosa (solo operador)',
    description:
      'El operador confirma o corrige la placa de una lectura PENDIENTE_REVISION. La lectura original se conserva; quedan guardados el valor anterior, el nuevo, el usuario del token y el motivo, y la lectura se marca como manual.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador de la detección pendiente',
    schema: {
      type: 'string',
      format: 'uuid',
    },
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @ApiOkResponse({
    description: 'Lectura validada o corregida',
    type: DeteccionValidadaRespuestaDto,
  })
  @ApiBadRequestResponse({
    description: 'Id, placa o motivo inválidos',
    type: ErrorHttpDto,
  })
  @ApiNotFoundResponse({
    description: 'Detección no encontrada',
    type: ErrorHttpDto,
  })
  @ApiConflictResponse({
    description: 'La lectura no está pendiente de revisión',
    type: ErrorHttpDto,
  })
  validar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ValidarDeteccionDto,
    @UsuarioActual() sesion: SesionUsuario,
  ): Promise<DeteccionValidada> {
    return this.validarDeteccion.ejecutar({
      deteccionId: id,
      usuarioId: sesion.sub,
      placa: dto.placa,
      motivo: dto.motivo,
    });
  }
}
