import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@parqueadero.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Admin123*' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
