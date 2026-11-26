import { ApiProperty } from '@nestjs/swagger';

export class UsuarioRespuestaDto {
  @ApiProperty({
    description: 'Identificador único del usuario',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    example: 'Operador de parqueadero',
  })
  nombre!: string;

  @ApiProperty({
    format: 'email',
    example: 'operador@parqueadero.local',
  })
  email!: string;

  @ApiProperty({
    enum: ['ADMINISTRADOR', 'OPERADOR'],
    example: 'OPERADOR',
  })
  rol!: 'ADMINISTRADOR' | 'OPERADOR';

  @ApiProperty({
    description: 'Indica si el usuario está activo',
    example: true,
  })
  activo!: boolean;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-25T15:00:00.000Z',
  })
  creadoEn!: string;
}

export class SesionRespuestaDto {
  @ApiProperty({
    description: 'Token JWT para autenticar solicitudes protegidas',
    example: 'TOKEN_JWT_DE_EJEMPLO',
  })
  accessToken!: string;

  @ApiProperty({
    type: UsuarioRespuestaDto,
  })
  usuario!: UsuarioRespuestaDto;
}
