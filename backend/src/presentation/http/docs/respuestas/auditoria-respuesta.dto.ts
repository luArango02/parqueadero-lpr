import { ApiProperty } from '@nestjs/swagger';
import { PaginacionRespuestaDto } from './paginacion-respuesta.dto';

export class UsuarioAuditoriaRespuestaDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    type: String,
    example: 'Administrador',
  })
  nombre!: string;

  @ApiProperty({
    type: String,
    example: 'ADMINISTRADOR',
  })
  rol!: string;
}

export class RegistroAuditoriaRespuestaDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  id!: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    nullable: true,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  usuarioId!: string | null;

  @ApiProperty({
    type: () => UsuarioAuditoriaRespuestaDto,
    nullable: true,
    description: 'Usuario asociado a la operación, cuando existe',
  })
  usuario!: UsuarioAuditoriaRespuestaDto | null;

  @ApiProperty({
    type: String,
    example: 'MODIFICAR_TARIFA',
  })
  accion!: string;

  @ApiProperty({
    type: String,
    example: 'Tarifa',
  })
  entidad!: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    nullable: true,
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  entidadId!: string | null;

  @ApiProperty({
    type: 'object',
    nullable: true,
    additionalProperties: {
      anyOf: [
        { type: 'string', nullable: true },
        { type: 'number' },
        { type: 'boolean' },
      ],
    },
    example: {
      valor: '8000.00',
      version: 1,
    },
    description: 'Datos anteriores permitidos por el mecanismo de auditoría',
  })
  datosAnteriores!: Record<string, string | number | boolean | null> | null;

  @ApiProperty({
    type: 'object',
    nullable: true,
    additionalProperties: {
      anyOf: [
        { type: 'string', nullable: true },
        { type: 'number' },
        { type: 'boolean' },
      ],
    },
    example: {
      valor: '9000.00',
      version: 2,
    },
    description: 'Datos nuevos permitidos por el mecanismo de auditoría',
  })
  datosNuevos!: Record<string, string | number | boolean | null> | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-25T15:30:00.000Z',
  })
  ocurridaEn!: string;
}

export class AuditoriaRespuestaDto extends PaginacionRespuestaDto {
  @ApiProperty({
    type: () => RegistroAuditoriaRespuestaDto,
    isArray: true,
    description: 'Registros de auditoría correspondientes a la página',
  })
  datos!: RegistroAuditoriaRespuestaDto[];
}
