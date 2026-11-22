import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { estadoTrasValidacion } from '../../domain/detecciones/validacion';
import { esPlacaValida, normalizarPlaca } from '../../domain/vehiculos/placa';
import { VALIDACION_DETECCION_REPOSITORIO } from './validacion-deteccion.repositorio';
import type {
  DeteccionValidada,
  ValidacionDeteccionRepositorio,
} from './validacion-deteccion.repositorio';

export interface SolicitudValidacion {
  deteccionId: string;
  usuarioId: string;
  placa: string;
  motivo: string;
}

@Injectable()
export class ValidarDeteccionUseCase {
  constructor(
    @Inject(VALIDACION_DETECCION_REPOSITORIO)
    private readonly repositorio: ValidacionDeteccionRepositorio,
  ) {}

  // Quién puede llamar (rol) lo decide el guard del endpoint; aquí solo se registra quién lo hizo.
  async ejecutar(solicitud: SolicitudValidacion): Promise<DeteccionValidada> {
    const placaFinal = normalizarPlaca(solicitud.placa);
    if (!esPlacaValida(placaFinal)) {
      throw new BadRequestException(
        'La placa debe tener entre 5 y 7 letras o números',
      );
    }

    const deteccion = await this.repositorio.buscarDeteccion(
      solicitud.deteccionId,
    );
    if (!deteccion) {
      throw new NotFoundException('Detección no encontrada');
    }
    if (deteccion.estado !== 'PENDIENTE_REVISION') {
      throw new ConflictException('La lectura no está pendiente de revisión');
    }

    const validada = await this.repositorio.registrarValidacion({
      deteccionId: deteccion.id,
      usuarioId: solicitud.usuarioId,
      placaFinal,
      estado: estadoTrasValidacion(deteccion.placaLeida, placaFinal),
      motivo: solicitud.motivo.trim(),
      anterior: deteccion,
    });
    // Otra validación pudo adelantarse entre la consulta y la escritura.
    if (!validada) {
      throw new ConflictException(
        'La lectura ya fue validada por otro usuario',
      );
    }
    return validada;
  }
}
