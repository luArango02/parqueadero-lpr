
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class RegistrarPagoEfectivoDto {
  @ApiProperty({
    description: 'Identificador UUID del cobro pendiente.',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  cobroId: string;

  @ApiProperty({
    description:
      'Referencia única de la operación para garantizar idempotencia.',
    example: 'EFECTIVO-CAJA-000123',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  referencia: string;
}
