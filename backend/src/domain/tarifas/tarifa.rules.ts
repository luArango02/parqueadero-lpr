export type TipoVehiculoTarifa = 'CARRO' | 'MOTO';

export interface ValoresTarifa {
  tipoVehiculo: TipoVehiculoTarifa;
  valorDiurno: number;
  valorNocturno: number;
}

export class TarifaInvalidaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TarifaInvalidaError';
  }
}

export function validarValorTarifa(valor: number): void {
  if (!Number.isFinite(valor) || valor < 0) {
    throw new TarifaInvalidaError(
      'El valor de la tarifa debe ser un número finito mayor o igual a cero.',
    );
  }

  // PostgreSQL Decimal(12,2): máximo 9.999.999.999,99.
  const VALOR_MAXIMO = 9999999999.99;

  if (valor > VALOR_MAXIMO) {
    throw new TarifaInvalidaError(
      'El valor de la tarifa supera el máximo permitido de 9999999999.99.',
    );
  }

  // Validar como máximo dos decimales.
  // La tolerancia evita rechazar valores válidos por precisión binaria.
  const centavos = valor * 100;

  if (Math.abs(centavos - Math.round(centavos)) > 0.000001) {
    throw new TarifaInvalidaError(
      'El valor de la tarifa debe tener máximo dos decimales.',
    );
  }
}

export function validarRelacionTarifas(tarifas: ValoresTarifa): void {
  const { tipoVehiculo, valorDiurno, valorNocturno } = tarifas;

  validarValorTarifa(valorDiurno);
  validarValorTarifa(valorNocturno);

  // RN-01: motocicletas con tarifa gratuita configurable.
  if (tipoVehiculo === 'MOTO' && valorDiurno === 0 && valorNocturno === 0) {
    return;
  }

  // RN-02: la tarifa nocturna debe ser estrictamente menor.
  if (valorNocturno >= valorDiurno) {
    throw new TarifaInvalidaError(
      'La tarifa nocturna debe ser menor que la tarifa diurna.',
    );
  }
}
