import {
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
  ApiTags,
} from '@nestjs/swagger';
import { ActualizarEspacioUseCase } from '../../../application/espacios/actualizar-espacio.use-case';
import { CrearEspacioUseCase } from '../../../application/espacios/crear-espacio.use-case';
import {
  EspacioConPlaca,
  EspacioRegistrado,
} from '../../../application/espacios/espacio.repositorio';
import { ListarEspaciosUseCase } from '../../../application/espacios/listar-espacios.use-case';
import { ActualizarEspacioDto } from '../dto/actualizar-espacio.dto';
import { CrearEspacioDto } from '../dto/crear-espacio.dto';
import { ListarEspaciosQueryDto } from '../dto/listar-espacios.query.dto';

@ApiTags('Espacios')
@Controller('espacios')
export class EspaciosController {
  constructor(
    private readonly listarEspacios: ListarEspaciosUseCase,
    private readonly crearEspacio: CrearEspacioUseCase,
    private readonly actualizarEspacio: ActualizarEspacioUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar los espacios de la sede',
    description:
      'Con filtros opcionales por zona, tipo compatible y estado. Cada espacio trae `placa`: la del vehículo que lo ocupa, o null si no hay nadie adentro.',
  })
  @ApiOkResponse({ description: 'Espacios ordenados por zona y código' })
  @ApiBadRequestResponse({ description: 'Filtro inválido' })
  listar(@Query() query: ListarEspaciosQueryDto): Promise<EspacioConPlaca[]> {
    return this.listarEspacios.ejecutar(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear un espacio',
    description:
      'El código se arma con la zona y el número (zona A, número 1 = A-01) y no puede repetirse en la sede.',
  })
  @ApiCreatedResponse({ description: 'Espacio creado, disponible' })
  @ApiBadRequestResponse({ description: 'Zona, número o tipo inválidos' })
  @ApiConflictResponse({ description: 'El código ya existe en la sede' })
  crear(@Body() dto: CrearEspacioDto): Promise<EspacioRegistrado> {
    return this.crearEspacio.ejecutar(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Cambiar el estado o el tipo compatible de un espacio',
    description:
      'El estado solo puede ser DISPONIBLE o FUERA_DE_SERVICIO (OCUPADO lo decide el sistema). El código no se modifica. Un espacio ocupado no se puede modificar.',
  })
  @ApiParam({ name: 'id', description: 'Id del espacio' })
  @ApiOkResponse({ description: 'Espacio actualizado' })
  @ApiBadRequestResponse({ description: 'Id inválido o sin cambios válidos' })
  @ApiNotFoundResponse({ description: 'Espacio no encontrado' })
  @ApiConflictResponse({ description: 'El espacio está ocupado' })
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarEspacioDto,
  ): Promise<EspacioRegistrado> {
    return this.actualizarEspacio.ejecutar({ id, ...dto });
  }
}
