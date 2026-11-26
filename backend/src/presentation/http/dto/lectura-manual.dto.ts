import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TIPOS_VEHICULO } from '../../../domain/vehiculos/placa';
import type { TipoVehiculo } from '../../../domain/vehiculos/placa';

// Placa confirmada o corregida por el operador cuando la cámara no fue confiable.
export class LecturaManualDto {
  @ApiProperty({ example: 'GHI789' })
  @IsString()
  @IsNotEmpty()
  placa!: string;

  @ApiPropertyOptional({
    enum: TIPOS_VEHICULO,
    description: 'Solo si la placa no tiene formato de carro ni de moto',
  })
  @IsOptional()
  @IsIn(TIPOS_VEHICULO)
  tipoVehiculo?: TipoVehiculo;
}
