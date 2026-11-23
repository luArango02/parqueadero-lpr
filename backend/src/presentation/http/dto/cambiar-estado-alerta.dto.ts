import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TIPOS_COMPATIBLES } from '../../../domain/espacios/espacio';
import type { TipoVehiculo } from '../../../domain/vehiculos/placa';

export class CambiarEstadoAlertaDto {
  @ApiProperty({
    enum: ['RESUELTA'],
    description:
      'Estado al que pasa la alerta; por ahora solo se puede resolver',
  })
  @IsIn(['RESUELTA'])
  estado!: 'RESUELTA';

  @ApiProperty({
    example: 'Se revisó el vehículo: es una moto con placa de carro',
    description: 'Motivo de la resolución; queda en la trazabilidad',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  resolucion!: string;

  @ApiPropertyOptional({
    enum: TIPOS_COMPATIBLES,
    description:
      'Obligatorio en las discrepancias de tipo: el tipo real que confirma el operador, que queda como tipo registrado del vehículo',
  })
  @IsOptional()
  @IsIn(TIPOS_COMPATIBLES)
  tipoConfirmado?: TipoVehiculo;
}
