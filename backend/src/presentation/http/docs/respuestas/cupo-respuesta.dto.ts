import { ApiProperty } from '@nestjs/swagger';

export class CupoRespuestaDto {
  @ApiProperty({
    type: 'integer',
    minimum: 0,
    example: 10,
  })
  total!: number;

  @ApiProperty({
    type: 'integer',
    minimum: 0,
    example: 6,
  })
  disponibles!: number;

  @ApiProperty({
    type: 'integer',
    minimum: 0,
    example: 3,
  })
  ocupados!: number;

  @ApiProperty({
    type: 'integer',
    minimum: 0,
    example: 1,
  })
  fueraDeServicio!: number;

  @ApiProperty({
    description: 'Verdadero cuando no existen espacios disponibles',
    example: false,
  })
  lleno!: boolean;
}

export class CupoPorTipoRespuestaDto extends CupoRespuestaDto {
  @ApiProperty({
    enum: ['CARRO', 'MOTO'],
    example: 'CARRO',
  })
  tipo!: 'CARRO' | 'MOTO';
}

export class CupoPorZonaRespuestaDto extends CupoPorTipoRespuestaDto {
  @ApiProperty({ example: 'A' })
  zona!: string;
}
