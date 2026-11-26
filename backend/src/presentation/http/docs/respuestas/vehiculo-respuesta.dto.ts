import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { ESTADOS_VEHICULO } from '../../../../domain/vehiculos/estado-vehiculo';
import type { EstadoVehiculo } from '../../../../domain/vehiculos/estado-vehiculo';
import { TIPOS_VEHICULO } from '../../../../domain/vehiculos/placa';
import type { TipoVehiculo } from '../../../../domain/vehiculos/placa';

export class PermanenciaActivaRespuestaDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  id!: string;

  @ApiProperty({
    description: 'Código del espacio asignado',
    example: 'C-01',
  })
  espacio!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-25T13:00:00.000Z',
  })
  ingresoEn!: string;
}

@ApiExtraModels(PermanenciaActivaRespuestaDto)
export class VehiculoRespuestaDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  id!: string;

  @ApiProperty({ example: 'ABC123' })
  placa!: string;

  @ApiProperty({
    enum: TIPOS_VEHICULO,
    example: 'CARRO',
  })
  tipo!: TipoVehiculo;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-25T12:00:00.000Z',
  })
  creadoEn!: string;

  @ApiProperty({
    enum: ESTADOS_VEHICULO,
    example: 'FUERA',
  })
  estado!: EstadoVehiculo;

  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(PermanenciaActivaRespuestaDto) },
      { type: 'object', nullable: true, enum: [null] },
    ],
    description: 'Permanencia actual; null cuando el vehículo está fuera',
    example: null,
  })
  permanenciaActiva!: PermanenciaActivaRespuestaDto | null;
}
