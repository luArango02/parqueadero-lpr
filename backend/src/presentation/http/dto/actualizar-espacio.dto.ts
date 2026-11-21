import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import {
  ESTADOS_ASIGNABLES,
  TIPOS_COMPATIBLES,
} from '../../../domain/espacios/espacio';
import type { EstadoAsignable } from '../../../domain/espacios/espacio';
import type { TipoVehiculo } from '../../../domain/vehiculos/placa';

export class ActualizarEspacioDto {
  @ApiPropertyOptional({
    enum: ESTADOS_ASIGNABLES,
    description: 'OCUPADO no se fija a mano: lo decide el sistema',
  })
  @IsOptional()
  @IsIn(ESTADOS_ASIGNABLES)
  estado?: EstadoAsignable;

  @ApiPropertyOptional({ enum: TIPOS_COMPATIBLES })
  @IsOptional()
  @IsIn(TIPOS_COMPATIBLES)
  tipoCompatible?: TipoVehiculo;
}
