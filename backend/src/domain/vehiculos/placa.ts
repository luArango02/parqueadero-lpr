export const TIPOS_VEHICULO = ['CARRO', 'MOTO'] as const;
export type TipoVehiculo = (typeof TIPOS_VEHICULO)[number];

const FORMATO_CARRO = /^[A-Z]{3}\d{3}$/;
// Motos: AAA12A (actual) o AAA12 (antigua).
const FORMATO_MOTO = /^[A-Z]{3}\d{2}[A-Z]?$/;
const FORMATO_VALIDO = /^[A-Z0-9]{5,7}$/;

export function normalizarPlaca(placa: string): string {
  return placa.toUpperCase().replace(/[\s-]/g, '');
}

/** Válida cuando, ya normalizada, tiene entre 5 y 7 letras o números. */
export function esPlacaValida(placa: string): boolean {
  return FORMATO_VALIDO.test(placa);
}

/** Devuelve null cuando el formato no se reconoce: en ese caso decide el operador. */
export function clasificarPorFormato(placa: string): TipoVehiculo | null {
  if (FORMATO_CARRO.test(placa)) return 'CARRO';
  if (FORMATO_MOTO.test(placa)) return 'MOTO';
  return null;
}
