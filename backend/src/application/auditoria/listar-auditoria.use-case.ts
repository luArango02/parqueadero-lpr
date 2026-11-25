import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AUDITORIA_REPOSITORIO } from './auditoria.repositorio';
import type {
  AuditoriaRepositorio,
  FiltrosAuditoria,
  ResultadoAuditoria,
} from './auditoria.repositorio';

export interface ConsultaAuditoria {
  usuarioId?: string;
  accion?: string;
  entidad?: string;
  entidadId?: string;
  desde?: string;
  hasta?: string;
  pagina?: number;
  limite?: number;
}

@Injectable()
export class ListarAuditoriaUseCase {
  constructor(
    @Inject(AUDITORIA_REPOSITORIO)
    private readonly repositorio: AuditoriaRepositorio,
  ) {}

  ejecutar(consulta: ConsultaAuditoria): Promise<ResultadoAuditoria> {
    const pagina = consulta.pagina ?? 1;
    const limite = consulta.limite ?? 20;

    if (
      !Number.isInteger(pagina) ||
      pagina < 1 ||
      pagina > 10000 ||
      !Number.isInteger(limite) ||
      limite < 1 ||
      limite > 100
    ) {
      throw new BadRequestException('Paginacion invalida.');
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

    const filtros: FiltrosAuditoria = {
      usuarioId: consulta.usuarioId,
      accion: consulta.accion?.trim(),
      entidad: consulta.entidad?.trim(),
      entidadId: consulta.entidadId,
      desde,
      hasta,
      pagina,
      limite,
    };

    return this.repositorio.listar(filtros);
  }
}
