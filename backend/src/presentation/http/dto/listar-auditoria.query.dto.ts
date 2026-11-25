import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListarAuditoriaQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @ApiPropertyOptional({ example: 'MODIFICAR_TARIFA' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  accion?: string;

  @ApiPropertyOptional({ example: 'Tarifa' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entidad?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  entidadId?: string;

  @ApiPropertyOptional({
    example: '2026-11-25T00:00:00-05:00',
    description: 'Inicio inclusivo del intervalo.',
  })
  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/)
  desde?: string;

  @ApiPropertyOptional({
    example: '2026-11-25T23:59:59.999-05:00',
    description: 'Fin inclusivo del intervalo.',
  })
  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/)
  hasta?: string;

  @ApiPropertyOptional({
    default: 1,
    minimum: 1,
    maximum: 10000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
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
