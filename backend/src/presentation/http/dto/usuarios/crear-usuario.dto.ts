import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { ROLES } from '../../../../domain/usuarios/rol';
import type { Rol } from '../../../../domain/usuarios/rol';

export class CrearUsuarioDto {
  @ApiProperty({ example: 'Operador Noche' })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({ example: 'noche@parqueadero.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Clave123*', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ enum: ROLES, example: 'OPERADOR' })
  @IsIn(ROLES)
  rol!: Rol;
}
