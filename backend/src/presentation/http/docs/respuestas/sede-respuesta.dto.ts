import { ApiProperty } from '@nestjs/swagger';

export class CarrilRespuestaDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  id!: string;

  @ApiProperty({ example: 'Carril de entrada' })
  nombre!: string;

  @ApiProperty({
    enum: ['ENTRADA', 'SALIDA'],
    example: 'ENTRADA',
  })
  sentido!: 'ENTRADA' | 'SALIDA';
}

export class ResumenEspaciosRespuestaDto {
  @ApiProperty({
    type: 'integer',
    minimum: 0,
    example: 15,
  })
  total!: number;

  @ApiProperty({
    type: 'integer',
    minimum: 0,
    example: 10,
  })
  disponibles!: number;

  @ApiProperty({
    type: 'integer',
    minimum: 0,
    example: 4,
  })
  ocupados!: number;

  @ApiProperty({
    type: 'integer',
    minimum: 0,
    example: 1,
  })
  fueraDeServicio!: number;
}

export class SedeActualRespuestaDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  id!: string;

  @ApiProperty({ example: 'Sede Principal' })
  nombre!: string;

  @ApiProperty({ example: 'America/Bogota' })
  zonaHoraria!: string;

  @ApiProperty({ example: '06:00' })
  inicioDiaOperativo!: string;

  @ApiProperty({ example: '06:00' })
  inicioFranjaDiurna!: string;

  @ApiProperty({ example: '18:00' })
  inicioFranjaNocturna!: string;

  @ApiProperty({
    example: 0.8,
    description: 'Umbral de confianza para aceptar una lectura',
  })
  umbralConfianza!: number;

  @ApiProperty({
    type: CarrilRespuestaDto,
    isArray: true,
  })
  carriles!: CarrilRespuestaDto[];

  @ApiProperty({
    type: ResumenEspaciosRespuestaDto,
  })
  resumenEspacios!: ResumenEspaciosRespuestaDto;
}
