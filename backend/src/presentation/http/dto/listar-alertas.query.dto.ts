import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ESTADOS_ALERTA, TIPOS_ALERTA } from '../../../domain/alertas/alerta';
import type { EstadoAlerta, TipoAlerta } from '../../../domain/alertas/alerta';

export class ListarAlertasQueryDto {
  @ApiPropertyOptional({ enum: ESTADOS_ALERTA })
  @IsOptional()
  @IsIn(ESTADOS_ALERTA)
  estado?: EstadoAlerta;

  @ApiPropertyOptional({ enum: TIPOS_ALERTA })
  @IsOptional()
  @IsIn(TIPOS_ALERTA)
  tipo?: TipoAlerta;

  @ApiPropertyOptional({
    example: 'ABC',
    description: 'Búsqueda parcial por placa',
  })
  @IsOptional()
  @IsString()
  placa?: string;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;
}
