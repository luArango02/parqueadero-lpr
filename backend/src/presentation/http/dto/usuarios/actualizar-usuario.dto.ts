import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ROLES } from '../../../../domain/usuarios/rol';
import type { Rol } from '../../../../domain/usuarios/rol';

export class ActualizarUsuarioDto {
  @ApiPropertyOptional({ example: 'Operador Noche' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @ApiPropertyOptional({ enum: ROLES })
  @IsOptional()
  @IsIn(ROLES)
  rol?: Rol;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({ minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
