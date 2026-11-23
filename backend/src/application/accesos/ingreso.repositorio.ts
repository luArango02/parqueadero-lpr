import { TipoAlerta } from '../../domain/alertas/alerta';
import { ConfigHorario, Franja } from '../../domain/tiempo/reglas-horario';
import { TipoVehiculo } from '../../domain/vehiculos/placa';

export interface SedeOperativa extends ConfigHorario {
  id: string;
  umbralConfianza: number;
}

export interface CobroDelDia {
  id: string;
  valor: number;
  franja: Franja;
  estado: 'PENDIENTE' | 'PAGADO' | 'ANULADO' | 'VENCIDO';
  diaOperativo: string;
}

export interface TarifaVigente {
  id: string;
  valor: number;
}

export interface DatosIngreso {
  sedeId: string;
  carrilId: string;
  placa: string;
  tipo: TipoVehiculo;
  ocurridoEn: Date;
  cobroNuevo: {
    tarifaId: string;
    valor: number;
    franja: Franja;
    diaOperativo: string;
  } | null;
}

export interface IngresoRegistrado {
  espacioCodigo: string;
  cobro: CobroDelDia | null;
}

export interface DatosDenegado {
  sedeId: string;
  carrilId: string;
  placa: string;
  motivo: string;
  ocurridoEn: Date;
  alertaAntiPassback: boolean;
}

// Puerto: el caso de uso no sabe que detrás hay Prisma y PostgreSQL.
export interface IngresoRepositorio {
  sedeOperativa(): Promise<SedeOperativa>;
  carrilDeEntrada(sedeId: string, carrilId?: string): Promise<string>;
  tipoRegistrado(placa: string): Promise<TipoVehiculo | null>;
  estaAdentro(placa: string): Promise<boolean>;
  /** ¿Hay una alerta abierta de ese tipo para la placa? Por ejemplo, una discrepancia sin resolver. */
  alertaAbierta(placa: string, tipo: TipoAlerta): Promise<boolean>;
  cobroDelDia(
    placa: string,
    sedeId: string,
    diaOperativo: string,
  ): Promise<CobroDelDia | null>;
  tarifaVigente(
    sedeId: string,
    tipo: TipoVehiculo,
    franja: Franja,
    instante: Date,
  ): Promise<TarifaVigente>;
  /** Devuelve null si no hay espacio libre compatible. */
  registrarIngreso(datos: DatosIngreso): Promise<IngresoRegistrado | null>;
  registrarDenegado(datos: DatosDenegado): Promise<void>;
}

export const INGRESO_REPOSITORIO = Symbol('INGRESO_REPOSITORIO');
