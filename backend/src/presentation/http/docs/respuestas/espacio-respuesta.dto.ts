import { ApiProperty } from '@nestjs/swagger';

export class EspacioRespuestaDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  id!: string;

  @ApiProperty({ example: 'A-01' })
  codigo!: string;

  @ApiProperty({ example: 'A' })
  zona!: string;

  @ApiProperty({
    enum: ['CARRO', 'MOTO'],
    example: 'CARRO',
  })
  tipoCompatible!: 'CARRO' | 'MOTO';

  @ApiProperty({
    enum: ['DISPONIBLE', 'OCUPADO', 'FUERA_DE_SERVICIO'],
    example: 'DISPONIBLE',
  })
  estado!: 'DISPONIBLE' | 'OCUPADO' | 'FUERA_DE_SERVICIO';
}

export class EspacioConPlacaRespuestaDto extends EspacioRespuestaDto {
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Placa del vehículo que ocupa el espacio, si existe',
    example: null,
  })
  placa!: string | null;
}
