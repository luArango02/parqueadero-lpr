import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID } from 'class-validator';

export class CalcularCobroDto {
  @ApiProperty({
    description: 'Identificador UUID de la sede.',
    format: 'uuid',
  })
  @IsUUID()
  sedeId: string;

  @ApiProperty({
    description: 'Identificador UUID del vehículo.',
    format: 'uuid',
  })
  @IsUUID()
  vehiculoId: string;

  @ApiProperty({
    description: 'Fecha y hora del ingreso con zona horaria explícita.',
    example: '2026-11-20T19:00:00-05:00',
  })
  @IsDateString({ strict: true })
  fechaIngreso: string;
}
