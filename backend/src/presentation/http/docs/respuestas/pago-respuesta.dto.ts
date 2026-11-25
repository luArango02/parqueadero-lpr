import { ApiProperty } from '@nestjs/swagger';

export class PagoEfectivoRespuestaDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  cobroId!: string;

  @ApiProperty({
    example: 'EFECTIVO-20261125-001',
  })
  referencia!: string;

  @ApiProperty({
    enum: ['EFECTIVO'],
    example: 'EFECTIVO',
  })
  medio!: 'EFECTIVO';

  @ApiProperty({
    description: 'Valor monetario representado como texto decimal',
    example: '8000.00',
  })
  valor!: string;

  @ApiProperty({
    enum: ['PAGADO'],
    example: 'PAGADO',
  })
  estadoCobro!: 'PAGADO';

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-25T16:00:00.000Z',
  })
  pagadoEn!: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    nullable: true,
    description: 'Identificador del usuario que registró el pago',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  registradoPorId!: string | null;
}
