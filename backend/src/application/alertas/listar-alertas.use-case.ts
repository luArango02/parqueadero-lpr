import { Inject, Injectable } from '@nestjs/common';
import { EstadoAlerta, TipoAlerta } from '../../domain/alertas/alerta';
import { normalizarPlaca } from '../../domain/vehiculos/placa';
import { ALERTA_REPOSITORIO } from './alerta.repositorio';
import type { AlertaRegistrada, AlertaRepositorio } from './alerta.repositorio';

export interface ConsultaAlertas {
  estado?: EstadoAlerta;
  tipo?: TipoAlerta;
  placa?: string;
  limite?: number;
}

const LIMITE_POR_DEFECTO = 50;

@Injectable()
export class ListarAlertasUseCase {
  constructor(
    @Inject(ALERTA_REPOSITORIO) private readonly repositorio: AlertaRepositorio,
  ) {}

  ejecutar(consulta: ConsultaAlertas): Promise<AlertaRegistrada[]> {
    return this.repositorio.listar({
      estado: consulta.estado,
      tipo: consulta.tipo,
      placa: consulta.placa ? normalizarPlaca(consulta.placa) : undefined,
      limite: consulta.limite ?? LIMITE_POR_DEFECTO,
    });
  }
}
