import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsUUID, Max, Min } from 'class-validator';

export class CrearVersionTarifaDto {
  @ApiProperty({
    description: 'Identificador UUID de la sede.',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  sedeId!: string;

  @ApiProperty({
    description: 'Tipo de vehiculo al que se aplica la tarifa.',
    enum: ['CARRO', 'MOTO'],
    example: 'CARRO',
  })
  @IsIn(['CARRO', 'MOTO'])
  tipoVehiculo!: 'CARRO' | 'MOTO';

  @ApiProperty({
    description: 'Valor de la tarifa diurna.',
    example: 9000,
    minimum: 0,
    maximum: 9999999999.99,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999.99)
  valorDiurno!: number;

  @ApiProperty({
    description: 'Valor de la tarifa nocturna.',
    example: 6000,
    minimum: 0,
    maximum: 9999999999.99,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999.99)
  valorNocturno!: number;
}
