import { ApiProperty } from '@nestjs/swagger';
import {
  ESTADOS_ALERTA,
  TIPOS_ALERTA,
} from '../../../../domain/alertas/alerta';
import type {
  EstadoAlerta,
  TipoAlerta,
} from '../../../../domain/alertas/alerta';
import { EvidenciaDeteccionRespuestaDto } from './deteccion-respuesta.dto';

export class ResponsableAlertaRespuestaDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440005',
  })
  id!: string;

  @ApiProperty({
    example: 'Operador de parqueadero',
  })
  nombre!: string;
}

export class AlertaRespuestaDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440006',
  })
  id!: string;

  @ApiProperty({
    enum: TIPOS_ALERTA,
    example: 'DISCREPANCIA_TIPO',
  })
  tipo!: TipoAlerta;

  @ApiProperty({
    enum: ESTADOS_ALERTA,
    example: 'ABIERTA',
  })
  estado!: EstadoAlerta;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'ABC123',
  })
  placa!: string | null;

  @ApiProperty({
    example:
      'La placa ABC123 está clasificada como CARRO, pero la clasificación visual indica MOTO',
  })
  detalle!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-25T13:00:00.000Z',
  })
  creadaEn!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    example: null,
  })
  resueltaEn!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: null,
  })
  resolucion!: string | null;

  @ApiProperty({
    type: ResponsableAlertaRespuestaDto,
    nullable: true,
    example: null,
  })
  resueltaPor!: ResponsableAlertaRespuestaDto | null;

  @ApiProperty({
    type: EvidenciaDeteccionRespuestaDto,
    nullable: true,
    description: 'Detección asociada a la alerta, cuando existe',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440003',
      placaLeida: 'ABC123',
      confianza: 0.95,
      tipoVisual: 'MOTO',
      origen: 'SIMULADOR',
      ocurridaEn: '2026-11-25T13:00:00.000Z',
    },
  })
  deteccion!: EvidenciaDeteccionRespuestaDto | null;
}
