
import { Inject, Injectable } from '@nestjs/common';
import {
  PAGO_REPOSITORY,
  type PagoRegistrado,
  type PagoRepository,
  type SolicitudRegistroPago,
} from './pago.repository';

@Injectable()
export class RegistrarPagoEfectivoUseCase {
  constructor(
    @Inject(PAGO_REPOSITORY)
    private readonly repositorio: PagoRepository,
  ) {}

  ejecutar(solicitud: SolicitudRegistroPago): Promise<PagoRegistrado> {
    return this.repositorio.registrarEfectivo(solicitud);
  }
}
