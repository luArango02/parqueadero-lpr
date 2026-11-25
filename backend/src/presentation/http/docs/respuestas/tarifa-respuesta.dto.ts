import { ApiProperty } from '@nestjs/swagger';

export class TarifaRespuestaDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  sedeId!: string;

  @ApiProperty({
    enum: ['CARRO', 'MOTO'],
    example: 'CARRO',
  })
  tipoVehiculo!: 'CARRO' | 'MOTO';

  @ApiProperty({
    enum: ['DIURNA', 'NOCTURNA'],
    example: 'DIURNA',
  })
  franja!: 'DIURNA' | 'NOCTURNA';

  @ApiProperty({
    description: 'Valor de la tarifa en pesos colombianos como texto decimal',
    example: '8000.00',
  })
  valor!: string;

  @ApiProperty({
    type: 'integer',
    example: 1,
    minimum: 1,
  })
  version!: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-25T11:00:00.000Z',
  })
  vigenteDesde!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Fin de la vigencia. Null si no tiene fecha de finalización',
    example: null,
  })
  vigenteHasta!: string | null;
}

export class VersionTarifaRespuestaDto {
  @ApiProperty({
    type: TarifaRespuestaDto,
    description: 'Nueva versión de la tarifa diurna',
  })
  diurna!: TarifaRespuestaDto;

  @ApiProperty({
    type: TarifaRespuestaDto,
    description: 'Nueva versión de la tarifa nocturna',
  })
  nocturna!: TarifaRespuestaDto;
}
