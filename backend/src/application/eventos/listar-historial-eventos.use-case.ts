import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  ESTADOS_HISTORIAL,
  HISTORIAL_EVENTOS_REPOSITORIO,
  TIPOS_HISTORIAL,
} from './historial-eventos.repositorio';
import type {
  EstadoHistorial,
  HistorialEventosRepositorio,
  ResultadoHistorial,
  TipoHistorial,
} from './historial-eventos.repositorio';

export interface ConsultaHistorial {
  placa?: string;
  tipo?: TipoHistorial;
  estado?: EstadoHistorial;
  desde?: string;
  hasta?: string;
  pagina?: number;
  limite?: number;
}

@Injectable()
export class ListarHistorialEventosUseCase {
  constructor(
    @Inject(HISTORIAL_EVENTOS_REPOSITORIO)
    private readonly repositorio: HistorialEventosRepositorio,
  ) {}

  ejecutar(consulta: ConsultaHistorial): Promise<ResultadoHistorial> {
    const pagina = consulta.pagina ?? 1;
    const limite = consulta.limite ?? 20;

    if (
      !Number.isInteger(pagina) ||
      pagina < 1 ||
      pagina > 1000 ||
      !Number.isInteger(limite) ||
      limite < 1 ||
      limite > 100
    ) {
      throw new BadRequestException('Paginacion invalida.');
    }

    if (consulta.tipo && !TIPOS_HISTORIAL.includes(consulta.tipo)) {
      throw new BadRequestException('Tipo de evento invalido.');
    }

    if (consulta.estado && !ESTADOS_HISTORIAL.includes(consulta.estado)) {
      throw new BadRequestException('Estado de evento invalido.');
    }

    const placa = consulta.placa?.trim().toUpperCase();

    if (
      consulta.placa !== undefined &&
      (!placa || !/^[A-Z0-9]{1,10}$/.test(placa))
    ) {
      throw new BadRequestException('Filtro de placa invalido.');
    }

    const desde = consulta.desde ? new Date(consulta.desde) : undefined;

    const hasta = consulta.hasta ? new Date(consulta.hasta) : undefined;

    if (
      (desde && !Number.isFinite(desde.getTime())) ||
      (hasta && !Number.isFinite(hasta.getTime()))
    ) {
      throw new BadRequestException('Fecha invalida.');
    }

    if (desde && hasta && desde > hasta) {
      throw new BadRequestException(
        'La fecha desde no puede ser posterior a hasta.',
      );
    }

    return this.repositorio.listar({
      placa,
      tipo: consulta.tipo,
      estado: consulta.estado,
      desde,
      hasta,
      pagina,
      limite,
    });
  }
}
