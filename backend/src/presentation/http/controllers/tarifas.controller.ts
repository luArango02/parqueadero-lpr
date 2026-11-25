import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { TarifasService } from '../../../application/tarifas/tarifas.service';

import { CrearVersionTarifaDto } from '../dto/tarifas/crear-version-tarifa.dto';
import { ModificarTarifaDto } from '../dto/tarifas/modificar-tarifa.dto';
import { Autenticado } from '../auth/autenticado.decorator';
import { ErrorHttpDto } from '../docs/respuestas/error-http.dto';
import {
  TarifaRespuestaDto,
  VersionTarifaRespuestaDto,
} from '../docs/respuestas/tarifa-respuesta.dto';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import type { SesionUsuario } from '../../../application/auth/emisor-token';

@ApiTags('Tarifas')
@Controller('tarifas')
export class TarifasController {
  constructor(private readonly tarifasService: TarifasService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar tarifas de una sede',
    description:
      'Consulta las tarifas registradas, incluyendo sus versiones historicas.',
  })
  @ApiQuery({
    name: 'sedeId',
    required: true,
    type: String,
    format: 'uuid',
    description: 'UUID de la sede.',
  })
  @ApiOkResponse({
    description: 'Listado de tarifas vigentes e históricas',
    type: TarifaRespuestaDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: 'El identificador de la sede no es válido',
    type: ErrorHttpDto,
  })
  listar(@Query('sedeId', new ParseUUIDPipe()) sedeId: string) {
    return this.tarifasService.listar(sedeId);
  }

  @Get('vigentes')
  @ApiOperation({
    summary: 'Consultar tarifas vigentes',
    description:
      'Consulta las tarifas vigentes de una sede en la fecha indicada. Si no se proporciona fecha, utiliza la fecha actual.',
  })
  @ApiQuery({
    name: 'sedeId',
    required: true,
    type: String,
    format: 'uuid',
    description: 'UUID de la sede.',
  })
  @ApiQuery({
    name: 'fecha',
    required: false,
    type: String,
    example: '2026-11-20T12:00:00-05:00',
    description: 'Fecha ISO 8601 con hora.',
  })
  @ApiOkResponse({
    description: 'Tarifas vigentes para la fecha consultada',
    type: TarifaRespuestaDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: 'El identificador de la sede o la fecha no son válidos',
    type: ErrorHttpDto,
  })
  listarVigentes(
    @Query('sedeId', new ParseUUIDPipe()) sedeId: string,
    @Query('fecha') fecha?: string,
  ) {
    if (!fecha) {
      return this.tarifasService.listarVigentes(sedeId);
    }

    const fechaConsultada = new Date(fecha);

    if (
      !Number.isFinite(fechaConsultada.getTime()) ||
      !/^\d{4}-\d{2}-\d{2}T/.test(fecha)
    ) {
      throw new BadRequestException(
        'La fecha debe ser valida y estar en formato ISO 8601.',
      );
    }

    return this.tarifasService.listarVigentes(sedeId, fechaConsultada);
  }

  @Post(['', 'versiones'])
  @Autenticado('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Crear una nueva version de tarifas',
    description:
      'Registra una nueva version del par de tarifas diurna y nocturna. Conserva el historial y no modifica los cobros existentes. Las motocicletas pueden tener ambas tarifas en cero.',
  })
  @ApiCreatedResponse({
    description: 'Nueva versión del par de tarifas creada correctamente',
    type: VersionTarifaRespuestaDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o relación incorrecta entre tarifas',
    type: ErrorHttpDto,
  })
  @ApiNotFoundResponse({
    description: 'La sede indicada no existe',
    type: ErrorHttpDto,
  })
  @ApiConflictResponse({
    description: 'Conflicto durante el versionamiento',
    type: ErrorHttpDto,
  })
  crearVersion(
    @Body() body: CrearVersionTarifaDto,
    @UsuarioActual() sesion: SesionUsuario,
  ) {
    return this.tarifasService.actualizarTarifas(body, sesion.sub);
  }

  @Patch(':id')
  @Autenticado('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Modificar una tarifa vigente',
    description:
      'Modifica el valor de una franja creando una nueva version del par de tarifas. Conserva el valor de la otra franja y mantiene las versiones historicas.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la tarifa vigente que se desea modificar.',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Tarifa modificada mediante una nueva versión del par',
    type: VersionTarifaRespuestaDto,
  })
  @ApiBadRequestResponse({
    description: 'UUID o valor inválido, o regla tarifaria incumplida',
    type: ErrorHttpDto,
  })
  @ApiNotFoundResponse({
    description: 'La tarifa no existe',
    type: ErrorHttpDto,
  })
  @ApiConflictResponse({
    description:
      'La tarifa ya no está vigente, el par está incompleto o existe un conflicto de actualización',
    type: ErrorHttpDto,
  })
  modificarTarifa(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: ModificarTarifaDto,
    @UsuarioActual() sesion: SesionUsuario,
  ) {
    return this.tarifasService.modificarTarifa(id, body, sesion.sub);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar una tarifa por ID',
    description:
      'Consulta una tarifa especifica, incluso si pertenece a una version historica.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la tarifa.',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Tarifa vigente o histórica encontrada correctamente',
    type: TarifaRespuestaDto,
  })
  @ApiBadRequestResponse({
    description: 'El identificador no es un UUID válido',
    type: ErrorHttpDto,
  })
  @ApiNotFoundResponse({
    description: 'La tarifa no existe',
    type: ErrorHttpDto,
  })
  buscarPorId(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.tarifasService.buscarPorId(id);
  }
}
