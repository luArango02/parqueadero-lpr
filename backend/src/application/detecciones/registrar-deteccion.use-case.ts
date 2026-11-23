import { Inject, Injectable } from '@nestjs/common';
import {
  detalleDiscrepancia,
  hayDiscrepancia,
} from '../../domain/alertas/alerta';
import { estadoSegunConfianza } from '../../domain/detecciones/deteccion';
import { RELOJ } from '../../domain/tiempo/reloj';
import type { Reloj } from '../../domain/tiempo/reloj';
import {
  TipoVehiculo,
  clasificarPorFormato,
} from '../../domain/vehiculos/placa';
import { DETECCION_REPOSITORIO } from './deteccion.repositorio';
import type {
  DatosDiscrepancia,
  DeteccionGuardada,
  DeteccionRepositorio,
} from './deteccion.repositorio';
import { LECTOR_PLACAS } from './lector-placas';
import type { LectorPlacas } from './lector-placas';

export interface SolicitudDeteccion {
  placa: string;
  confianza: number;
  tipoVisual?: TipoVehiculo;
  carrilId?: string;
  ocurridaEn?: Date;
}

export interface ResultadoDeteccion extends DeteccionGuardada {
  umbralAplicado: number;
}

@Injectable()
export class RegistrarDeteccionUseCase {
  constructor(
    @Inject(DETECCION_REPOSITORIO)
    private readonly repositorio: DeteccionRepositorio,
    @Inject(LECTOR_PLACAS) private readonly lector: LectorPlacas,
    @Inject(RELOJ) private readonly reloj: Reloj,
  ) {}

  async ejecutar(solicitud: SolicitudDeteccion): Promise<ResultadoDeteccion> {
    const sede = await this.repositorio.sedeDeLectura();
    const carrilId = await this.repositorio.carrilDeLectura(
      sede.id,
      solicitud.carrilId,
    );

    const lectura = await this.lector.leer({
      carrilId,
      ocurridaEn: solicitud.ocurridaEn ?? this.reloj.ahora(),
      placa: solicitud.placa,
      confianza: solicitud.confianza,
      tipoVisual: solicitud.tipoVisual,
    });

    const estado = estadoSegunConfianza(
      lectura.confianza,
      sede.umbralConfianza,
    );

    // RN-13: solo se compara una lectura confiable; si la placa es dudosa, primero la valida el operador.
    let discrepancia: DatosDiscrepancia | null = null;
    const tipoVisual = lectura.tipoVisual;
    if (estado === 'ACEPTADA' && tipoVisual) {
      const tipoPorPlaca =
        (await this.repositorio.tipoRegistrado(lectura.placa)) ??
        clasificarPorFormato(lectura.placa);
      if (tipoPorPlaca && hayDiscrepancia(tipoPorPlaca, tipoVisual)) {
        discrepancia = {
          sedeId: sede.id,
          placa: lectura.placa,
          detalle: detalleDiscrepancia(
            lectura.placa,
            tipoPorPlaca,
            tipoVisual,
            lectura.confianza,
          ),
        };
      }
    }

    const deteccion = await this.repositorio.guardar(
      {
        carrilId,
        placaLeida: lectura.placa,
        confianza: lectura.confianza,
        tipoVisual: lectura.tipoVisual,
        origen: lectura.origen,
        estado,
        ocurridaEn: lectura.ocurridaEn,
      },
      discrepancia,
    );
    return { ...deteccion, umbralAplicado: sede.umbralConfianza };
  }
}
