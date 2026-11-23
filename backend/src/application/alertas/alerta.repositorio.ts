import { EstadoAlerta, TipoAlerta } from '../../domain/alertas/alerta';
import { OrigenLectura } from '../../domain/detecciones/deteccion';
import { TipoVehiculo } from '../../domain/vehiculos/placa';

/** La detección que originó la alerta: es la evidencia. */
export interface EvidenciaDeteccion {
  id: string;
  placaLeida: string;
  confianza: number;
  tipoVisual: TipoVehiculo | null;
  origen: OrigenLectura;
  ocurridaEn: Date;
}

export interface AlertaRegistrada {
  id: string;
  tipo: TipoAlerta;
  estado: EstadoAlerta;
  placa: string | null;
  detalle: string;
  creadaEn: Date;
  resueltaEn: Date | null;
  resolucion: string | null;
  resueltaPor: { id: string; nombre: string } | null;
  deteccion: EvidenciaDeteccion | null;
}

export interface FiltroAlertas {
  estado?: EstadoAlerta;
  tipo?: TipoAlerta;
  placa?: string;
  limite: number;
}

export interface DatosResolucion {
  alertaId: string;
  usuarioId: string;
  resolucion: string;
  resueltaEn: Date;
  /** Solo en discrepancias: el tipo que confirma el operador queda como tipo registrado del vehículo. */
  tipoConfirmado: TipoVehiculo | null;
  /** Estado de la alerta antes de resolverla: queda en la auditoría. */
  anterior: AlertaRegistrada;
}

export interface AlertaRepositorio {
  listar(filtro: FiltroAlertas): Promise<AlertaRegistrada[]>;
  buscar(id: string): Promise<AlertaRegistrada | null>;
  /** Devuelve null si la alerta ya no estaba abierta (otra resolución se adelantó). */
  resolver(datos: DatosResolucion): Promise<AlertaRegistrada | null>;
}

export const ALERTA_REPOSITORIO = Symbol('ALERTA_REPOSITORIO');
