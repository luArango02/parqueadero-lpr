export function estadoTrasValidacion(
  placaLeida: string,
  placaFinal: string,
): 'ACEPTADA' | 'CORREGIDA' {
  return placaFinal === placaLeida ? 'ACEPTADA' : 'CORREGIDA';
}
