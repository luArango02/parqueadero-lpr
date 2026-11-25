import { ApiProperty } from '@nestjs/swagger';

export class PaseVigenteRespuestaDto {
  @ApiProperty({
    example: 'ABC123',
  })
  placa!: string;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  sedeId!: string;

  @ApiProperty({
    format: 'date',
    example: '2026-11-25',
  })
  diaOperativo!: string;

  @ApiProperty({
    description: 'Indica si el cobro del día operativo está pagado',
    example: true,
  })
  vigente!: boolean;

  @ApiProperty({
    type: String,
    format: 'uuid',
    nullable: true,
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  cobroId!: string | null;

  @ApiProperty({
    type: String,
    enum: ['PENDIENTE', 'PAGADO', 'ANULADO', 'VENCIDO'],
    nullable: true,
    example: 'PAGADO',
  })
  estadoCobro!: 'PENDIENTE' | 'PAGADO' | 'ANULADO' | 'VENCIDO' | null;

  @ApiProperty({
    description: 'Motivo del resultado de la consulta',
    example: 'PASE VIGENTE',
    enum: [
      'PASE VIGENTE',
      'PASE NO VIGENTE: COBRO NO PAGADO',
      'SIN PASE PARA EL DIA OPERATIVO',
    ],
  })
  motivo!: string;
}
