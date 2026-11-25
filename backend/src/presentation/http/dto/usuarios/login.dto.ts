import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario registrado',
    format: 'email',
    example: 'admin@parqueadero.local',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    format: 'password',
    writeOnly: true,
    example: 'CONTRASENA_DE_EJEMPLO',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
