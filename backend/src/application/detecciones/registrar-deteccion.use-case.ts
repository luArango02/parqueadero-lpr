import { Inject, Injectable } from '@nestjs/common';
import { estadoSegunConfianza } from '../../domain/detecciones/deteccion';
import { RELOJ } from '../../domain/tiempo/reloj';
import type { Reloj } from '../../domain/tiempo/reloj';
import { TipoVehiculo } from '../../domain/vehiculos/placa';
import { DETECCION_REPOSITORIO } from './deteccion.repositorio';
import type {
  DeteccionRegistrada,
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

export interface ResultadoDeteccion extends DeteccionRegistrada {
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

    const deteccion = await this.repositorio.guardar({
      carrilId,
      placaLeida: lectura.placa,
      confianza: lectura.confianza,
      tipoVisual: lectura.tipoVisual,
      origen: lectura.origen,
      estado: estadoSegunConfianza(lectura.confianza, sede.umbralConfianza),
      ocurridaEn: lectura.ocurridaEn,
    });
    return { ...deteccion, umbralAplicado: sede.umbralConfianza };
  }
}
