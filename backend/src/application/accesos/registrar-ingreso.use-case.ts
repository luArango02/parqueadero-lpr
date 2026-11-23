import { Inject, Injectable } from '@nestjs/common';
import { RELOJ } from '../../domain/tiempo/reloj';
import type { Reloj } from '../../domain/tiempo/reloj';
import {
  calcularDiaOperativo,
  calcularFranja,
} from '../../domain/tiempo/reglas-horario';
import {
  TipoVehiculo,
  clasificarPorFormato,
  normalizarPlaca,
} from '../../domain/vehiculos/placa';
import { INGRESO_REPOSITORIO } from './ingreso.repositorio';
import type { CobroDelDia, IngresoRepositorio } from './ingreso.repositorio';
import { NOTIFICADOR_ACCESOS } from './notificador-accesos';
import type { NotificadorAccesos } from './notificador-accesos';

export interface SolicitudIngreso {
  placa: string;
  confianza?: number;
  carrilId?: string;
}

export interface ResultadoIngreso {
  autorizado: boolean;
  barrera: 'ABIERTA' | 'CERRADA';
  motivo: string;
  placa: string;
  tipoVehiculo: TipoVehiculo | null;
  espacio: string | null;
  cobro: CobroDelDia | null;
  reingreso: boolean;
}

@Injectable()
export class RegistrarIngresoUseCase {
  constructor(
    @Inject(INGRESO_REPOSITORIO)
    private readonly repositorio: IngresoRepositorio,
    @Inject(RELOJ) private readonly reloj: Reloj,
    @Inject(NOTIFICADOR_ACCESOS)
    private readonly notificador: NotificadorAccesos,
  ) {}

  async ejecutar(solicitud: SolicitudIngreso): Promise<ResultadoIngreso> {
    const resultado = await this.decidir(solicitud);
    // decidir() ya persistió (también los rechazos), así que el aviso nunca se adelanta a la base de datos.
    await this.notificador.ingresoRegistrado(resultado);
    return resultado;
  }

  private async decidir(
    solicitud: SolicitudIngreso,
  ): Promise<ResultadoIngreso> {
    const ahora = this.reloj.ahora();
    const placa = normalizarPlaca(solicitud.placa);
    const sede = await this.repositorio.sedeOperativa();
    const carrilId = await this.repositorio.carrilDeEntrada(
      sede.id,
      solicitud.carrilId,
    );

    const denegar = async (
      motivo: string,
      tipoVehiculo: TipoVehiculo | null,
      alertaAntiPassback = false,
    ): Promise<ResultadoIngreso> => {
      await this.repositorio.registrarDenegado({
        sedeId: sede.id,
        carrilId,
        placa,
        motivo,
        ocurridoEn: ahora,
        alertaAntiPassback,
      });
      return {
        autorizado: false,
        barrera: 'CERRADA',
        motivo,
        placa,
        tipoVehiculo,
        espacio: null,
        cobro: null,
        reingreso: false,
      };
    };

    // RN-14: con baja confianza o formato desconocido decide el operador.
    if ((solicitud.confianza ?? 1) < sede.umbralConfianza) {
      return denegar('BAJA CONFIANZA: REQUIERE VALIDACIÓN MANUAL', null);
    }
    const tipo =
      (await this.repositorio.tipoRegistrado(placa)) ??
      clasificarPorFormato(placa);
    if (!tipo) {
      return denegar('PLACA NO RECONOCIDA: REQUIERE VALIDACIÓN MANUAL', null);
    }

    // RN-13 / TC-15: mientras una discrepancia carro/moto siga abierta, no se asigna espacio.
    if (await this.repositorio.alertaAbierta(placa, 'DISCREPANCIA_TIPO')) {
      return denegar(
        'DISCREPANCIA CARRO/MOTO: REQUIERE VALIDACIÓN DEL OPERADOR',
        tipo,
      );
    }

    if (await this.repositorio.estaAdentro(placa)) {
      return denegar('LA PLACA YA FIGURA ADENTRO (ANTI-PASSBACK)', tipo, true);
    }

    const diaOperativo = calcularDiaOperativo(ahora, sede);
    const cobroExistente = await this.repositorio.cobroDelDia(
      placa,
      sede.id,
      diaOperativo,
    );

    let cobroNuevo: Parameters<
      IngresoRepositorio['registrarIngreso']
    >[0]['cobroNuevo'] = null;
    if (!cobroExistente) {
      const franja = calcularFranja(ahora, sede);
      const tarifa = await this.repositorio.tarifaVigente(
        sede.id,
        tipo,
        franja,
        ahora,
      );
      // RN-01: con tarifa en $0 (motos) no se genera cobro.
      if (tarifa.valor > 0) {
        cobroNuevo = {
          tarifaId: tarifa.id,
          valor: tarifa.valor,
          franja,
          diaOperativo,
        };
      }
    }

    const registrado = await this.repositorio.registrarIngreso({
      sedeId: sede.id,
      carrilId,
      placa,
      tipo,
      ocurridoEn: ahora,
      cobroNuevo,
    });
    if (!registrado) {
      return denegar(`LLENO: SIN ESPACIO PARA ${tipo}`, tipo);
    }

    const cobro = registrado.cobro ?? cobroExistente;
    return {
      autorizado: true,
      barrera: 'ABIERTA',
      motivo: this.motivoAutorizado(tipo, cobroExistente, cobro),
      placa,
      tipoVehiculo: tipo,
      espacio: registrado.espacioCodigo,
      cobro,
      reingreso: cobroExistente !== null,
    };
  }

  private motivoAutorizado(
    tipo: TipoVehiculo,
    cobroExistente: CobroDelDia | null,
    cobro: CobroDelDia | null,
  ): string {
    if (cobroExistente?.estado === 'PAGADO')
      return 'REINGRESO CON PASE VIGENTE';
    if (cobroExistente) return 'REINGRESO: COBRO DEL DÍA PENDIENTE';
    if (!cobro) return `INGRESO SIN COBRO (${tipo})`;
    return `INGRESO CON COBRO ${cobro.franja} PENDIENTE`;
  }
}
