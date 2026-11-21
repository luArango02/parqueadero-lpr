import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import {
  ESTADOS_ESPACIO,
  TIPOS_COMPATIBLES,
} from '../../../domain/espacios/espacio';
import type { EstadoEspacio } from '../../../domain/espacios/espacio';
import type { TipoVehiculo } from '../../../domain/vehiculos/placa';

export class ListarEspaciosQueryDto {
  @ApiPropertyOptional({ example: 'A', description: 'Zona (una letra)' })
  @IsOptional()
  @IsString()
  zona?: string;

  @ApiPropertyOptional({ enum: TIPOS_COMPATIBLES })
  @IsOptional()
  @IsIn(TIPOS_COMPATIBLES)
  tipo?: TipoVehiculo;

  @ApiPropertyOptional({ enum: ESTADOS_ESPACIO })
  @IsOptional()
  @IsIn(ESTADOS_ESPACIO)
  estado?: EstadoEspacio;
}
