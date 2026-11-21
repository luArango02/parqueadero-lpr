import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { TIPOS_COMPATIBLES } from '../../../domain/espacios/espacio';
import type { TipoVehiculo } from '../../../domain/vehiculos/placa';

export class CrearEspacioDto {
  @ApiProperty({
    example: 'A',
    description: 'Zona del espacio: una letra (A, M, ...)',
  })
  @IsString()
  @IsNotEmpty()
  zona!: string;

  @ApiProperty({
    example: 11,
    minimum: 1,
    maximum: 99,
    description: 'Número dentro de la zona; el código resultante es A-11',
  })
  @IsInt()
  @Min(1)
  @Max(99)
  numero!: number;

  @ApiProperty({ enum: TIPOS_COMPATIBLES })
  @IsIn(TIPOS_COMPATIBLES)
  tipoCompatible!: TipoVehiculo;
}
