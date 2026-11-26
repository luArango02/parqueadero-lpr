import { ApiProperty } from '@nestjs/swagger';

export class EventoRecienteRespuestaDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  id!: string;

  @ApiProperty({
    enum: [
      'INGRESO',
      'SALIDA',
      'INGRESO_DENEGADO',
      'SALIDA_DENEGADA',
      'PAGO',
      'ALERTA',
    ],
    example: 'INGRESO',
  })
  tipo!:
    | 'INGRESO'
    | 'SALIDA'
    | 'INGRESO_DENEGADO'
    | 'SALIDA_DENEGADA'
    | 'PAGO'
    | 'ALERTA';

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'ABC123',
  })
  placa!: string | null;

  @ApiProperty({
    example: 'Ingreso autorizado',
  })
  detalle!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-25T13:00:00.000Z',
  })
  ocurridoEn!: string;
}
