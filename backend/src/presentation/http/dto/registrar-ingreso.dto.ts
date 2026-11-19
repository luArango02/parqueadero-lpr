import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class RegistrarIngresoDto {
  @ApiProperty({
    example: 'ABC123',
    description: 'Placa leída por la cámara o el simulador',
  })
  @IsString()
  @IsNotEmpty()
  placa!: string;

  @ApiPropertyOptional({
    example: 0.95,
    description: 'Confianza de la lectura, de 0 a 1',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confianza?: number;

  @ApiPropertyOptional({
    description: 'Carril de entrada; si se omite se usa el primero de la sede',
  })
  @IsOptional()
  @IsUUID()
  carrilId?: string;
}
