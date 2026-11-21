import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TIPOS_VEHICULO } from '../../../domain/vehiculos/placa';
import type { TipoVehiculo } from '../../../domain/vehiculos/placa';

export class RegistrarDeteccionDto {
  @ApiProperty({
    example: 'abc 123',
    description:
      'Placa tal como la devolvió el lector; se normaliza a mayúsculas y sin espacios',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  placa!: string;

  @ApiProperty({
    example: 0.92,
    minimum: 0,
    maximum: 1,
    description: 'Confianza de la lectura, de 0 a 1',
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  confianza!: number;

  @ApiPropertyOptional({
    enum: TIPOS_VEHICULO,
    description: 'Tipo de vehículo que vio la cámara',
  })
  @IsOptional()
  @IsIn(TIPOS_VEHICULO)
  tipoVisual?: TipoVehiculo;

  @ApiPropertyOptional({
    description:
      'Carril donde ocurre la lectura; si se omite, el primer carril de entrada de la sede',
  })
  @IsOptional()
  @IsUUID()
  carrilId?: string;

  @ApiPropertyOptional({
    example: '2026-11-20T15:30:00-05:00',
    description: 'Hora de la lectura (ISO 8601); si se omite, la hora actual',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  ocurridaEn?: Date;
}
