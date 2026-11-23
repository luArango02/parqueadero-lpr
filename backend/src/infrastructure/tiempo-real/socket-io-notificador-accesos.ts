import { Injectable, Logger } from '@nestjs/common';
import { NotificadorAccesos } from '../../application/accesos/notificador-accesos';
import { ResultadoIngreso } from '../../application/accesos/registrar-ingreso.use-case';
import { ResultadoSalida } from '../../application/accesos/registrar-salida.use-case';
import { EVENTOS, EventosGateway } from './eventos.gateway';
import { ConsultaOcupacion } from './consulta-ocupacion';

// Adapter del puerto NotificadorAccesos sobre Socket.IO.
@Injectable()
export class SocketIoNotificadorAccesos implements NotificadorAccesos {
  private readonly logger = new Logger(SocketIoNotificadorAccesos.name);

  constructor(
    private readonly gateway: EventosGateway,
    private readonly ocupacion: ConsultaOcupacion,
  ) {}

  async ingresoRegistrado(resultado: ResultadoIngreso): Promise<void> {
    const ocurridoEn = new Date().toISOString();
    this.barrera('ENTRADA', resultado, ocurridoEn);
    if (!resultado.autorizado) return;

    this.gateway.emitir(EVENTOS.ingreso, {
      placa: resultado.placa,
      tipoVehiculo: resultado.tipoVehiculo,
      espacio: resultado.espacio,
      cobro: resultado.cobro,
      reingreso: resultado.reingreso,
      ocurridoEn,
    });
    await this.ocupacionActual();
  }

  async salidaRegistrada(resultado: ResultadoSalida): Promise<void> {
    const ocurridoEn = new Date().toISOString();
    this.barrera('SALIDA', resultado, ocurridoEn);
    if (!resultado.autorizado) return;

    this.gateway.emitir(EVENTOS.salida, {
      placa: resultado.placa,
      tipoVehiculo: resultado.tipoVehiculo,
      espacioLiberado: resultado.espacioLiberado,
      minutosDentro: resultado.minutosDentro,
      ocurridoEn,
    });
    await this.ocupacionActual();
  }

  private barrera(
    carril: 'ENTRADA' | 'SALIDA',
    resultado: ResultadoIngreso | ResultadoSalida,
    ocurridoEn: string,
  ): void {
    this.gateway.emitir(EVENTOS.barrera, {
      carril,
      estado: resultado.barrera,
      motivo: resultado.motivo,
      placa: resultado.placa,
      ocurridoEn,
    });
  }

  // Si falla el conteo no se cae la petición: el ingreso o la salida ya quedaron guardados.
  private async ocupacionActual(): Promise<void> {
    try {
      this.gateway.emitir(EVENTOS.ocupacion, await this.ocupacion.resumen());
    } catch (error) {
      this.logger.warn(`No se pudo emitir la ocupación: ${String(error)}`);
    }
  }
}
