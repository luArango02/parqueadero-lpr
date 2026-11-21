import { Injectable } from '@nestjs/common';
import {
  CapturaCarril,
  LectorPlacas,
  LecturaPlaca,
} from '../../application/detecciones/lector-placas';
import { normalizarPlaca } from '../../domain/vehiculos/placa';

/**
 * Adaptador del puerto LectorPlacas para el MVP. No analiza imágenes ni hace
 * OCR: devuelve los datos que el carril simula, marcados con origen SIMULADOR.
 */
@Injectable()
export class SimuladorLectorPlacas implements LectorPlacas {
  leer(captura: CapturaCarril): Promise<LecturaPlaca> {
    return Promise.resolve({
      placa: normalizarPlaca(captura.placa),
      confianza: captura.confianza,
      tipoVisual: captura.tipoVisual ?? null,
      ocurridaEn: captura.ocurridaEn,
      origen: 'SIMULADOR',
    });
  }
}
