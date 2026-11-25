import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ESTADOS_HISTORIAL,
  TIPOS_HISTORIAL,
} from '../../../application/eventos/historial-eventos.repositorio';
import type {
  EstadoHistorial,
  TipoHistorial,
} from '../../../application/eventos/historial-eventos.repositorio';

export class HistorialEventosQueryDto {
  @ApiPropertyOptional({
    example: 'ABC123',
    description: 'Busqueda completa o parcial de placa.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Matches(/^[a-zA-Z0-9]+$/)
  placa?: string;

  @ApiPropertyOptional({ enum: [...TIPOS_HISTORIAL] })
  @IsOptional()
  @IsIn(TIPOS_HISTORIAL)
  tipo?: TipoHistorial;

  @ApiPropertyOptional({ enum: [...ESTADOS_HISTORIAL] })
  @IsOptional()
  @IsIn(ESTADOS_HISTORIAL)
  estado?: EstadoHistorial;

  @ApiPropertyOptional({
    example: '2026-11-25T06:00:00-05:00',
    description: 'Inicio inclusivo del intervalo.',
  })
  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/)
  desde?: string;

  @ApiPropertyOptional({
    example: '2026-11-25T18:00:00-05:00',
    description: 'Fin inclusivo del intervalo.',
  })
  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/)
  hasta?: string;

  @ApiPropertyOptional({
    default: 1,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  pagina?: number;

  @ApiPropertyOptional({
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;
}
