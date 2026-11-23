import { Inject, Injectable } from '@nestjs/common';
import { RELOJ } from '../../domain/tiempo/reloj';
import type { Reloj } from '../../domain/tiempo/reloj';
import { TipoVehiculo, normalizarPlaca } from '../../domain/vehiculos/placa';
import type { CobroDelDia } from './ingreso.repositorio';
import { SALIDA_REPOSITORIO } from './salida.repositorio';
import type { SalidaRepositorio } from './salida.repositorio';
import { NOTIFICADOR_ACCESOS } from './notificador-accesos';
import type { NotificadorAccesos } from './notificador-accesos';

export interface SolicitudSalida {
  placa: string;
  confianza?: number;
  carrilId?: string;
}

export interface ResultadoSalida {
  autorizado: boolean;
  barrera: 'ABIERTA' | 'CERRADA';
  motivo: string;
  placa: string;
  tipoVehiculo: TipoVehiculo | null;
  espacioLiberado: string | null;
  minutosDentro: number | null;
  cobrosPendientes: CobroDelDia[];
}

@Injectable()
export class RegistrarSalidaUseCase {
  constructor(
    @Inject(SALIDA_REPOSITORIO)
    private readonly repositorio: SalidaRepositorio,
    @Inject(RELOJ) private readonly reloj: Reloj,
    @Inject(NOTIFICADOR_ACCESOS)
    private readonly notificador: NotificadorAccesos,
  ) {}

  async ejecutar(solicitud: SolicitudSalida): Promise<ResultadoSalida> {
    const resultado = await this.decidir(solicitud);
    // decidir() ya persistió (también los rechazos), así que el aviso nunca se adelanta a la base de datos.
    await this.notificador.salidaRegistrada(resultado);
    return resultado;
  }

  private async decidir(solicitud: SolicitudSalida): Promise<ResultadoSalida> {
    const ahora = this.reloj.ahora();
    const placa = normalizarPlaca(solicitud.placa);
    const sede = await this.repositorio.sedeOperativa();
    const carrilId = await this.repositorio.carrilDeSalida(
      sede.id,
      solicitud.carrilId,
    );

    const denegar = async (
      motivo: string,
      tipoVehiculo: TipoVehiculo | null = null,
      cobrosPendientes: CobroDelDia[] = [],
    ): Promise<ResultadoSalida> => {
      await this.repositorio.registrarSalidaDenegada({
        sedeId: sede.id,
        carrilId,
        placa,
        motivo,
        ocurridoEn: ahora,
      });
      return {
        autorizado: false,
        barrera: 'CERRADA',
        motivo,
        placa,
        tipoVehiculo,
        espacioLiberado: null,
        minutosDentro: null,
        cobrosPendientes,
      };
    };

    if ((solicitud.confianza ?? 1) < sede.umbralConfianza) {
      return denegar('BAJA CONFIANZA: REQUIERE VALIDACIÓN MANUAL');
    }

    const permanencia = await this.repositorio.permanenciaActiva(placa);
    if (!permanencia) {
      return denegar('LA PLACA NO FIGURA ADENTRO');
    }

    await this.repositorio.garantizarCobrosPorCambioDeDia({
      sedeId: sede.id,
      placa,
      vehiculoId: permanencia.vehiculoId,
      tipo: permanencia.tipo,
      ingresoEn: permanencia.ingresoEn,
      verificadoEn: ahora,
      zonaHoraria: sede.zonaHoraria,
      inicioDiaOperativo: sede.inicioDiaOperativo,
      inicioFranjaDiurna: sede.inicioFranjaDiurna,
      inicioFranjaNocturna: sede.inicioFranjaNocturna,
    });

    // Se revisan todos los cobros pendientes de la placa, no solo el de hoy:
    // un carro que entró ayer y no pagó tampoco puede salir.
    const pendientes = await this.repositorio.cobrosPendientes(placa, sede.id);
    if (pendientes.length > 0) {
      const total = pendientes.reduce((suma, c) => suma + c.valor, 0);
      return denegar(
        `COBRO PENDIENTE DE $${total.toLocaleString('es-CO')}: DEBE PAGAR ANTES DE SALIR`,
        permanencia.tipo,
        pendientes,
      );
    }

    const registrada = await this.repositorio.registrarSalida({
      sedeId: sede.id,
      carrilId,
      placa,
      permanencia,
      ocurridoEn: ahora,
    });
    if (!registrada) {
      return denegar('LA PLACA NO FIGURA ADENTRO', permanencia.tipo);
    }

    return {
      autorizado: true,
      barrera: 'ABIERTA',
      motivo:
        permanencia.tipo === 'MOTO'
          ? 'SALIDA SIN COBRO (MOTO)'
          : 'SALIDA AUTORIZADA: COBRO PAGADO',
      placa,
      tipoVehiculo: permanencia.tipo,
      espacioLiberado: permanencia.espacioCodigo,
      minutosDentro: Math.floor(
        (ahora.getTime() - permanencia.ingresoEn.getTime()) / 60000,
      ),
      cobrosPendientes: [],
    };
  }
}
