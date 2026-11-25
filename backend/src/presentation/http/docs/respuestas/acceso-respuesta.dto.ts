import { ApiProperty } from '@nestjs/swagger';

export class CobroDelDiaRespuestaDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  id!: string;

  @ApiProperty({
    description: 'Valor del cobro en pesos colombianos',
    example: 8000,
    type: Number,
  })
  valor!: number;

  @ApiProperty({
    enum: ['DIURNA', 'NOCTURNA'],
    example: 'DIURNA',
  })
  franja!: 'DIURNA' | 'NOCTURNA';

  @ApiProperty({
    enum: ['PENDIENTE', 'PAGADO', 'ANULADO', 'VENCIDO'],
    example: 'PENDIENTE',
  })
  estado!: 'PENDIENTE' | 'PAGADO' | 'ANULADO' | 'VENCIDO';

  @ApiProperty({
    description: 'Fecha del día operativo en Colombia',
    format: 'date',
    example: '2026-11-25',
  })
  diaOperativo!: string;
}

export class IngresoRespuestaDto {
  @ApiProperty({ example: true })
  autorizado!: boolean;

  @ApiProperty({
    enum: ['ABIERTA', 'CERRADA'],
    example: 'ABIERTA',
  })
  barrera!: 'ABIERTA' | 'CERRADA';

  @ApiProperty({
    example: 'INGRESO CON COBRO DIURNA PENDIENTE',
  })
  motivo!: string;

  @ApiProperty({ example: 'ABC123' })
  placa!: string;

  @ApiProperty({
    type: String,
    enum: ['CARRO', 'MOTO'],
    nullable: true,
    example: 'CARRO',
  })
  tipoVehiculo!: 'CARRO' | 'MOTO' | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Código del espacio asignado',
    example: 'A-01',
  })
  espacio!: string | null;

  @ApiProperty({
    type: CobroDelDiaRespuestaDto,
    nullable: true,
    description: 'Cobro asociado al día operativo, si aplica',
  })
  cobro!: CobroDelDiaRespuestaDto | null;

  @ApiProperty({
    description: 'Indica si existe un cobro previo del día operativo',
    example: false,
  })
  reingreso!: boolean;
}

export class SalidaRespuestaDto {
  @ApiProperty({ example: true })
  autorizado!: boolean;

  @ApiProperty({
    enum: ['ABIERTA', 'CERRADA'],
    example: 'ABIERTA',
  })
  barrera!: 'ABIERTA' | 'CERRADA';

  @ApiProperty({
    example: 'SALIDA AUTORIZADA: COBRO PAGADO',
  })
  motivo!: string;

  @ApiProperty({ example: 'ABC123' })
  placa!: string;

  @ApiProperty({
    type: String,
    enum: ['CARRO', 'MOTO'],
    nullable: true,
    example: 'CARRO',
  })
  tipoVehiculo!: 'CARRO' | 'MOTO' | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'A-01',
  })
  espacioLiberado!: string | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 120,
  })
  minutosDentro!: number | null;

  @ApiProperty({
    type: CobroDelDiaRespuestaDto,
    isArray: true,
    description: 'Cobros pendientes que impiden la salida',
    example: [],
  })
  cobrosPendientes!: CobroDelDiaRespuestaDto[];
}
