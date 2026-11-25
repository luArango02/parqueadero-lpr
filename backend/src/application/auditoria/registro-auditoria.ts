export interface CambioAuditado {
  usuarioId: string;
  accion: string;
  entidad: string;
  entidadId: string | null;
  datosAnteriores?: unknown;
  datosNuevos: unknown;
}

// Puerto para dejar constancia de quién cambió qué en la configuración.
export interface RegistroAuditoria {
  registrar(cambio: CambioAuditado): Promise<void>;
}

export const REGISTRO_AUDITORIA = Symbol('REGISTRO_AUDITORIA');
