import { Inject, Injectable } from '@nestjs/common';
import {
  INGRESO_REPOSITORIO,
  type IngresoRepositorio,
} from '../accesos/ingreso.repositorio';
import { calcularDiaOperativo } from '../../domain/tiempo/reglas-horario';
import { RELOJ, type Reloj } from '../../domain/tiempo/reloj';
import { normalizarPlaca } from '../../domain/vehiculos/placa';

export interface ResultadoConsultaPase {
  placa: string;
  sedeId: string;
  diaOperativo: string;
  vigente: boolean;
  cobroId: string | null;
  estadoCobro: string | null;
  motivo: string;
}

@Injectable()
export class ConsultarPaseVigenteUseCase {
  constructor(
    @Inject(INGRESO_REPOSITORIO)
    private readonly repositorio: IngresoRepositorio,
    @Inject(RELOJ)
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(placaRecibida: string): Promise<ResultadoConsultaPase> {
    const placa = normalizarPlaca(placaRecibida);

    const sede = await this.repositorio.sedeOperativa();

    const diaOperativo = calcularDiaOperativo(this.reloj.ahora(), sede);

    const cobro = await this.repositorio.cobroDelDia(
      placa,
      sede.id,
      diaOperativo,
    );

    const vigente = cobro?.estado === 'PAGADO';

    return {
      placa,
      sedeId: sede.id,
      diaOperativo,
      vigente,
      cobroId: cobro?.id ?? null,
      estadoCobro: cobro?.estado ?? null,
      motivo: vigente
        ? 'PASE VIGENTE'
        : cobro
          ? 'PASE NO VIGENTE: COBRO NO PAGADO'
          : 'SIN PASE PARA EL DIA OPERATIVO',
    };
  }
}
