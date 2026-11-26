import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { BuscarVehiculoUseCase } from '../../../application/vehiculos/buscar-vehiculo.use-case';
import { ListarVehiculosUseCase } from '../../../application/vehiculos/listar-vehiculos.use-case';
import { RegistrarVehiculoUseCase } from '../../../application/vehiculos/registrar-vehiculo.use-case';
import { VehiculoConsultado } from '../../../application/vehiculos/vehiculo.repositorio';
import { ListarVehiculosQueryDto } from '../dto/listar-vehiculos.query.dto';
import { RegistrarVehiculoDto } from '../dto/registrar-vehiculo.dto';
import { ErrorHttpDto } from '../docs/respuestas/error-http.dto';
import { VehiculoRespuestaDto } from '../docs/respuestas/vehiculo-respuesta.dto';

@ApiTags('Vehículos')
@Controller('vehiculos')
export class VehiculosController {
  constructor(
    private readonly registrarVehiculo: RegistrarVehiculoUseCase,
    private readonly buscarVehiculo: BuscarVehiculoUseCase,
    private readonly listarVehiculos: ListarVehiculosUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar un vehículo',
    description:
      'Normaliza la placa y deduce el tipo de vehículo cuando no se proporciona. La placa debe ser única.',
  })
  @ApiCreatedResponse({
    description: 'Vehículo registrado',
    type: VehiculoRespuestaDto,
  })
  @ApiBadRequestResponse({
    description: 'Placa inválida, tipo inválido o tipo no deducible',
    type: ErrorHttpDto,
  })
  @ApiUnprocessableEntityResponse({
    description: 'El tipo contradice el formato de la placa',
    type: ErrorHttpDto,
  })
  @ApiConflictResponse({
    description: 'La placa ya está registrada',
    type: ErrorHttpDto,
  })
  registrar(@Body() dto: RegistrarVehiculoDto): Promise<VehiculoConsultado> {
    return this.registrarVehiculo.ejecutar(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar vehículos con filtros por placa, tipo y estado',
    description:
      'Permite consultar vehículos dentro o fuera del parqueadero. El límite predeterminado es 50 y el máximo es 100.',
  })
  @ApiOkResponse({
    description: 'Vehículos con su estado y permanencia activa, si existe',
    type: VehiculoRespuestaDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: 'Filtro inválido',
    type: ErrorHttpDto,
  })
  listar(
    @Query() query: ListarVehiculosQueryDto,
  ): Promise<VehiculoConsultado[]> {
    return this.listarVehiculos.ejecutar(query);
  }

  @Get(':placa')
  @ApiOperation({ summary: 'Consultar un vehículo por placa' })
  @ApiParam({
    name: 'placa',
    example: 'ABC123',
    description: 'Placa del vehículo registrado',
  })
  @ApiOkResponse({
    description: 'Vehículo con su permanencia activa cuando está dentro',
    type: VehiculoRespuestaDto,
  })
  @ApiNotFoundResponse({
    description: 'No hay un vehículo con esa placa',
    type: ErrorHttpDto,
  })
  buscar(@Param('placa') placa: string): Promise<VehiculoConsultado> {
    return this.buscarVehiculo.ejecutar(placa);
  }
}
