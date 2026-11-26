// Reglas de las pantallas de carril, sin Vue ni red: así se pueden probar solas.

/** El backend pide que el operador confirme la placa (RN-14). */
export function requiereValidacionManual(motivo: string): boolean {
  return motivo.includes('REQUIERE VALIDACIÓN MANUAL')
}

/** Sin formato de carro ni de moto: el operador también debe decir el tipo. */
export function pideTipoVehiculo(motivo: string): boolean {
  return motivo.startsWith('PLACA NO RECONOCIDA')
}

/**
 * Referencia fija por cobro: si el operador presiona dos veces o se repite la petición,
 * el backend reconoce la misma referencia y no registra un segundo pago.
 */
export function referenciaPagoEfectivo(cobroId: string): string {
  return `EFECTIVO-${cobroId}`
}

export function totalPendiente(cobros: { valor: number }[]): number {
  return cobros.reduce((suma, cobro) => suma + cobro.valor, 0)
}
