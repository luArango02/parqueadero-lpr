export type TipoVehiculo = 'CARRO' | 'MOTO';

const FORMATO_CARRO = /^[A-Z]{3}\d{3}$/;
// Motos: AAA12A (actual) o AAA12 (antigua).
const FORMATO_MOTO = /^[A-Z]{3}\d{2}[A-Z]?$/;

export function normalizarPlaca(placa: string): string {
  return placa.toUpperCase().replace(/[\s-]/g, '');
}

/** Devuelve null cuando el formato no se reconoce: en ese caso decide el operador. */
export function clasificarPorFormato(placa: string): TipoVehiculo | null {
  if (FORMATO_CARRO.test(placa)) return 'CARRO';
  if (FORMATO_MOTO.test(placa)) return 'MOTO';
  return null;
}
