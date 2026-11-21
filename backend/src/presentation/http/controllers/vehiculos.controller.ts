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

@ApiTags('Vehículos')
@Controller('vehiculos')
export class VehiculosController {
  constructor(
    private readonly registrarVehiculo: RegistrarVehiculoUseCase,
    private readonly buscarVehiculo: BuscarVehiculoUseCase,
    private readonly listarVehiculos: ListarVehiculosUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un vehículo' })
  @ApiCreatedResponse({ description: 'Vehículo registrado' })
  @ApiBadRequestResponse({
    description: 'Placa inválida, tipo inválido o tipo no deducible',
  })
  @ApiUnprocessableEntityResponse({
    description: 'El tipo contradice el formato de la placa',
  })
  @ApiConflictResponse({ description: 'La placa ya está registrada' })
  registrar(@Body() dto: RegistrarVehiculoDto): Promise<VehiculoConsultado> {
    return this.registrarVehiculo.ejecutar(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar vehículos con filtros por placa, tipo y estado',
  })
  @ApiOkResponse({
    description: 'Vehículos con su estado y su permanencia activa, si existe',
  })
  @ApiBadRequestResponse({ description: 'Filtro inválido' })
  listar(
    @Query() query: ListarVehiculosQueryDto,
  ): Promise<VehiculoConsultado[]> {
    return this.listarVehiculos.ejecutar(query);
  }

  @Get(':placa')
  @ApiOperation({ summary: 'Consultar un vehículo por placa' })
  @ApiParam({ name: 'placa', example: 'ABC123' })
  @ApiOkResponse({
    description: 'Vehículo con su permanencia activa cuando está dentro',
  })
  @ApiNotFoundResponse({ description: 'No hay un vehículo con esa placa' })
  buscar(@Param('placa') placa: string): Promise<VehiculoConsultado> {
    return this.buscarVehiculo.ejecutar(placa);
  }
}
