import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RELOJ } from '../../domain/tiempo/reloj';
import type { Reloj } from '../../domain/tiempo/reloj';
import { TipoVehiculo } from '../../domain/vehiculos/placa';
import { ALERTA_REPOSITORIO } from './alerta.repositorio';
import type { AlertaRegistrada, AlertaRepositorio } from './alerta.repositorio';

export interface SolicitudResolucion {
  alertaId: string;
  usuarioId: string;
  resolucion: string;
  tipoConfirmado?: TipoVehiculo;
}

@Injectable()
export class ResolverAlertaUseCase {
  constructor(
    @Inject(ALERTA_REPOSITORIO) private readonly repositorio: AlertaRepositorio,
    @Inject(RELOJ) private readonly reloj: Reloj,
  ) {}

  // Quién puede resolver (rol) lo decide el guard del endpoint; aquí solo se registra quién lo hizo.
  async ejecutar(solicitud: SolicitudResolucion): Promise<AlertaRegistrada> {
    const alerta = await this.repositorio.buscar(solicitud.alertaId);
    if (!alerta) {
      throw new NotFoundException('Alerta no encontrada');
    }
    if (alerta.estado === 'RESUELTA') {
      throw new ConflictException('La alerta ya fue resuelta');
    }

    const esDiscrepancia = alerta.tipo === 'DISCREPANCIA_TIPO';
    if (esDiscrepancia && !solicitud.tipoConfirmado) {
      throw new BadRequestException(
        'Indique el tipo de vehículo que confirma (CARRO o MOTO)',
      );
    }
    if (!esDiscrepancia && solicitud.tipoConfirmado) {
      throw new BadRequestException(
        'El tipo confirmado solo aplica a las discrepancias de tipo',
      );
    }

    const resuelta = await this.repositorio.resolver({
      alertaId: alerta.id,
      usuarioId: solicitud.usuarioId,
      resolucion: solicitud.resolucion.trim(),
      resueltaEn: this.reloj.ahora(),
      tipoConfirmado: solicitud.tipoConfirmado ?? null,
      anterior: alerta,
    });
    // Otra resolución pudo adelantarse entre la consulta y la escritura.
    if (!resuelta) {
      throw new ConflictException('La alerta ya fue resuelta por otro usuario');
    }
    return resuelta;
  }
}
