import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ESTADOS_VEHICULO } from '../../../domain/vehiculos/estado-vehiculo';
import type { EstadoVehiculo } from '../../../domain/vehiculos/estado-vehiculo';
import { TIPOS_VEHICULO } from '../../../domain/vehiculos/placa';
import type { TipoVehiculo } from '../../../domain/vehiculos/placa';

export class ListarVehiculosQueryDto {
  @ApiPropertyOptional({
    example: 'ABC',
    description: 'Búsqueda parcial por placa',
  })
  @IsOptional()
  @IsString()
  placa?: string;

  @ApiPropertyOptional({ enum: TIPOS_VEHICULO })
  @IsOptional()
  @IsIn(TIPOS_VEHICULO)
  tipo?: TipoVehiculo;

  @ApiPropertyOptional({
    enum: ESTADOS_VEHICULO,
    description: 'DENTRO = con permanencia activa',
  })
  @IsOptional()
  @IsIn(ESTADOS_VEHICULO)
  estado?: EstadoVehiculo;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;
}
