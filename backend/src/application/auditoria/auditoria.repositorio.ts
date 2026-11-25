export interface FiltrosAuditoria {
  usuarioId?: string;
  accion?: string;
  entidad?: string;
  entidadId?: string;
  desde?: Date;
  hasta?: Date;
  pagina: number;
  limite: number;
}

export interface RegistroAuditoriaConsultado {
  id: string;
  usuarioId: string | null;
  usuario: {
    id: string;
    nombre: string;
    rol: string;
  } | null;
  accion: string;
  entidad: string;
  entidadId: string | null;
  datosAnteriores: Record<string, string | number | boolean | null> | null;
  datosNuevos: Record<string, string | number | boolean | null> | null;
  ocurridaEn: Date;
}

export interface ResultadoAuditoria {
  datos: RegistroAuditoriaConsultado[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface AuditoriaRepositorio {
  listar(filtros: FiltrosAuditoria): Promise<ResultadoAuditoria>;
}

export const AUDITORIA_REPOSITORIO = Symbol('AUDITORIA_REPOSITORIO');
