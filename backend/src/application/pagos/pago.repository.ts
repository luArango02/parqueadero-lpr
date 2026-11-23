
export interface SolicitudRegistroPago {
  cobroId: string;
  referencia: string;
  registradoPorId: string;
}

export interface PagoRegistrado {
  id: string;
  cobroId: string;
  referencia: string;
  medio: 'EFECTIVO';
  valor: string;
  estadoCobro: 'PAGADO';
  pagadoEn: Date;
  registradoPorId: string | null;
}

export interface PagoRepository {
  registrarEfectivo(
    solicitud: SolicitudRegistroPago,
  ): Promise<PagoRegistrado>;
}

export const PAGO_REPOSITORY = Symbol('PAGO_REPOSITORY');
