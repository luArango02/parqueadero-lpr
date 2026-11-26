import { ApiProperty } from '@nestjs/swagger';
import type {
  EstadoDeteccion,
  OrigenLectura,
} from '../../../../domain/detecciones/deteccion';
import { TIPOS_VEHICULO } from '../../../../domain/vehiculos/placa';
import type { TipoVehiculo } from '../../../../domain/vehiculos/placa';

export class EvidenciaDeteccionRespuestaDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  id!: string;

  @ApiProperty({ example: 'ABC123' })
  placaLeida!: string;

  @ApiProperty({
    minimum: 0,
    maximum: 1,
    example: 0.35,
  })
  confianza!: number;

  @ApiProperty({
    type: String,
    enum: [...TIPOS_VEHICULO, null],
    nullable: true,
    example: 'CARRO',
  })
  tipoVisual!: TipoVehiculo | null;

  @ApiProperty({
    enum: ['SIMULADOR', 'OCR', 'MANUAL'],
    example: 'SIMULADOR',
    description: 'Origen de la lectura. Actualmente se utiliza el simulador.',
  })
  origen!: OrigenLectura;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-25T13:00:00.000Z',
  })
  ocurridaEn!: string;
}

export class DeteccionRespuestaDto extends EvidenciaDeteccionRespuestaDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  carrilId!: string;

  @ApiProperty({
    enum: ['ACEPTADA', 'PENDIENTE_REVISION'],
    example: 'PENDIENTE_REVISION',
  })
  estado!: EstadoDeteccion;

  @ApiProperty({
    type: String,
    format: 'uuid',
    nullable: true,
    example: null,
    description: 'Identificador de la alerta de discrepancia, si se generó',
  })
  alertaId!: string | null;

  @ApiProperty({
    minimum: 0,
    maximum: 1,
    example: 0.8,
    description: 'Umbral de confianza configurado en la sede',
  })
  umbralAplicado!: number;
}

export class DeteccionValidadaRespuestaDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  id!: string;

  @ApiProperty({ example: 'ABC123' })
  placaLeida!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'ABC124',
  })
  placaFinal!: string | null;

  @ApiProperty({
    minimum: 0,
    maximum: 1,
    example: 0.35,
  })
  confianza!: number;

  @ApiProperty({
    enum: ['ACEPTADA', 'CORREGIDA'],
    example: 'CORREGIDA',
  })
  estado!: EstadoDeteccion;

  @ApiProperty({ example: true })
  lecturaManual!: boolean;

  @ApiProperty({
    type: String,
    format: 'uuid',
    nullable: true,
    example: '550e8400-e29b-41d4-a716-446655440005',
  })
  corregidaPorId!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'La cámara confundió el 3 con el 4',
  })
  motivoCorreccion!: string | null;
}
