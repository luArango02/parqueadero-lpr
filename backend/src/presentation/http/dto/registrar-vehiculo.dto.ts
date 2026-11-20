import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TIPOS_VEHICULO } from '../../../domain/vehiculos/placa';
import type { TipoVehiculo } from '../../../domain/vehiculos/placa';

export class RegistrarVehiculoDto {
  @ApiProperty({
    example: 'abc 123',
    description: 'Se normaliza a mayúsculas y sin espacios ni guiones',
  })
  @IsString()
  @IsNotEmpty()
  placa!: string;

  @ApiPropertyOptional({
    enum: TIPOS_VEHICULO,
    description: 'Si se omite, se deduce del formato de la placa',
  })
  @IsOptional()
  @IsIn(TIPOS_VEHICULO)
  tipo?: TipoVehiculo;
}
