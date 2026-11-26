import { ApiProperty } from '@nestjs/swagger';
import { ESTADOS_HISTORIAL } from '../../../../application/eventos/historial-eventos.repositorio';
import type { EstadoHistorial } from '../../../../application/eventos/historial-eventos.repositorio';
import { EventoRecienteRespuestaDto } from './evento-respuesta.dto';
import { PaginacionRespuestaDto } from './paginacion-respuesta.dto';

export class EventoHistorialRespuestaDto extends EventoRecienteRespuestaDto {
  @ApiProperty({
    type: String,
    enum: [...ESTADOS_HISTORIAL],
    example: 'AUTORIZADO',
    description: 'Estado del acceso, cobro relacionado con el pago o alerta',
  })
  estado!: EstadoHistorial;
}

export class HistorialEventosRespuestaDto extends PaginacionRespuestaDto {
  @ApiProperty({
    type: () => EventoHistorialRespuestaDto,
    isArray: true,
    description: 'Eventos que corresponden a la página consultada',
  })
  datos!: EventoHistorialRespuestaDto[];
}
