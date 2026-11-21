export type OrigenLectura = 'SIMULADOR' | 'OCR' | 'MANUAL';
export type EstadoDeteccion = 'ACEPTADA' | 'PENDIENTE_REVISION' | 'CORREGIDA';

/** RN-14: una lectura bajo el umbral de la sede queda pendiente de revisión del operador. */
export function estadoSegunConfianza(
  confianza: number,
  umbral: number,
): 'ACEPTADA' | 'PENDIENTE_REVISION' {
  return confianza < umbral ? 'PENDIENTE_REVISION' : 'ACEPTADA';
}
